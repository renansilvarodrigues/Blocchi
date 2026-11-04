import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import type { PlacedBrick, ViewportSettings, ToolMode } from '../../types/lego';
import { createAssemblyTable } from './ViewportGrid';
import { ViewportGizmo } from './ViewportGizmo';
import {
  createBrickMesh,
  calculateLDrawStudSnap,
  snapToUnderlyingStuds,
  PLATE_HEIGHT,
  STUD_SPACING,
} from '../../ldraw/proceduralBricks';
import { loadLDrawPart } from '../../ldraw/ldrawLoaderHelper';
import { LEGO_PARTS_CATALOG } from '../../ldraw/partsData';

interface ViewportCanvasProps {
  bricks: PlacedBrick[];
  selectedBrickId: string | null;
  onSelectBrick: (id: string | null) => void;
  onUpdateBrickTransform: (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number]
  ) => void;
  settings: ViewportSettings;
  engineMode: 'procedural' | 'ldraw';
  activeTool: ToolMode;
  onStatsUpdate: (stats: { count: number; vertices: number; triangles: number }) => void;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  bricks,
  selectedBrickId,
  onSelectBrick,
  onUpdateBrickTransform,
  settings,
  engineMode,
  activeTool,
  onStatsUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const tableGroupRef = useRef<THREE.Group | null>(null);
  const bricksGroupRef = useRef<THREE.Group | null>(null);
  const selectionBoxRef = useRef<THREE.BoxHelper | null>(null);

  const [activeCamera, setActiveCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isTransformDraggingRef = useRef(false);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const selectedBrickIdRef = useRef<string | null>(selectedBrickId);
  const bricksRef = useRef(bricks);
  const settingsRef = useRef(settings);
  const onUpdateBrickTransformRef = useRef(onUpdateBrickTransform);

  useEffect(() => {
    selectedBrickIdRef.current = selectedBrickId;
    bricksRef.current = bricks;
    settingsRef.current = settings;
    onUpdateBrickTransformRef.current = onUpdateBrickTransform;
  }, [selectedBrickId, bricks, settings, onUpdateBrickTransform]);

  // Inicialização da Cena Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x191a1e);
    scene.fog = new THREE.FogExp2(0x191a1e, 0.012);
    sceneRef.current = scene;

    // 2. Câmera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(7, 6, 8);
    cameraRef.current = camera;
    setActiveCamera(camera);

    // 3. Renderer com suporte a sombras suaves e ACESFilmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls: Rotação livre 360 graus em todos os eixos (sem limites de polarAngle)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = 0; // Permite olhar de cima para baixo
    controls.maxPolarAngle = Math.PI; // ROTAÇÃO 360° LIVRE: Permite olhar completamente de baixo para cima!
    controls.minDistance = 1.0;
    controls.maxDistance = 80;
    controls.target.set(0, 0.5, 0);
    controlsRef.current = controls;

    // 5. TransformControls (Gizmo 3D)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.85;
    const transformHelper = transformControls.getHelper();
    scene.add(transformHelper);
    transformControlsRef.current = transformControls;

    // Desabilitar OrbitControls durante manipulação no gizmo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformControls.addEventListener('dragging-changed', (event: any) => {
      controls.enabled = !event.value;
      isTransformDraggingRef.current = event.value;

      // Ao soltar o gizmo (drag finalizado), sincronizar posição e rotação exata
      if (!event.value && selectedBrickIdRef.current && transformControls.object) {
        const obj = transformControls.object;
        onUpdateBrickTransformRef.current(
          selectedBrickIdRef.current,
          [
            Math.round(obj.position.x * 1000) / 1000,
            Math.round(obj.position.y * 1000) / 1000,
            Math.round(obj.position.z * 1000) / 1000,
          ],
          [
            Math.round(obj.rotation.x * 1000) / 1000,
            Math.round(obj.rotation.y * 1000) / 1000,
            Math.round(obj.rotation.z * 1000) / 1000,
          ]
        );
      }
    });

    // Snapping oficial rigoroso LDraw em tempo real durante movimentação pelo gizmo
    transformControls.addEventListener('objectChange', () => {
      const obj = transformControls.object;
      if (!obj || !selectedBrickIdRef.current) return;

      if (settingsRef.current.studSnapping) {
        const currentBrick = bricksRef.current.find((b) => b.instanceId === selectedBrickIdRef.current);
        const partDef = currentBrick
          ? LEGO_PARTS_CATALOG.find((p) => p.id === currentBrick.partId)
          : null;

        if (partDef) {
          const curHalfW = (partDef.dimensions.studsX * STUD_SPACING) / 2;
          const curHalfL = (partDef.dimensions.studsZ * STUD_SPACING) / 2;

          let bestUnderlying: { brick: PlacedBrick; def: typeof partDef; topY: number } | null = null;

          for (const other of bricksRef.current) {
            if (other.instanceId === selectedBrickIdRef.current) continue;
            const otherDef = LEGO_PARTS_CATALOG.find((p) => p.id === other.partId);
            if (!otherDef) continue;

            const otherHalfW = (otherDef.dimensions.studsX * STUD_SPACING) / 2;
            const otherHalfL = (otherDef.dimensions.studsZ * STUD_SPACING) / 2;
            const otherHeight = otherDef.dimensions.heightPlates * PLATE_HEIGHT;
            const topSurface = other.position[1] + otherHeight;

            const overlapX = Math.abs(obj.position.x - other.position[0]) < curHalfW + otherHalfW + 0.2;
            const overlapZ = Math.abs(obj.position.z - other.position[2]) < curHalfL + otherHalfL + 0.2;

            if (overlapX && overlapZ && topSurface <= obj.position.y + 0.4) {
              if (!bestUnderlying || topSurface > bestUnderlying.topY) {
                bestUnderlying = { brick: other, def: otherDef, topY: topSurface };
              }
            }
          }

          if (bestUnderlying) {
            const snapped = snapToUnderlyingStuds(
              [obj.position.x, obj.position.y, obj.position.z],
              partDef,
              obj.rotation.y,
              bestUnderlying.brick,
              bestUnderlying.def
            );
            obj.position.x = snapped[0];
            obj.position.y = snapped[1];
            obj.position.z = snapped[2];
          } else {
            const snapped = calculateLDrawStudSnap(
              [obj.position.x, obj.position.y, obj.position.z],
              partDef,
              obj.rotation.y
            );
            obj.position.x = snapped[0];
            obj.position.y = snapped[1];
            obj.position.z = snapped[2];
          }
        } else {
          const snapped = calculateLDrawStudSnap([obj.position.x, obj.position.y, obj.position.z]);
          obj.position.x = snapped[0];
          obj.position.y = snapped[1];
          obj.position.z = snapped[2];
        }
      }
    });

    // 6. Iluminação de Estúdio 3D Completa (Superior e Inferior para visualização 360)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x22222a, 0.6);
    scene.add(hemiLight);

    // Key Light com sombras suaves
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.6);
    keyLight.position.set(8, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xb0d0ff, 0.8);
    fillLight.position.set(-8, 8, -6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, 6, -10);
    scene.add(rimLight);

    // Luz inferior suave para iluminar a parte de baixo (cavidades e tubos) ao visualizar por baixo
    const bottomLight = new THREE.DirectionalLight(0x9aa8b8, 0.55);
    bottomLight.position.set(0, -12, 0);
    scene.add(bottomLight);

    // 7. Mesa de Montagem com Grid
    const tableGroup = createAssemblyTable();
    scene.add(tableGroup);
    tableGroupRef.current = tableGroup;

    // 8. Grupo de Peças Lego
    const bricksGroup = new THREE.Group();
    bricksGroup.name = 'lego_bricks_container';
    scene.add(bricksGroup);
    bricksGroupRef.current = bricksGroup;

    // 9. BoxHelper para realce da seleção
    const selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0xf59e0b);
    selectionBox.visible = false;
    scene.add(selectionBox);
    selectionBoxRef.current = selectionBox;

    // Loop de Animação
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      if (selectionBoxRef.current && selectionBoxRef.current.visible) {
        selectionBoxRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Redimensionamento responsivo
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      transformControls.dispose();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Atualizar modo e configurações do TransformControls
  useEffect(() => {
    const tc = transformControlsRef.current;
    if (!tc) return;

    if (activeTool === 'rotate') {
      tc.setMode('rotate');
    } else {
      tc.setMode('translate');
    }

    if (settings.studSnapping) {
      tc.setRotationSnap(Math.PI / 2); // Giro exato de 90 graus
    } else {
      tc.setTranslationSnap(null);
      tc.setRotationSnap(null);
    }
  }, [activeTool, settings.studSnapping]);

  // Atualizar visibilidade de Overlays (Grid, Sombras, etc.)
  useEffect(() => {
    if (tableGroupRef.current) {
      tableGroupRef.current.visible = settings.showGrid;
    }
    if (rendererRef.current) {
      rendererRef.current.shadowMap.enabled = settings.showShadows;
    }
  }, [settings.showGrid, settings.showShadows]);

  // Atualizar peças renderizadas na cena
  useEffect(() => {
    const scene = sceneRef.current;
    const group = bricksGroupRef.current;
    const tc = transformControlsRef.current;
    if (!scene || !group) return;

    let isCancelled = false;
    setIsLoading(true);

    if (tc) tc.detach();

    // Limpar peças anteriores
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    const loadBricks = async () => {
      let totalVertices = 0;
      let totalTriangles = 0;

      for (const brick of bricks) {
        const partDef = LEGO_PARTS_CATALOG.find((p) => p.id === brick.partId) || LEGO_PARTS_CATALOG[0];

        let brickMesh: THREE.Group;

        if (engineMode === 'ldraw') {
          try {
            brickMesh = await loadLDrawPart(brick.partId, brick.colorCode);
          } catch (e) {
            console.warn('Falha no LDrawLoader, usando gerador procedural:', e);
            brickMesh = createBrickMesh(partDef, brick.colorCode, settings.shadingMode === 'wireframe');
          }
        } else {
          brickMesh = createBrickMesh(partDef, brick.colorCode, settings.shadingMode === 'wireframe');
        }

        if (isCancelled) return;

        brickMesh.name = brick.instanceId;
        brickMesh.position.set(...brick.position);
        brickMesh.rotation.set(...brick.rotation);

        brickMesh.traverse((child) => {
          if ((child as THREE.LineSegments).isLineSegments) {
            child.visible = settings.showOutlines;
          }
        });

        group.add(brickMesh);

        brickMesh.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const geo = mesh.geometry;
            if (geo) {
              if (geo.index) {
                totalTriangles += geo.index.count / 3;
              } else if (geo.attributes.position) {
                totalTriangles += geo.attributes.position.count / 3;
              }
              if (geo.attributes.position) {
                totalVertices += geo.attributes.position.count;
              }
            }
          }
        });
      }

      onStatsUpdate({
        count: bricks.length,
        vertices: totalVertices,
        triangles: Math.round(totalTriangles),
      });

      // Reconectar TransformControls e SelectionBox
      if (selectedBrickIdRef.current) {
        const selectedObj = group.getObjectByName(selectedBrickIdRef.current);
        if (selectedObj) {
          if (tc) tc.attach(selectedObj);
          if (selectionBoxRef.current) {
            selectionBoxRef.current.setFromObject(selectedObj);
            selectionBoxRef.current.visible = true;
          }
        }
      }

      setIsLoading(false);
    };

    loadBricks();

    return () => {
      isCancelled = true;
    };
  }, [bricks, engineMode, settings.shadingMode, settings.showOutlines, onStatsUpdate]);

  // Atualizar anexo do TransformControls e indicador de seleção
  useEffect(() => {
    const box = selectionBoxRef.current;
    const group = bricksGroupRef.current;
    const tc = transformControlsRef.current;
    if (!group) return;

    if (!selectedBrickId) {
      if (box) box.visible = false;
      if (tc) tc.detach();
      return;
    }

    const selectedObj = group.getObjectByName(selectedBrickId);
    if (selectedObj) {
      if (box) {
        box.setFromObject(selectedObj);
        box.visible = true;
      }
      if (tc) {
        tc.attach(selectedObj);
      }
    } else {
      if (box) box.visible = false;
      if (tc) tc.detach();
    }
  }, [selectedBrickId]);

  // Captura do clique inicial
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    pointerDownPosRef.current = { x: event.clientX, y: event.clientY };
  };

  // Efeito de cursor hover sobre peças
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isTransformDraggingRef.current) return;
    const container = containerRef.current;
    const camera = cameraRef.current;
    const group = bricksGroupRef.current;
    if (!container || !camera || !group) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / container.clientWidth) * 2 - 1,
      -((event.clientY - rect.top) / container.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(group.children, true);
    const hasMeshHit = intersects.some(
      (hit) => (hit.object as THREE.Mesh).isMesh && hit.object.visible
    );

    container.style.cursor = hasMeshHit ? 'pointer' : 'default';
  };

  // Processamento ultra-preciso de seleção via Raycasting (Primeiro Clique em Qualquer Face)
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !pointerDownPosRef.current) return;

    const dx = event.clientX - pointerDownPosRef.current.x;
    const dy = event.clientY - pointerDownPosRef.current.y;
    pointerDownPosRef.current = null;

    // Se o mouse moveu > 8px ou se estava manipulando o gizmo, foi arraste/órbita
    if (Math.hypot(dx, dy) > 8 || isTransformDraggingRef.current) {
      return;
    }

    const container = containerRef.current;
    const camera = cameraRef.current;
    const group = bricksGroupRef.current;
    if (!container || !camera || !group) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / container.clientWidth) * 2 - 1,
      -((event.clientY - rect.top) / container.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Raycast apenas nos meshes visíveis das peças Lego
    const intersects = raycaster.intersectObjects(group.children, true);

    // Filtrar apenas objetos Mesh reais e visíveis (desconsidera linhas de aresta e helpers)
    const validMeshHit = intersects.find(
      (hit) => (hit.object as THREE.Mesh).isMesh && hit.object.visible
    );

    if (validMeshHit) {
      let target: THREE.Object3D | null = validMeshHit.object;
      // Rastrear até a raiz da peça (filho direto de group)
      while (target && target.parent && target.parent !== group) {
        target = target.parent;
      }
      if (target && target.name) {
        onSelectBrick(target.name);
        return;
      }
    }

    // Clique no vazio (mesa ou espaço livre): desseleciona
    onSelectBrick(null);
  };

  // Funções de câmera para o Gizmo (incluindo visão inferior "bottom")
  const handleViewSelect = useCallback((view: 'top' | 'bottom' | 'front' | 'right' | 'perspective') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const dist = 10;
    if (view === 'top') {
      camera.position.set(0, dist, 0.001);
    } else if (view === 'bottom') {
      camera.position.set(0, -dist, 0.001);
    } else if (view === 'front') {
      camera.position.set(0, 1.5, dist);
    } else if (view === 'right') {
      camera.position.set(dist, 1.5, 0);
    } else {
      camera.position.set(7, 6, 8);
    }
    controls.target.set(0, 0.5, 0);
    controls.update();
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative flex-1 w-full h-full overflow-hidden select-none focus:outline-none bg-[#191a1e]"
    >
      {/* Gizmo Blender no canto superior direito */}
      <ViewportGizmo camera={activeCamera} onViewSelect={handleViewSelect} />

      {/* Loading overlay suave quando carrega LDraw */}
      {isLoading && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 pointer-events-none z-20">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <span>Carregando LDraw...</span>
        </div>
      )}

      {/* Indicador de Unidades e Modo */}
      <div className="absolute bottom-3 left-3 bg-[#1e1e24]/85 backdrop-blur-md px-2.5 py-1 rounded border border-[#3f3f46]/50 text-[10px] text-zinc-400 pointer-events-none flex items-center gap-2 z-10 shadow-md">
        <span>Grid: 1 Stud = 20 LDU (8mm)</span>
        <span className="text-zinc-600">|</span>
        <span>H: 24 LDU Brick / 8 LDU Plate</span>
        <span className="text-zinc-600">|</span>
        <span className="text-amber-400 font-mono">
          {activeTool === 'rotate' ? 'Giro 3D Ativo (R)' : 'Manipulador 3D Ativo (G)'}
        </span>
      </div>
    </div>
  );
};
