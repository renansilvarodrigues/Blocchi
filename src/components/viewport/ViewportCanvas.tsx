import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import type {
  PlacedBrick,
  ViewportSettings,
  ToolMode,
  SelectionSubMode,
  ActivePlacement,
} from '../../types/lego';
import { createAssemblyTable } from './ViewportGrid';
import { ViewportGizmo } from './ViewportGizmo';
import {
  calculateLDrawStudSnap,
  snapToUnderlyingStuds,
  PLATE_HEIGHT,
  STUD_SPACING,
  BRICK_HEIGHT,
} from '../../ldraw/proceduralBricks';
import { loadUnifiedBrick, createDefaultFallbackBrick } from '../../ldraw/ldrawLoaderHelper';
import { getPartDefinitionOrFallback } from '../../ldraw/partsCatalogService';

interface ViewportCanvasProps {
  bricks: PlacedBrick[];
  selectedBrickId: string | null;
  selectedBrickIds: string[];
  onSelectBrick: (id: string | null, isMultiSelect?: boolean) => void;
  onBoxSelect: (ids: string[], isMultiSelect?: boolean) => void;
  onUpdateBrickTransform: (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number]
  ) => void;
  onUpdateMultipleBricksTransform?: (
    updates: Array<{
      id: string;
      position: [number, number, number];
      rotation: [number, number, number];
    }>
  ) => void;
  settings: ViewportSettings;
  engineMode: 'procedural' | 'ldraw';
  activeTool: ToolMode;
  selectionSubMode: SelectionSubMode;
  onStatsUpdate: (stats: { count: number; vertices: number; triangles: number }) => void;
  activePlacement: ActivePlacement | null;
  onConfirmPlacement: (
    position: [number, number, number],
    rotation: [number, number, number]
  ) => void;
  onCancelPlacement: () => void;
  onStartReposition: (brick: PlacedBrick) => void;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  bricks,
  selectedBrickId,
  selectedBrickIds,
  onSelectBrick,
  onBoxSelect,
  onUpdateBrickTransform,
  onUpdateMultipleBricksTransform,
  settings,
  engineMode,
  activeTool,
  selectionSubMode,
  onStatsUpdate,
  activePlacement,
  onConfirmPlacement,
  onCancelPlacement,
  onStartReposition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const tableGroupRef = useRef<THREE.Group | null>(null);
  const bricksGroupRef = useRef<THREE.Group | null>(null);
  const selectionBoxesGroupRef = useRef<THREE.Group | null>(null);
  const ghostMeshRef = useRef<THREE.Group | null>(null);

  const [activeCamera, setActiveCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Estado da Caixa de Seleção em coordenadas locais da Viewport
  const [selectionBoxRect, setSelectionBoxRect] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const isTransformDraggingRef = useRef(false);
  const currentDragAxisRef = useRef<string | null>(null);
  const initialPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map());
  const initialActivePosRef = useRef<THREE.Vector3>(new THREE.Vector3());

  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const placementStartTimeRef = useRef<number>(0);
  const placementStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const ghostRotYRef = useRef<number>(0);
  const ghostPositionRef = useRef<[number, number, number]>([0, 0, 0]);

  const selectedBrickIdRef = useRef<string | null>(selectedBrickId);
  const selectedBrickIdsRef = useRef<string[]>(selectedBrickIds);
  const bricksRef = useRef(bricks);
  const settingsRef = useRef(settings);
  const onUpdateBrickTransformRef = useRef(onUpdateBrickTransform);
  const onUpdateMultipleBricksTransformRef = useRef(onUpdateMultipleBricksTransform);
  const onConfirmPlacementRef = useRef(onConfirmPlacement);
  const onCancelPlacementRef = useRef(onCancelPlacement);
  const onStartRepositionRef = useRef(onStartReposition);

  useEffect(() => {
    selectedBrickIdRef.current = selectedBrickId;
    selectedBrickIdsRef.current = selectedBrickIds;
    bricksRef.current = bricks;
    settingsRef.current = settings;
    onUpdateBrickTransformRef.current = onUpdateBrickTransform;
    onUpdateMultipleBricksTransformRef.current = onUpdateMultipleBricksTransform;
    onConfirmPlacementRef.current = onConfirmPlacement;
    onCancelPlacementRef.current = onCancelPlacement;
    onStartRepositionRef.current = onStartReposition;
  }, [
    selectedBrickId,
    selectedBrickIds,
    bricks,
    settings,
    onUpdateBrickTransform,
    onUpdateMultipleBricksTransform,
    onConfirmPlacement,
    onCancelPlacement,
    onStartReposition,
  ]);

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

    // 4. OrbitControls: Rotação livre 360 graus em todos os eixos
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 1.0;
    controls.maxDistance = 80;
    controls.target.set(0, 0.5, 0);
    controlsRef.current = controls;

    // 5. TransformControls (Gizmo 3D)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.85;
    const transformHelper = transformControls.getHelper();

    // Estilizar o losango central amarelo (XYZ) do TransformControls
    transformHelper.traverse((child: unknown) => {
      const obj = child as THREE.Mesh;
      if (obj.name === 'XYZ' && obj.isMesh && obj.material) {
        const mat = obj.material as THREE.MeshBasicMaterial;
        if (mat.color) {
          mat.color.set(0xf59e0b); // Âmbar / amarelo dourado destacado
          mat.opacity = 0.9;
          mat.transparent = true;
        }
      }
    });

    scene.add(transformHelper);
    transformControlsRef.current = transformControls;

    // Identificação do losango central amarelo ('XYZ') para Reposicionamento Livre (Free Move)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformControls.addEventListener('dragging-changed', (event: any) => {
      // 1. Interação com o Losango Central Amarelo (origem XYZ) do Gizmo
      if (
        event.value &&
        transformControls.axis === 'XYZ'
      ) {
        const targetId = selectedBrickIdRef.current;
        const brick = bricksRef.current.find((b) => b.instanceId === targetId);
        if (brick) {
          transformControls.detach();
          isTransformDraggingRef.current = false;
          currentDragAxisRef.current = null;
          controls.enabled = true;

          // Registrar tempo e posição de início para evitar que o soltar do clique descarte a ação
          placementStartTimeRef.current = Date.now();
          placementStartPosRef.current = {
            x: lastPointerPosRef.current.x,
            y: lastPointerPosRef.current.y,
          };

          onStartRepositionRef.current(brick);
          return;
        }
      }

      controls.enabled = !event.value;
      isTransformDraggingRef.current = event.value;

      if (event.value) {
        currentDragAxisRef.current = transformControls.axis;
        const group = bricksGroupRef.current;
        if (group && transformControls.object) {
          initialActivePosRef.current.copy(transformControls.object.position);
          initialPositionsRef.current.clear();
          for (const id of selectedBrickIdsRef.current) {
            const o = group.getObjectByName(id);
            if (o) {
              initialPositionsRef.current.set(id, o.position.clone());
            }
          }
        }
      } else {
        currentDragAxisRef.current = null;
        // Ao soltar o gizmo (drag finalizado), sincronizar posição e rotação exata de todos os selecionados
        const group = bricksGroupRef.current;
        if (group && transformControls.object) {
          if (
            selectedBrickIdsRef.current.length > 1 &&
            onUpdateMultipleBricksTransformRef.current
          ) {
            const updates = selectedBrickIdsRef.current.map((bId) => {
              const o = group.getObjectByName(bId);
              return {
                id: bId,
                position: o
                  ? ([
                      Math.round(o.position.x * 1000) / 1000,
                      Math.round(o.position.y * 1000) / 1000,
                      Math.round(o.position.z * 1000) / 1000,
                    ] as [number, number, number])
                  : ([0, 0, 0] as [number, number, number]),
                rotation: o
                  ? ([
                      Math.round(o.rotation.x * 1000) / 1000,
                      Math.round(o.rotation.y * 1000) / 1000,
                      Math.round(o.rotation.z * 1000) / 1000,
                    ] as [number, number, number])
                  : ([0, 0, 0] as [number, number, number]),
              };
            });
            onUpdateMultipleBricksTransformRef.current(updates);
          } else if (selectedBrickIdRef.current) {
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
        }
      }
    });

    // Snapping oficial rigoroso LDraw em tempo real com correção para o eixo Y
    transformControls.addEventListener('objectChange', () => {
      const obj = transformControls.object;
      if (!obj || !selectedBrickIdRef.current) return;

      const isYAxisDrag =
        currentDragAxisRef.current === 'Y' || transformControls.axis === 'Y';

      if (settingsRef.current.studSnapping) {
        const currentBrick = bricksRef.current.find(
          (b) => b.instanceId === selectedBrickIdRef.current
        );
        const partDef = currentBrick
          ? getPartDefinitionOrFallback(currentBrick.partId)
          : null;

        if (isYAxisDrag) {
          // Desprendimento imediato do eixo Y
          const snapped = calculateLDrawStudSnap(
            [obj.position.x, obj.position.y, obj.position.z],
            partDef || undefined,
            obj.rotation.y
          );
          obj.position.y = snapped[1];
        } else {
          // Movimentação em eixos horizontais ou planares
          if (partDef) {
            const curHalfW = (partDef.dimensions.studsX * STUD_SPACING) / 2;
            const curHalfL = (partDef.dimensions.studsZ * STUD_SPACING) / 2;

            let bestUnderlying: {
              brick: PlacedBrick;
              def: typeof partDef;
              topY: number;
            } | null = null;

            for (const other of bricksRef.current) {
              if (
                selectedBrickIdsRef.current.includes(other.instanceId) ||
                other.instanceId === selectedBrickIdRef.current
              )
                continue;
              const otherDef = getPartDefinitionOrFallback(other.partId);
              if (!otherDef) continue;

              const otherHalfW = (otherDef.dimensions.studsX * STUD_SPACING) / 2;
              const otherHalfL = (otherDef.dimensions.studsZ * STUD_SPACING) / 2;
              const otherHeight = otherDef.dimensions.heightPlates * PLATE_HEIGHT;
              const topSurface = other.position[1] + otherHeight;

              const overlapX =
                Math.abs(obj.position.x - other.position[0]) < curHalfW + otherHalfW + 0.2;
              const overlapZ =
                Math.abs(obj.position.z - other.position[2]) < curHalfL + otherHalfL + 0.2;

              if (overlapX && overlapZ && Math.abs(obj.position.y - topSurface) < 0.25) {
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
            const snapped = calculateLDrawStudSnap([
              obj.position.x,
              obj.position.y,
              obj.position.z,
            ]);
            obj.position.x = snapped[0];
            obj.position.y = snapped[1];
            obj.position.z = snapped[2];
          }
        }
      }

      // Sincronizar movimentação de outras peças selecionadas em multi-seleção
      if (selectedBrickIdsRef.current.length > 1) {
        const deltaX = obj.position.x - initialActivePosRef.current.x;
        const deltaY = obj.position.y - initialActivePosRef.current.y;
        const deltaZ = obj.position.z - initialActivePosRef.current.z;
        const group = bricksGroupRef.current;

        if (group) {
          for (const bId of selectedBrickIdsRef.current) {
            if (bId === selectedBrickIdRef.current) continue;
            const o = group.getObjectByName(bId);
            const initPos = initialPositionsRef.current.get(bId);
            if (o && initPos) {
              o.position.set(initPos.x + deltaX, initPos.y + deltaY, initPos.z + deltaZ);
            }
          }
        }
      }
    });

    // 6. Iluminação de Estúdio 3D Completa
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x22222a, 0.6);
    scene.add(hemiLight);

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

    // 9. Grupo de BoxHelpers para realce de Múltipla Seleção
    const selectionBoxesGroup = new THREE.Group();
    selectionBoxesGroup.name = 'selection_boxes_container';
    scene.add(selectionBoxesGroup);
    selectionBoxesGroupRef.current = selectionBoxesGroup;

    // Loop de Animação
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      if (selectionBoxesGroupRef.current) {
        selectionBoxesGroupRef.current.children.forEach((helper) => {
          (helper as THREE.BoxHelper).update();
        });
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

  // Configuração dos controles de mouse de acordo com o modo de seleção e inserção
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (activePlacement) {
      // No modo de inserção/reposicionamento flutuante, botão esquerdo fixa a peça na cena
      controls.mouseButtons = {
        LEFT: -1 as unknown as THREE.MOUSE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
    } else if (selectionSubMode === 'box') {
      controls.mouseButtons = {
        LEFT: -1 as unknown as THREE.MOUSE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
    } else {
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      };
    }
  }, [selectionSubMode, activePlacement]);

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
      tc.setRotationSnap(Math.PI / 2);
    } else {
      tc.setTranslationSnap(null);
      tc.setRotationSnap(null);
    }
  }, [activeTool, settings.studSnapping]);

  // Atualizar visibilidade de Overlays
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

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    const loadBricks = async () => {
      let totalVertices = 0;
      let totalTriangles = 0;

      for (const brick of bricks) {
        const partDef = getPartDefinitionOrFallback(brick.partId);

        let brickMesh: THREE.Group;
        try {
          brickMesh = await loadUnifiedBrick(
            brick.partId,
            brick.colorCode,
            engineMode,
            settings.shadingMode === 'wireframe'
          );
        } catch (e) {
          console.warn('Falha no carregamento unificado da peça, usando fallback:', e);
          brickMesh = createDefaultFallbackBrick(brick.partId, brick.colorCode, partDef, engineMode);
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

      setIsLoading(false);
    };

    loadBricks();

    return () => {
      isCancelled = true;
    };
  }, [bricks, engineMode, settings.shadingMode, settings.showOutlines, onStatsUpdate]);

  // Atualizar caixas de seleção destacadas para todas as peças selecionadas
  useEffect(() => {
    const helpersGroup = selectionBoxesGroupRef.current;
    const group = bricksGroupRef.current;
    const tc = transformControlsRef.current;
    if (!helpersGroup || !group) return;

    // Limpar caixas anteriores
    while (helpersGroup.children.length > 0) {
      helpersGroup.remove(helpersGroup.children[0]);
    }

    // Se estiver em modo reposicionamento, o gizmo e as caixas ficam ocultos durante o arraste livre
    if (activePlacement?.mode === 'reposition') {
      if (tc) tc.detach();
      return;
    }

    if (selectedBrickIds.length === 0) {
      if (tc) tc.detach();
      return;
    }

    for (const id of selectedBrickIds) {
      const obj = group.getObjectByName(id);
      if (obj && obj.visible) {
        const isPrimary = id === selectedBrickId;
        const box = new THREE.BoxHelper(obj, isPrimary ? 0xf59e0b : 0x38bdf8);
        helpersGroup.add(box);
      }
    }

    const targetId = selectedBrickId || selectedBrickIds[0];
    const targetObj = group.getObjectByName(targetId);
    if (targetObj && targetObj.visible && tc) {
      tc.attach(targetObj);
    } else if (tc) {
      tc.detach();
    }
  }, [selectedBrickIds, selectedBrickId, bricks, activePlacement]);

  // Gerenciamento da Peça Fantasma / Ghost Mode para Inserção, Duplicação e Reposicionamento Livre
  useEffect(() => {
    const scene = sceneRef.current;
    const group = bricksGroupRef.current;
    if (!scene) return;

    if (ghostMeshRef.current) {
      scene.remove(ghostMeshRef.current);
      ghostMeshRef.current = null;
    }

    if (!activePlacement) {
      // Reexibir todas as peças normais quando o modo fantasma for encerrado
      if (group) {
        group.children.forEach((c) => {
          c.visible = true;
        });
      }
      return;
    }

    // Se for reposicionamento de peça existente, oculta temporariamente a peça original para não colidir consigo mesma
    if (activePlacement.mode === 'reposition' && activePlacement.repositionBrickId && group) {
      const origObj = group.getObjectByName(activePlacement.repositionBrickId);
      if (origObj) {
        origObj.visible = false;
      }
    }

    let isCancelled = false;

    const applyGhostStyle = (ghost: THREE.Group) => {
      ghost.name = 'placement_ghost_brick';
      ghost.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const curMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const mat = curMat ? (curMat.clone() as THREE.MeshPhysicalMaterial) : new THREE.MeshPhysicalMaterial();
          mat.transparent = true;
          mat.opacity = 0.75;
          mat.roughness = 0.35;
          mat.metalness = 0.05;
          mat.emissive = new THREE.Color(0xf59e0b);
          mat.emissiveIntensity = 0.25;
          mesh.material = mat;
        }
      });
    };

    // Criar ghost preliminar instantâneo com dimensões compatíveis
    const initialGhost = createDefaultFallbackBrick(
      activePlacement.partDef.id,
      activePlacement.colorCode,
      activePlacement.partDef,
      engineMode
    );
    applyGhostStyle(initialGhost);

    // Iniciar rotação igual à original (se houver)
    const initRotY = activePlacement.initialRotation ? activePlacement.initialRotation[1] : 0;
    ghostRotYRef.current = initRotY;
    initialGhost.rotation.set(0, initRotY, 0);

    // Posição inicial: se reposicionando, inicia na posição original da peça
    if (activePlacement.mode === 'reposition' && activePlacement.originalPosition) {
      initialGhost.position.set(...activePlacement.originalPosition);
      ghostPositionRef.current = [...activePlacement.originalPosition];
      initialGhost.visible = true;
    } else {
      initialGhost.position.set(...ghostPositionRef.current);
      initialGhost.visible = false;
    }

    scene.add(initialGhost);
    ghostMeshRef.current = initialGhost;

    // Carregar geometria real unificada (mesma BufferGeometry LDraw para ambos os motores)
    loadUnifiedBrick(activePlacement.partDef.id, activePlacement.colorCode, engineMode)
      .then((realGhost) => {
        if (isCancelled || !sceneRef.current) return;
        applyGhostStyle(realGhost);
        realGhost.rotation.set(0, ghostRotYRef.current, 0);
        realGhost.position.set(...ghostPositionRef.current);
        realGhost.visible = ghostMeshRef.current ? ghostMeshRef.current.visible : false;

        if (ghostMeshRef.current) {
          sceneRef.current.remove(ghostMeshRef.current);
        }
        sceneRef.current.add(realGhost);
        ghostMeshRef.current = realGhost;
      })
      .catch((err) => {
        console.warn('Aviso no ghost unificado:', err);
      });

    // Atalhos durante o modo fantasma: R (girar 90°) e Esc (cancelar)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        ghostRotYRef.current = (ghostRotYRef.current + Math.PI / 2) % (Math.PI * 2);
        if (ghostMeshRef.current) {
          ghostMeshRef.current.rotation.set(0, ghostRotYRef.current, 0);
        }
      } else if (e.key === 'Escape') {
        onCancelPlacementRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isCancelled = true;
      window.removeEventListener('keydown', handleKeyDown);
      if (ghostMeshRef.current) {
        scene.remove(ghostMeshRef.current);
        ghostMeshRef.current = null;
      }
      if (group) {
        group.children.forEach((c) => {
          c.visible = true;
        });
      }
    };
  }, [activePlacement, engineMode]);

  // Captura do clique inicial
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    lastPointerPosRef.current = { x: event.clientX, y: event.clientY };

    if (isTransformDraggingRef.current) return;

    if (event.button === 0) {
      pointerDownPosRef.current = { x: event.clientX, y: event.clientY };

      // Se estiver no modo Caixa de Seleção e não estiver inserindo/reposicionando peça
      if (selectionSubMode === 'box' && !activePlacement && activeTool === 'select') {
        setSelectionBoxRect({
          startX: localX,
          startY: localY,
          currentX: localX,
          currentY: localY,
        });
      }
    }
  };

  // Efeito de movimento do cursor: Ghost piece tracking e cursor hover
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    lastPointerPosRef.current = { x: event.clientX, y: event.clientY };

    // Atualizar retângulo da caixa de seleção
    if (selectionBoxRect) {
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      setSelectionBoxRect((prev) =>
        prev
          ? {
              ...prev,
              currentX,
              currentY,
            }
          : null
      );
      return;
    }

    if (isTransformDraggingRef.current) return;
    const camera = cameraRef.current;
    const group = bricksGroupRef.current;
    if (!camera || !group) return;

    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / container.clientWidth) * 2 - 1,
      -((event.clientY - rect.top) / container.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Se estiver no Modo Fantasma (Inserção, Duplicação ou Reposicionamento Livre)
    if (activePlacement && ghostMeshRef.current) {
      // Raycast apenas contra peças visíveis (exclui a própria peça que está sendo reposicionada)
      const visibleChildren = group.children.filter((c) => c.visible);
      const intersects = raycaster.intersectObjects(visibleChildren, true);
      const validMeshHit = intersects.find(
        (hit) => (hit.object as THREE.Mesh).isMesh && hit.object.visible
      );

      let targetPos: [number, number, number] = [0, 0, 0];

      if (validMeshHit) {
        // Encontrou peça existente sob o cursor
        let target: THREE.Object3D | null = validMeshHit.object;
        while (target && target.parent && target.parent !== group) {
          target = target.parent;
        }

        const hitBrick =
          target && target.name
            ? bricksRef.current.find((b) => b.instanceId === target.name)
            : null;

        if (hitBrick) {
          const hitDef = getPartDefinitionOrFallback(hitBrick.partId);
          const hitHeight = hitDef
            ? hitDef.dimensions.heightPlates * PLATE_HEIGHT
            : BRICK_HEIGHT;
          const topSurfaceY = hitBrick.position[1] + hitHeight;

          if (settingsRef.current.studSnapping) {
            targetPos = snapToUnderlyingStuds(
              [validMeshHit.point.x, topSurfaceY, validMeshHit.point.z],
              activePlacement.partDef,
              ghostRotYRef.current,
              hitBrick,
              hitDef || activePlacement.partDef
            );
          } else {
            targetPos = [validMeshHit.point.x, topSurfaceY, validMeshHit.point.z];
          }
        }
      } else {
        // Raycast contra o plano da mesa (chão Y = 0)
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const groundHit = new THREE.Vector3();
        const hasHit = raycaster.ray.intersectPlane(groundPlane, groundHit);

        if (hasHit) {
          if (settingsRef.current.studSnapping) {
            const snapped = calculateLDrawStudSnap(
              [groundHit.x, 0, groundHit.z],
              activePlacement.partDef,
              ghostRotYRef.current
            );
            targetPos = [snapped[0], 0, snapped[2]];
          } else {
            targetPos = [groundHit.x, 0, groundHit.z];
          }
        }
      }

      ghostMeshRef.current.position.set(...targetPos);
      ghostMeshRef.current.rotation.set(0, ghostRotYRef.current, 0);
      ghostMeshRef.current.visible = true;
      ghostPositionRef.current = targetPos;
      container.style.cursor = 'crosshair';
      return;
    }

    // Cursor padrão: ponteiro ao passar por peças
    const intersects = raycaster.intersectObjects(group.children, true);
    const hasMeshHit = intersects.some(
      (hit) => (hit.object as THREE.Mesh).isMesh && hit.object.visible
    );
    container.style.cursor =
      selectionSubMode === 'box' ? 'crosshair' : hasMeshHit ? 'pointer' : 'default';
  };

  // Processamento de seleção por clique, multi-seleção com Ctrl e confirmação de inserção/reposicionamento
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    // 1. Confirmação de Posicionamento Flutuante (Inserção, Duplicação ou Reposicionamento)
    if (activePlacement && event.button === 0 && ghostMeshRef.current) {
      if (activePlacement.mode === 'reposition') {
        const elapsed = Date.now() - placementStartTimeRef.current;
        const dist = Math.hypot(
          event.clientX - placementStartPosRef.current.x,
          event.clientY - placementStartPosRef.current.y
        );

        // Se foi um clique muito rápido e sem arrasto (<220ms e <8px), foi apenas o acionamento do losango
        // Mantém a peça grudada no cursor para o próximo clique fixar
        if (elapsed < 220 && dist < 8) {
          return;
        }
      }

      onConfirmPlacement(ghostPositionRef.current, [0, ghostRotYRef.current, 0]);
      return;
    }

    // 2. Processamento da Caixa de Seleção (Marquee)
    if (selectionBoxRect) {
      const minX = Math.min(selectionBoxRect.startX, selectionBoxRect.currentX);
      const maxX = Math.max(selectionBoxRect.startX, selectionBoxRect.currentX);
      const minY = Math.min(selectionBoxRect.startY, selectionBoxRect.currentY);
      const maxY = Math.max(selectionBoxRect.startY, selectionBoxRect.currentY);
      const dragDist = Math.hypot(maxX - minX, maxY - minY);

      setSelectionBoxRect(null);

      if (dragDist > 6) {
        const container = containerRef.current;
        const camera = cameraRef.current;
        const group = bricksGroupRef.current;

        if (container && camera && group) {
          const matchedIds: string[] = [];

          for (const brick of bricksRef.current) {
            const obj = group.getObjectByName(brick.instanceId);
            if (!obj) continue;

            const box3 = new THREE.Box3().setFromObject(obj);
            const corners = [
              new THREE.Vector3(box3.min.x, box3.min.y, box3.min.z),
              new THREE.Vector3(box3.min.x, box3.min.y, box3.max.z),
              new THREE.Vector3(box3.min.x, box3.max.y, box3.min.z),
              new THREE.Vector3(box3.min.x, box3.max.y, box3.max.z),
              new THREE.Vector3(box3.max.x, box3.min.y, box3.min.z),
              new THREE.Vector3(box3.max.x, box3.min.y, box3.max.z),
              new THREE.Vector3(box3.max.x, box3.max.y, box3.min.z),
              new THREE.Vector3(box3.max.x, box3.max.y, box3.max.z),
            ];

            let minScrX = Infinity,
              maxScrX = -Infinity,
              minScrY = Infinity,
              maxScrY = -Infinity;
            let anyVisible = false;

            for (const c of corners) {
              c.project(camera);
              if (c.z < 1) anyVisible = true;
              const sx = ((c.x + 1) / 2) * container.clientWidth;
              const sy = ((-c.y + 1) / 2) * container.clientHeight;
              minScrX = Math.min(minScrX, sx);
              maxScrX = Math.max(maxScrX, sx);
              minScrY = Math.min(minScrY, sy);
              maxScrY = Math.max(maxScrY, sy);
            }

            if (anyVisible) {
              const overlaps =
                minScrX <= maxX &&
                maxScrX >= minX &&
                minScrY <= maxY &&
                maxScrY >= minY;
              if (overlaps) {
                matchedIds.push(brick.instanceId);
              }
            }
          }

          onBoxSelect(matchedIds, event.ctrlKey || event.metaKey);
          return;
        }
      }
    }

    if (event.button !== 0 || !pointerDownPosRef.current) return;

    const dx = event.clientX - pointerDownPosRef.current.x;
    const dy = event.clientY - pointerDownPosRef.current.y;
    pointerDownPosRef.current = null;

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

    const intersects = raycaster.intersectObjects(group.children, true);
    const validMeshHit = intersects.find(
      (hit) => (hit.object as THREE.Mesh).isMesh && hit.object.visible
    );

    const isMultiSelect = event.ctrlKey || event.metaKey;

    if (validMeshHit) {
      let target: THREE.Object3D | null = validMeshHit.object;
      while (target && target.parent && target.parent !== group) {
        target = target.parent;
      }
      if (target && target.name) {
        onSelectBrick(target.name, isMultiSelect);
        return;
      }
    }

    // Clique no vazio
    if (!isMultiSelect) {
      onSelectBrick(null, false);
    }
  };

  // Cancelar inserção/duplicação/reposicionamento com botão direito
  const handleContextMenu = (e: React.MouseEvent) => {
    if (activePlacement) {
      e.preventDefault();
      onCancelPlacementRef.current();
    }
  };

  // Esconder e mostrar ghost mesh ao sair/entrar no canvas
  const handlePointerLeave = () => {
    if (ghostMeshRef.current && activePlacement?.mode !== 'reposition') {
      ghostMeshRef.current.visible = false;
    }
  };

  const handlePointerEnter = () => {
    if (activePlacement && ghostMeshRef.current) {
      ghostMeshRef.current.visible = true;
    }
  };

  // Funções de câmera para o Gizmo
  const handleViewSelect = useCallback(
    (view: 'top' | 'bottom' | 'front' | 'right' | 'perspective') => {
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
    },
    []
  );

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      onContextMenu={handleContextMenu}
      className="relative flex-1 w-full h-full overflow-hidden select-none focus:outline-none bg-[#191a1e]"
    >
      {/* Gizmo Blender no canto superior direito */}
      <ViewportGizmo camera={activeCamera} onViewSelect={handleViewSelect} />

      {/* Retângulo visual da Caixa de Seleção (Marquee) */}
      {selectionBoxRect &&
        Math.hypot(
          selectionBoxRect.currentX - selectionBoxRect.startX,
          selectionBoxRect.currentY - selectionBoxRect.startY
        ) > 4 && (
          <div
            className="absolute pointer-events-none border-2 border-amber-400 bg-amber-500/15 backdrop-blur-[0.5px] rounded-[1px] z-30 shadow-lg"
            style={{
              left: Math.min(selectionBoxRect.startX, selectionBoxRect.currentX),
              top: Math.min(selectionBoxRect.startY, selectionBoxRect.currentY),
              width: Math.abs(selectionBoxRect.currentX - selectionBoxRect.startX),
              height: Math.abs(selectionBoxRect.currentY - selectionBoxRect.startY),
            }}
          >
            <div className="absolute top-1 left-1.5 text-[10px] font-mono text-amber-300 font-semibold bg-[#181820]/90 px-1.5 py-0.5 rounded border border-amber-500/40 shadow">
              Caixa de Seleção
            </div>
          </div>
        )}

      {/* Banner Informativo de Posicionamento Flutuante (Estilo Bricklink Studio) */}
      {activePlacement && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#1b1b24]/95 border border-amber-500/60 shadow-2xl backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 text-xs text-zinc-100 z-40 pointer-events-none animate-in fade-in slide-in-from-top-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span>
            {activePlacement.mode === 'duplicate'
              ? 'Duplicando:'
              : activePlacement.mode === 'reposition'
              ? 'Reposicionando (Free Move):'
              : 'Inserindo:'}{' '}
            <strong className="text-amber-400 font-medium">
              {activePlacement.partDef.name}
            </strong>
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300 text-[11px] flex items-center gap-1.5">
            <span>Clique para fixar</span>
            <span className="text-zinc-500">•</span>
            <kbd className="px-1.5 py-0.5 bg-[#2c2c38] border border-[#444455] rounded text-[10px] font-mono text-amber-300">
              R
            </kbd>
            <span>girar 90°</span>
            <span className="text-zinc-500">•</span>
            <kbd className="px-1.5 py-0.5 bg-[#2c2c38] border border-[#444455] rounded text-[10px] font-mono text-zinc-300">
              Esc / Botão Direito
            </kbd>
            <span>cancelar</span>
          </span>
        </div>
      )}

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
          {selectionSubMode === 'box' && activeTool === 'select'
            ? 'Caixa de Seleção (Marquee)'
            : activeTool === 'rotate'
            ? 'Giro 3D Ativo (R)'
            : 'Manipulador 3D Ativo (G)'}
        </span>
        {selectedBrickIds.length > 1 && (
          <>
            <span className="text-zinc-600">|</span>
            <span className="text-sky-400 font-mono font-medium">
              {selectedBrickIds.length} selecionadas
            </span>
          </>
        )}
      </div>
    </div>
  );
};
