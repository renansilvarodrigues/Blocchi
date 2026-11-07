import * as THREE from 'three';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { LDRAW_COLORS, getLDrawColor } from './colors';
import {
  LDU_SCALE,
  PLATE_HEIGHT,
  STUD_HEIGHT,
  STUD_SPACING,
  createBrickMesh,
} from './proceduralBricks';
import {
  getPartDefinitionOrFallback,
  syncPartDimensionsFromMeasurement,
} from './partsCatalogService';
import {
  applyTexmapUVs,
  attachLDrawFileMap,
  getTexmapRecordByCode,
  installPreloadedFiles,
  preloadLDrawPart,
  registerTexmapMaterials,
} from './ldrawLibrary';

let cachedLoader: LDrawLoader | null = null;
let loaderReadyPromise: Promise<LDrawLoader> | null = null;

// Cache de geometrias brutas carregadas dos arquivos .dat/.ldr (compartilhado entre motores)
const rawGeometryCache = new Map<string, THREE.Group>();

// Cache de instâncias completas prontas para a cena (chave: partId_color_engine_wireframe)
const unifiedPartCache = new Map<string, THREE.Group>();

// Cache de materiais físicos do ABS Studio
const absMaterialCache = new Map<string, THREE.MeshPhysicalMaterial>();
const edgeMaterialCache = new Map<string, THREE.LineBasicMaterial>();
const outlineGeometryCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
const texmapColorMaterialCache = new Map<string, THREE.Material>();

function registerEdgeMaterialPair(
  loader: LDrawLoader,
  material: THREE.Material,
  code: string
): void {
  const color = getLDrawColor(Number(code));
  const isTransparent = color.isTrans || color.category === 'transparent';
  const edgeHex = color.edgeHex || '#333333';

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(edgeHex),
    transparent: isTransparent,
    opacity: isTransparent ? 0.75 : 1,
    depthWrite: !isTransparent,
  });
  edgeMaterial.userData = { code };

  const conditionalMaterial = new LDrawConditionalLineMaterial({
    color: new THREE.Color(edgeHex),
    transparent: isTransparent,
    opacity: isTransparent ? 0.75 : 1,
    depthWrite: !isTransparent,
    // A tipagem do addon não declara `color`, embora o shader o aceite.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  conditionalMaterial.userData = { code };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loaderAny = loader as any;
  (loaderAny.edgeMaterialCache as WeakMap<THREE.Material, THREE.Material>).set(
    material,
    edgeMaterial
  );
  (loaderAny.conditionalEdgeMaterialCache as WeakMap<
    THREE.Material,
    THREE.Material
  >).set(edgeMaterial, conditionalMaterial);
}

/**
 * Obtém ou inicializa o LDrawLoader configurado com materiais condicionais,
 * diretivas do LDConfig.ldr e caminho oficial da biblioteca LDraw (/ldraw/).
 */
export function getInitializedLDrawLoader(): LDrawLoader {
  if (cachedLoader) return cachedLoader;

  const loader = new LDrawLoader();
  loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
  loader.addDefaultMaterials();

  const baseUrl = import.meta.env.BASE_URL || '/';
  const ldrawPath = baseUrl.endsWith('/') ? `${baseUrl}ldraw/` : `${baseUrl}/ldraw/`;
  loader.setPartsLibraryPath(ldrawPath);

  // 1. Pré-popular biblioteca com todas as cores oficiais LDraw.
  for (const color of LDRAW_COLORS) {
    const code = String(color.code);
    const isTrans = color.isTrans || color.category === 'transparent';
    const isMetal = color.category === 'metallic';

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color.hex),
      roughness: isTrans ? 0.08 : 0.35,
      metalness: isMetal ? 0.75 : 0.04,
      transparent: isTrans,
      opacity: isTrans ? 0.75 : 1.0,
    });
    material.userData = { code };
    material.name = color.name;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).addMaterial(material);

    // addMaterial ignora duplicatas, então sempre registramos as arestas
    // do material efetivamente presente na biblioteca.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const libraryMaterial = (loader as any).materialLibrary[code] as
      | THREE.Material
      | undefined;
    if (libraryMaterial) {
      registerEdgeMaterialPair(loader, libraryMaterial, code);
    }
  }

  // 2. Materiais meta 16 (Main_Colour) e 24 (Edge_Colour), usados como
  // passthrough até o material pass final.
  for (const code of ['16', '24']) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const material = (loader as any).materialLibrary[code] as THREE.Material | undefined;
    if (material) registerEdgeMaterialPair(loader, material, code);
  }

  // 3. O material 16 padrão do loader é rosa de depuração; usamos o vermelho
  // oficial apenas como fallback visual caso algum fluxo não aplique a cor.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainMaterial = (loader as any).materialLibrary?.['16'];
  if (mainMaterial?.color) {
    mainMaterial.color.set('#C91A09');
  }

  loaderReadyPromise = attachLDrawFileMap(loader).then(() => loader);

  cachedLoader = loader;
  return loader;
}

