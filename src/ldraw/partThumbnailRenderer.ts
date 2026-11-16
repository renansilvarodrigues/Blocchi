import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadUnifiedBrick } from './ldrawLoaderHelper';

const THUMBNAIL_SIZE = 160;
const MAX_CONCURRENT_JOBS = 3;
const MAX_CACHE_ENTRIES = 600;

const CAMERA_DIRECTION = new THREE.Vector3(1, 0.82, 1.18).normalize();
const CAMERA_MARGIN = 1.08;

export const partThumbnailCache = new Map<string, string>();

interface ThumbnailJob {
  key: string;
  partId: string;
  colorCode: number;
  resolve: (dataUrl: string | null) => void;
}

interface ThumbnailContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  modelHolder: THREE.Group;
  outlineMaterial: THREE.LineBasicMaterial;
}

const pendingThumbnails = new Map<string, Promise<string | null>>();
const jobQueue: ThumbnailJob[] = [];

let context: ThumbnailContext | null = null;
let contextFailed = false;
let activeJobs = 0;

function normalizePartId(partId: string): string {
  return partId.trim().replace(/\.dat$/i, '').toLowerCase();
}

function thumbnailKey(partId: string, colorCode: number): string {
  return `${colorCode}:${normalizePartId(partId)}`;
}

function createThumbnailContext(): ThumbnailContext | null {
  if (context) return context;
  if (contextFailed) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(1);
    renderer.setSize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.65;
    pmremGenerator.dispose();

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x30343a, 1.5);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 8, 6);
    const fillLight = new THREE.DirectionalLight(0xdce6ff, 1.0);
    fillLight.position.set(-6, 3, -3);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.85);
    rimLight.position.set(-2, 4, -8);
    scene.add(hemisphere, keyLight, fillLight, rimLight);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
    camera.up.set(0, 1, 0);

    const modelHolder = new THREE.Group();
    modelHolder.name = 'ThumbnailModelHolder';
    scene.add(modelHolder);

    const outlineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('#5a6068'),
      transparent: true,
      opacity: 0.9,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    outlineMaterial.name = 'ThumbnailOutline';

    context = {
      renderer,
      scene,
      camera,
      modelHolder,
      outlineMaterial,
    };
    return context;
  } catch (error) {
    contextFailed = true;
    console.warn('[Blocchi Thumbnails] WebGL indisponível; ícones genéricos serão usados.', error);
    return null;
  }
}

function applyThumbnailMaterials(group: THREE.Group, ctx: ThumbnailContext): void {
  // Os materiais já chegam prontos de loadUnifiedBrick, que aplica a cor
  // dinâmica somente à Cor 16 e preserva cores fixas e mapas TEXMAP.
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    } else if ((child as THREE.LineSegments).isLineSegments && child.visible) {
      (child as THREE.LineSegments).material = ctx.outlineMaterial;
    }
  });
}

function frameModel(group: THREE.Group, ctx: ThumbnailContext): boolean {
  group.updateMatrixWorld(true);

  const initialBox = new THREE.Box3().setFromObject(group);
  if (initialBox.isEmpty()) return false;

  const center = initialBox.getCenter(new THREE.Vector3());
  const radius = Math.max(initialBox.getSize(new THREE.Vector3()).length() * 0.5, 0.01);

  group.position.sub(center);
  group.updateMatrixWorld(true);

  const distance = Math.max(radius * 8, 4);
  ctx.camera.position.copy(CAMERA_DIRECTION).multiplyScalar(distance);
  ctx.camera.near = Math.max(distance - radius * 3, 0.01);
  ctx.camera.far = distance + radius * 3;
  ctx.camera.lookAt(0, 0, 0);
  ctx.camera.updateProjectionMatrix();
  ctx.camera.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(group);
  const corner = new THREE.Vector3();
  const cameraCorner = new THREE.Vector3();
  let maxX = 0;
  let maxY = 0;

  for (let ix = 0; ix < 2; ix++) {
    for (let iy = 0; iy < 2; iy++) {
      for (let iz = 0; iz < 2; iz++) {
        corner.set(
          ix === 0 ? box.min.x : box.max.x,
          iy === 0 ? box.min.y : box.max.y,
          iz === 0 ? box.min.z : box.max.z
        );
        cameraCorner.copy(corner).applyMatrix4(ctx.camera.matrixWorldInverse);
        maxX = Math.max(maxX, Math.abs(cameraCorner.x));
        maxY = Math.max(maxY, Math.abs(cameraCorner.y));
      }
    }
  }

  const halfExtent = Math.max(maxX, maxY, 0.01) * CAMERA_MARGIN;
  ctx.camera.left = -halfExtent;
  ctx.camera.right = halfExtent;
  ctx.camera.top = halfExtent;
  ctx.camera.bottom = -halfExtent;
  ctx.camera.updateProjectionMatrix();

  return true;
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: 400 });
    } else {
      window.setTimeout(resolve, 0);
    }
  });
}

async function renderPartThumbnail(
  partId: string,
  colorCode: number
): Promise<string | null> {
  const ctx = createThumbnailContext();
  if (!ctx) return null;

  await yieldToMainThread();

  let group: THREE.Group | null = null;
  try {
    group = await loadUnifiedBrick(partId, colorCode, 'procedural', false);

    applyThumbnailMaterials(group, ctx);
    ctx.modelHolder.add(group);

    if (!frameModel(group, ctx)) {
      ctx.modelHolder.remove(group);
      return null;
    }

    ctx.renderer.render(ctx.scene, ctx.camera);
    const dataUrl = ctx.renderer.domElement.toDataURL('image/png');

    ctx.modelHolder.remove(group);
    return dataUrl;
  } catch {
    if (group) ctx.modelHolder.remove(group);
    return null;
  }
}

function pumpQueue(): void {
  while (activeJobs < MAX_CONCURRENT_JOBS && jobQueue.length > 0) {
    const job = jobQueue.shift();
    if (!job) break;

    activeJobs += 1;

    void renderPartThumbnail(job.partId, job.colorCode)
      .then((dataUrl) => {
        if (dataUrl) {
          partThumbnailCache.set(job.key, dataUrl);
          while (partThumbnailCache.size > MAX_CACHE_ENTRIES) {
            const oldestKey = partThumbnailCache.keys().next().value;
            if (oldestKey === undefined) break;
            partThumbnailCache.delete(oldestKey);
          }
        }
        job.resolve(dataUrl);
      })
      .catch(() => {
        job.resolve(null);
      })
      .finally(() => {
        activeJobs -= 1;
        pumpQueue();
      });
  }
}

export function getCachedPartThumbnail(
  partId: string,
  colorCode: number
): string | undefined {
  return partThumbnailCache.get(thumbnailKey(partId, colorCode));
}

export function requestPartThumbnail(
  partId: string,
  colorCode: number
): Promise<string | null> {
  const key = thumbnailKey(partId, colorCode);
  if (!normalizePartId(partId)) return Promise.resolve(null);

  const cached = partThumbnailCache.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = pendingThumbnails.get(key);
  if (pending) return pending;

  const promise = new Promise<string | null>((resolve) => {
    jobQueue.push({ key, partId, colorCode, resolve });
  });

  pendingThumbnails.set(key, promise);
  void promise.then(() => pendingThumbnails.delete(key));
  pumpQueue();

  return promise;
}