async function getReadyLDrawLoader(): Promise<LDrawLoader> {
  const loader = getInitializedLDrawLoader();
  if (!loaderReadyPromise) {
    loaderReadyPromise = attachLDrawFileMap(loader).then(() => loader);
  }
  return loaderReadyPromise;
}

function resolveColorCode(code: string, defaultColorCode: number): number {
  if (code === '16' || code === '24' || code === '' || code === '-1') {
    return defaultColorCode;
  }

  const numeric = Number(code);
  if (!Number.isFinite(numeric)) return defaultColorCode;
  return numeric;
}

function createSolidABSColorMaterial(
  code: string,
  defaultColorCode: number,
  wireframe: boolean
): THREE.MeshPhysicalMaterial {
  const resolvedCode = resolveColorCode(code, defaultColorCode);
  const cacheKey = `solid_${resolvedCode}_${wireframe}`;

  const cached = absMaterialCache.get(cacheKey);
  if (cached) return cached;

  const ldrawColor = getLDrawColor(resolvedCode);
  const isTransparent = ldrawColor.isTrans || ldrawColor.category === 'transparent';
  const isMetallic = ldrawColor.category === 'metallic';

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(ldrawColor.hex),
    roughness: isTransparent ? 0.08 : 0.22,
    metalness: isMetallic ? 0.75 : 0.02,
    clearcoat: 0.35,
    clearcoatRoughness: 0.15,
    ior: 1.54,
    reflectivity: 0.5,
    transmission: isTransparent ? 0.85 : 0.0,
    opacity: isTransparent ? 0.75 : 1.0,
    transparent: isTransparent,
    wireframe,
    side: THREE.DoubleSide,
  });
  material.name = `ABS ${ldrawColor.name}`;
  material.userData = { code: String(resolvedCode) };

  absMaterialCache.set(cacheKey, material);
  return material;
}

/**
 * Compõe a textura TEXMAP sobre a cor da peça usando o canal alpha.
 *
 * O padrão LDraw permite que o PNG tenha transparência "deixando a cor da
 * peça aparecer". Um `map` convencional multiplicaria a estampa pela cor
 * (amarelo × vermelho = vermelho) e um `alphaTest` descartaria os pixels
 * transparentes, deixando buracos na peça. O mix abaixo reproduz o
 * comportamento correto: opaco = cor exata da textura; transparente = cor
 * da peça.
 */
function enableTexmapAlphaCompositing(material: THREE.Material): void {
  if (material.userData.texmapComposite) return;
  material.userData.texmapComposite = true;

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );

	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif

	diffuseColor.rgb = mix( diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a );
#endif
`
    );
  };
  material.customProgramCacheKey = () => 'ldraw_texmap_alpha_composite';
}

function createTexmapABSColorMaterial(
  texmapCode: string,
  defaultColorCode: number,
  wireframe: boolean
): THREE.MeshPhysicalMaterial | null {
  const record = getTexmapRecordByCode(texmapCode);
  if (!record) return null;

  const cacheKey = `texmap_${texmapCode}_${defaultColorCode}_${wireframe}`;
  const cached = absMaterialCache.get(cacheKey);
  if (cached) return cached;

  const ldrawColor = getLDrawColor(defaultColorCode);
  const isTransparent = ldrawColor.isTrans || ldrawColor.category === 'transparent';

  const material = new THREE.MeshPhysicalMaterial({
    // O mapa TEXMAP é composto sobre a cor da peça pelo canal alpha
    // (pixels opacos mantêm a estampa original; pixels transparentes
    // revelam o plástico na cor selecionada).
    color: new THREE.Color(ldrawColor.hex),
    map: record.texture,
    roughness: 0.32,
    metalness: 0.02,
    clearcoat: 0.25,
    clearcoatRoughness: 0.2,
    ior: 1.54,
    transmission: isTransparent ? 0.6 : 0.0,
    opacity: isTransparent ? 0.75 : 1.0,
    transparent: isTransparent,
    depthWrite: !isTransparent,
    wireframe,
    side: THREE.DoubleSide,
  });
  enableTexmapAlphaCompositing(material);
  material.name = `ABS TEXMAP ${record.imageName}`;
  material.userData = {
    code: texmapCode,
    texmapCode,
    texmapImage: record.imagePath,
  };

  absMaterialCache.set(cacheKey, material);
  return material;
}

function resolveABSMaterial(
  entry: THREE.Material | string,
  defaultColorCode: number,
  wireframe: boolean
): THREE.Material {
  if (typeof entry !== 'string') {
    // Materiais já resolvidos com mapa (ex.: texturas de fluxos legados)
    // são preservados para não perder a estampa.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((entry as any)?.map) return entry;
    const code = entry?.userData?.code;
    if (code === undefined || code === null) return entry;
    entry = String(code);
  }

  const texmapMaterial = createTexmapABSColorMaterial(entry, defaultColorCode, wireframe);
  if (texmapMaterial) return texmapMaterial;

  const directColor = entry.match(/^0x2([0-9a-f]{6})$/i);
  if (directColor) {
    const cacheKey = `direct_${directColor[1]}_${wireframe}`;
    const cached = absMaterialCache.get(cacheKey);
    if (cached) return cached;

    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(`#${directColor[1]}`),
      roughness: 0.25,
      metalness: 0.02,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      ior: 1.54,
      wireframe,
      side: THREE.DoubleSide,
    });
    material.userData = { code: entry };
    absMaterialCache.set(cacheKey, material);
    return material;
  }

  return createSolidABSColorMaterial(entry, defaultColorCode, wireframe);
}

function getOutlineMaterial(colorCode: number): THREE.LineBasicMaterial {
  const ldrawColor = getLDrawColor(colorCode);
  const isTransparent = ldrawColor.isTrans || ldrawColor.category === 'transparent';
  const cacheKey = `outline_${colorCode}_${isTransparent}`;

  const cached = edgeMaterialCache.get(cacheKey);
  if (cached) return cached;

  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(ldrawColor.edgeHex || '#1b1b1b'),
    transparent: isTransparent,
    opacity: isTransparent ? 0.55 : 1,
    depthWrite: !isTransparent,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  material.name = `Contorno ABS ${ldrawColor.name}`;

  edgeMaterialCache.set(cacheKey, material);
  return material;
}

/**
 * Constrói as arestas de contorno do ABS Studio.
 *
 * `THREE.EdgesGeometry` também emite toda aresta de borda (face sem vizinha),
 * o que desenha costuras internas entre subpeças LDraw que não compartilham
 * vértices exatos — por exemplo as duas metades TEXMAP da cabeça 3626cpx0 e
 * os anéis da coroa. Aqui só mantemos arestas com duas faces adjacentes e
 * ângulo diedral acima do limite, preservando o contorno real (studs, topo,
 * laterais) sem os arcos fantasma.
 */
function createStudioOutlineGeometry(
  geometry: THREE.BufferGeometry,
  thresholdDeg = 20,
  epsilon = 1e-3
): THREE.BufferGeometry {
  const outline = new THREE.BufferGeometry();
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!position) return outline;

  const index = geometry.getIndex();
  const triangleCount = index ? index.count / 3 : position.count / 3;
  const thresholdCos = Math.cos((thresholdDeg * Math.PI) / 180);

  interface EdgeInfo {
    ax: number;
    ay: number;
    az: number;
    bx: number;
    by: number;
    bz: number;
    nx: number;
    ny: number;
    nz: number;
    keep: boolean;
  }

  const edges = new Map<string, EdgeInfo>();
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();

  const readVertex = (vertex: number, out: THREE.Vector3) => {
    const i = index ? index.getX(vertex) : vertex;
    out.set(position.getX(i), position.getY(i), position.getZ(i));
  };

  const makeKey = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
    const k1 = `${Math.round(x1 / epsilon)},${Math.round(y1 / epsilon)},${Math.round(z1 / epsilon)}`;
    const k2 = `${Math.round(x2 / epsilon)},${Math.round(y2 / epsilon)},${Math.round(z2 / epsilon)}`;
    return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
  };

  const registerEdge = (
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number
  ) => {
    const key = makeKey(x1, y1, z1, x2, y2, z2);
    const existing = edges.get(key);

    if (!existing) {
      edges.set(key, {
        ax: x1,
        ay: y1,
        az: z1,
        bx: x2,
        by: y2,
        bz: z2,
        nx: normal.x,
        ny: normal.y,
        nz: normal.z,
        keep: false,
      });
      return;
    }

    // Aresta compartilhada: só vira contorno se o diedro for acentuado.
    const dot = existing.nx * normal.x + existing.ny * normal.y + existing.nz * normal.z;
    if (dot < thresholdCos) existing.keep = true;
  };

  for (let triangle = 0; triangle < triangleCount; triangle++) {
    readVertex(triangle * 3, vA);
    readVertex(triangle * 3 + 1, vB);
    readVertex(triangle * 3 + 2, vC);

    ab.subVectors(vB, vA);
    ac.subVectors(vC, vA);
    normal.crossVectors(ab, ac);
    const length = normal.length();
    if (length < 1e-12) continue; // triângulo degenerado
    normal.multiplyScalar(1 / length);

    registerEdge(vA.x, vA.y, vA.z, vB.x, vB.y, vB.z);
    registerEdge(vB.x, vB.y, vB.z, vC.x, vC.y, vC.z);
    registerEdge(vC.x, vC.y, vC.z, vA.x, vA.y, vA.z);
  }

  const points: number[] = [];
  for (const edge of edges.values()) {
    if (!edge.keep) continue;
    points.push(edge.ax, edge.ay, edge.az, edge.bx, edge.by, edge.bz);
  }

  outline.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return outline;
}

function getOutlineGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const cached = outlineGeometryCache.get(geometry);
  if (cached) return cached;

  // 30° preserva as quinas reais (90°) e os aros dos studs, mas descarta as
  // emendas de 22,5° das primitivas de toro de baixa resolução.
  const edges = createStudioOutlineGeometry(geometry, 30);
  outlineGeometryCache.set(geometry, edges);
  return edges;
}

function addStudioOutline(mesh: THREE.Mesh, colorCode: number): void {
  const hasOutline = mesh.children.some(
    (child) => (child as THREE.LineSegments).isLineSegments && child.userData.studioOutline
  );
  if (hasOutline) return;

  const edges = getOutlineGeometry(mesh.geometry as THREE.BufferGeometry);
  const position = edges.getAttribute('position');
  if (!position || position.count === 0) return;

  const outline = new THREE.LineSegments(edges, getOutlineMaterial(colorCode));
  outline.name = 'ABS_STUDIO_OUTLINE';
  outline.userData.studioOutline = true;
  outline.renderOrder = 2;
  outline.castShadow = false;
  outline.receiveShadow = false;
  // Contornos não devem interferir em raycast/seleção.
  outline.raycast = () => {};
  mesh.add(outline);
}

/**
 * Camada de Abstração PBR para o Motor ABS Studio:
 * Converte as geometrias extraídas do LDraw em materiais físicos PBR de plástico ABS
 * e adiciona contornos `EdgesGeometry` para dar definição visual às faces.
 */
export function applyABSStudioMaterials(
  group: THREE.Group,
  defaultColorCode: number,
  wireframe: boolean = false
): void {
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const originalMaterial = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      const resolvedMaterials = originalMaterial.map((entry) =>
        resolveABSMaterial(entry, defaultColorCode, wireframe)
      );

      mesh.material = Array.isArray(mesh.material)
        ? resolvedMaterials
        : resolvedMaterials[0];
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (mesh.geometry) {
        // LDraw gera triângulos não indexados com normais planas: cada faceta
        // do cilindro recebe uma normal própria e aparecem faixas/listras.
        // Suavizamos apenas dobras rasas (35°), mantendo quinas e studs vivos.
        mesh.geometry = toCreasedNormals(
          mesh.geometry.clone(),
          THREE.MathUtils.degToRad(35)
        );
      }

      addStudioOutline(mesh, defaultColorCode);
    } else if (
      (child as THREE.LineSegments).isLineSegments ||
      (child as THREE.Line).isLine
    ) {
      // Linhas condicionais nativas do LDraw não são exibidas no ABS Studio.
      child.userData.nativeLDrawLine = true;
      child.visible = false;
    }
  });

  applyTexmapUVs(group);
}

function cloneTexmapMaterialForColor(
  material: THREE.Material,
  colorCode: number
): THREE.Material {
  const texmapCode = material.userData?.texmapCode as string | undefined;
  const cacheKey = `${texmapCode}_${colorCode}`;

  const cached = texmapColorMaterialCache.get(cacheKey);
  if (cached) return cached;

  const clone = material.clone();
  const ldrawColor = getLDrawColor(colorCode);
  const isTransparent = ldrawColor.isTrans || ldrawColor.category === 'transparent';

  if ('color' in clone && clone.color instanceof THREE.Color) {
    // A estampa é composta sobre a cor da peça respeitando o alpha do PNG.
    clone.color.set(ldrawColor.hex);
  }
  clone.transparent = isTransparent;
  clone.alphaTest = 0;
  clone.depthWrite = !isTransparent;
  clone.opacity = isTransparent ? 0.75 : 1.0;
  clone.userData = { ...material.userData, texmapComposite: false };
  enableTexmapAlphaCompositing(clone);
  clone.needsUpdate = true;

  texmapColorMaterialCache.set(cacheKey, clone);
  return clone;
}

/**
 * Camada de Abstração para o LDraw Loader:
 * Aplica os materiais nativos oficiais do parser LDraw com linhas condicionais,
 * preservando as texturas !TEXMAP e resolvendo a cor principal uma única vez.
 */
export function applyLDrawNativeMaterials(
  group: THREE.Group,
  colorCode: number,
  wireframe: boolean = false
): void {
  const loader = getInitializedLDrawLoader();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).applyMaterialsToMesh(
      group,
      String(colorCode),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (loader as any).materialLibrary,
      true
    );
  } catch (err) {
    console.error('[LDraw Loader] Falha ao aplicar materiais nativos:', err);
    throw err;
  }

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const resolved = materials.map((material) => {
        if (!material) return material;
        if (material.userData?.texmapCode) {
          return cloneTexmapMaterialForColor(material, colorCode);
        }
        return material;
      });
      mesh.material = Array.isArray(mesh.material) ? resolved : resolved[0];

      if (wireframe) {
        const finalMaterials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const material of finalMaterials) {
          if ('wireframe' in material) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (material as any).wireframe = true;
          }
        }
      }
    }
  });

  applyTexmapUVs(group);
}

interface MeasuredDimensions {
  x: number;
  y: number;
  z: number;
  studsX: number;
  studsZ: number;
  heightPlates: number;
}

function measureGroup(group: THREE.Object3D, hasStuds: boolean): MeasuredDimensions {
  // A medição ocorre após a conversão para o espaço do Blocchi (Y para cima
  // e escala LDU_SCALE), antes do grupo ser posicionado na cena.
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());

  const bodyHeight = Math.max(0, size.y - (hasStuds ? STUD_HEIGHT : 0));

  return {
    x: size.x,
    y: size.y,
    z: size.z,
    studsX: Math.max(1, Math.round(size.x / STUD_SPACING)),
    studsZ: Math.max(1, Math.round(size.z / STUD_SPACING)),
    heightPlates: Math.max(0.5, Math.round((bodyHeight / PLATE_HEIGHT) * 100) / 100),
  };
}

/**
 * Finaliza o THREE.Group com o sistema de coordenadas e escala universais do Blocchi 3D.
 * A base da malha real é alinhada a Y = 0 e as dimensões medidas são anexadas
 * ao userData para validação de snap/bounding box.
 */
function finalizeLoadedGroup(
  group: THREE.Group,
  partId: string,
  colorCode: number,
  engineMode: 'procedural' | 'ldraw',
  hasStuds: boolean
): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.name = `${engineMode}_${partId}_${colorCode}`;

  // No padrão LDraw, -Y é para cima. Invertemos Y e aplicamos a escala oficial.
  group.rotation.x = Math.PI;
  group.scale.set(LDU_SCALE, LDU_SCALE, LDU_SCALE);

  group.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(group);

  // Pivot vertical: base da geometria real em Y = 0.
  if (isFinite(bbox.min.y)) {
    group.position.y = -bbox.min.y;
  }

  const measured = measureGroup(group, hasStuds);
  syncPartDimensionsFromMeasurement(partId, measured);

  wrapper.add(group);
  wrapper.userData = {
    partId,
    colorCode,
    engineMode,
    isLDrawNative: engineMode === 'ldraw',
    measured,
  };

  return wrapper;
}

/**
 * Carrega a geometria bruta do arquivo LDraw (.dat ou .ldr), com
 * pré-carregamento recursivo de dependências e texturas.
 */
async function fetchRawLDrawGeometry(cleanId: string): Promise<THREE.Group> {
  const key = cleanId.toLowerCase();
  const cached = rawGeometryCache.get(key);
  if (cached) {
    return cached.clone(true);
  }

  const loader = await getReadyLDrawLoader();
  const preload = await preloadLDrawPart(cleanId);

  registerTexmapMaterials(loader, preload.texmaps.values());
  installPreloadedFiles(loader, preload.files);

  let group: THREE.Group;
  try {
    // Parse interno: evita o material pass prematuro do `load()` e preserva
    // os códigos de cor para aplicar a cor escolhida depois.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    group = await (loader as any).partsCache.parseModel(preload.rootText);
  } catch (error) {
    throw new Error(
      `[LDraw] O parser falhou ao montar a árvore da peça "${cleanId}" ` +
        `(arquivo raiz: "${preload.rootPath}", ${preload.files.size} arquivos carregados).`,
      { cause: error }
    );
  }

  if (!group || group.children.length === 0) {
    throw new Error(
      `[LDraw] A peça "${cleanId}" foi encontrada em "${preload.rootPath}", ` +
        'mas não produziu geometria renderizável.'
    );
  }

  rawGeometryCache.set(key, group.clone(true));
  return group;
}

/**
 * Camada de Abstração Unificada de Peças (Unified Mesh & Material Layer):
 * Carrega a geometria autêntica dos arquivos LDraw (.dat/.ldr) e aplica
 * consistentemente os materiais físicos PBR (ABS Studio) ou nativos (LDraw),
 * com pivot em Y = 0. Falhas são propagadas — nunca há cubo genérico.
 */
export async function loadUnifiedBrick(
  partId: string,
  colorCode: number = 4,
  engineMode: 'procedural' | 'ldraw' = 'procedural',
  wireframe: boolean = false
): Promise<THREE.Group> {
  const cleanId = partId.replace(/\.dat$/i, '').trim();
  const cacheKey = `${cleanId}_${colorCode}_${engineMode}_${wireframe}`.toLowerCase();

  // 1. Reutilização instantânea de cache em memória
  const cached = unifiedPartCache.get(cacheKey);
  if (cached) {
    return cached.clone(true);
  }

  const partDef = getPartDefinitionOrFallback(cleanId);

  // 2. Peças flexíveis (mangueiras e correntes) continuam procedurais.
  if (partDef.isFlexible) {
    const flexMesh = createBrickMesh(partDef, colorCode, wireframe);
    if (engineMode === 'procedural') {
      applyABSStudioMaterials(flexMesh, colorCode, wireframe);
    }
    const finalized = finalizeLoadedGroup(
      flexMesh,
      cleanId,
      colorCode,
      engineMode,
      partDef.hasStuds
    );
    unifiedPartCache.set(cacheKey, finalized);
    return finalized.clone(true);
  }

  // 3. Carregar e interpretar a geometria real do LDraw.
  try {
    const rawGroup = await fetchRawLDrawGeometry(cleanId);

    if (engineMode === 'procedural') {
      applyABSStudioMaterials(rawGroup, colorCode, wireframe);
    } else {
      applyLDrawNativeMaterials(rawGroup, colorCode, wireframe);
    }

    const finalized = finalizeLoadedGroup(
      rawGroup,
      cleanId,
      colorCode,
      engineMode,
      partDef.hasStuds
    );
    unifiedPartCache.set(cacheKey, finalized);
    return finalized.clone(true);
  } catch (error) {
    console.error(
      `[Blocchi 3D] Falha ao carregar a peça LDraw "${cleanId}" ` +
        `(cor ${colorCode}, motor ${engineMode}). A peça será omitida da cena.`,
      error
    );
    throw error instanceof Error
      ? error
      : new Error(`[LDraw] Falha desconhecida ao carregar "${cleanId}".`);
  }
}

/**
 * Função de retrocompatibilidade para componentes legados que chamavam loadLDrawPart.
 */
export async function loadLDrawPart(
  partId: string,
  colorCode: number = 4
): Promise<THREE.Group> {
  return loadUnifiedBrick(partId, colorCode, 'ldraw');
}
