import * as THREE from 'three';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import { generateLDConfigDirectives, getLDrawColor } from './colors';
import { LDU_SCALE, createBrickMesh } from './proceduralBricks';
import { getPartDefinitionOrFallback } from './partsCatalogService';
import type { LegoPartDefinition } from '../types/lego';

let cachedLoader: LDrawLoader | null = null;

// Cache de geometrias brutas carregadas dos arquivos .dat/.ldr (compartilhado entre motores)
const rawGeometryCache = new Map<string, THREE.Group>();

// Cache de instâncias completas prontas para a cena (chave: partId_color_engine_wireframe)
const unifiedPartCache = new Map<string, THREE.Group>();

/**
 * Obtém ou inicializa o LDrawLoader configurado com materiais condicionais,
 * diretivas do LDConfig.ldr e caminho oficial da biblioteca LDraw (/ldraw/)
 */
export function getInitializedLDrawLoader(): LDrawLoader {
  if (cachedLoader) return cachedLoader;

  const loader = new LDrawLoader();
  loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
  loader.addDefaultMaterials();

  // Configurar caminhos de busca oficiais da biblioteca LDraw (/parts/ e /p/)
  const baseUrl = import.meta.env.BASE_URL || '/';
  const ldrawPath = baseUrl.endsWith('/') ? `${baseUrl}ldraw/` : `${baseUrl}/ldraw/`;
  loader.setPartsLibraryPath(ldrawPath);

  // Registrar todas as cores oficiais Lego via diretivas !COLOUR do LDConfig.ldr
  const ldConfigColors = generateLDConfigDirectives();
  const colorDirectives = ldConfigColors.split('\n');

  for (const line of colorDirectives) {
    if (line.trim().startsWith('0 !COLOUR')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (loader as any).parseColorMetaDirective?.(line);
      } catch (e) {
        console.warn('Erro ao registrar cor LDraw:', line, e);
      }
    }
  }

  // Tentar pré-carregar arquivo LDConfig.ldr se suportado
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).preloadMaterials?.('LDConfig.ldr');
  } catch {}

  cachedLoader = loader;
  return loader;
}

/**
 * Camada de Abstração PBR para o Motor ABS Studio:
 * Converte as geometrias extraídas do LDraw em materiais físicos PBR de plástico ABS
 * (com reflexão especular, chanfros, sombras e transmissão para cores transparentes).
 */
export function applyABSStudioMaterials(
  group: THREE.Group,
  defaultColorCode: number,
  wireframe: boolean = false
): void {
  const defaultLDrawColor = getLDrawColor(defaultColorCode);

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;

      // Determinar a cor correta da malha / subpeça
      let resolvedCode = defaultColorCode;
      let specificHex: string | null = null;

      // 1. Se o LDrawLoader atribuiu um código específico à subpeça diferente do código 16 padrão
      const meshColorCode = mesh.userData?.colorCode;
      if (
        meshColorCode !== undefined &&
        meshColorCode !== null &&
        String(meshColorCode) !== '16' &&
        String(meshColorCode) !== '24'
      ) {
        resolvedCode = Number(meshColorCode);
      } else if (mesh.material) {
        // Preserva cores específicas de decalques/impressões (ex: olhos de minifiguras, detalhes)
        const curMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (curMat && (curMat as THREE.MeshStandardMaterial).color) {
          const matColorHex = `#${(curMat as THREE.MeshStandardMaterial).color.getHexString()}`;
          // Se a cor do material for diferente do default 16 (cinza ou código padrão), preserva
          if (matColorHex.toLowerCase() !== '#ffffff' && matColorHex.toLowerCase() !== '#7f7f7f') {
            specificHex = matColorHex;
          }
        }
      }

      const ldrawColor = getLDrawColor(resolvedCode);
      const colorHex = specificHex || ldrawColor.hex;

      const isTransparent = ldrawColor.isTrans || ldrawColor.category === 'transparent';
      const isMetallic = ldrawColor.category === 'metallic';

      // Criação de Material PBR de Plástico ABS Físico de Alta Fidelidade
      const pbrPlasticMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        roughness: isTransparent ? 0.08 : 0.22,
        metalness: isMetallic ? 0.75 : 0.02,
        clearcoat: 0.35,
        clearcoatRoughness: 0.15,
        ior: 1.54, // Índice de refração do plástico ABS real
        reflectivity: 0.5,
        transmission: isTransparent ? 0.85 : 0.0,
        opacity: isTransparent ? 0.75 : 1.0,
        transparent: isTransparent,
        wireframe: wireframe,
        side: THREE.DoubleSide,
      });

      mesh.material = pbrPlasticMaterial;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Garantir normais de vértices para sombreamento suave em curvas e pinos
      if (mesh.geometry && !mesh.geometry.attributes.normal) {
        mesh.geometry.computeVertexNormals();
      }
    } else if ((child as THREE.LineSegments).isLineSegments) {
      const line = child as THREE.LineSegments;
      const edgeColor = defaultLDrawColor.edgeHex
        ? new THREE.Color(defaultLDrawColor.edgeHex)
        : new THREE.Color('#1f1f1f');

      line.material = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: 0.65,
      });
    }
  });
}

/**
 * Camada de Abstração para o LDraw Loader:
 * Aplica os materiais nativos oficiais do parser LDraw com linhas condicionais e diretivas do LDConfig.ldr.
 */
export function applyLDrawNativeMaterials(
  group: THREE.Group,
  colorCode: number,
  wireframe: boolean = false
): void {
  const loader = getInitializedLDrawLoader();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).applyMaterialsToMesh?.(
      group,
      String(colorCode),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (loader as any).materialLibrary,
      true
    );
  } catch (err) {
    console.warn('[LDraw Loader] Aviso ao aplicar materiais nativos:', err);
  }

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (wireframe && mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            if ('wireframe' in m) (m as any).wireframe = true;
          });
        } else if ('wireframe' in mesh.material) {
          (mesh.material as any).wireframe = true;
        }
      }
    }
  });
}

/**
 * Finaliza o THREE.Group com o sistema de coordenadas e escala universais do Blocchi 3D.
 * Garante que ambos os motores compartilhem exatamente a mesma orientação, pivot e bounding box.
 */
function finalizeLoadedGroup(
  group: THREE.Group,
  partId: string,
  colorCode: number,
  engineMode: 'procedural' | 'ldraw'
): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.name = `${engineMode}_${partId}_${colorCode}`;

  // No padrão LDraw, -Y é para cima. Invertemos Y e aplicamos a escala oficial LDU_SCALE
  group.rotation.x = Math.PI;
  group.scale.set(LDU_SCALE, LDU_SCALE, LDU_SCALE);

  wrapper.add(group);
  wrapper.userData = {
    partId: partId,
    colorCode: colorCode,
    engineMode: engineMode,
    isLDrawNative: engineMode === 'ldraw',
  };

  return wrapper;
}

/**
 * Carrega a geometria bruta do arquivo LDraw (.dat ou .ldr) com cache global em memória.
 */
async function fetchRawLDrawGeometry(cleanId: string): Promise<THREE.Group> {
  const key = cleanId.toLowerCase();
  if (rawGeometryCache.has(key)) {
    return rawGeometryCache.get(key)!.clone(true);
  }

  const loader = getInitializedLDrawLoader();
  const baseUrl = import.meta.env.BASE_URL || '/';
  const ldrawPath = baseUrl.endsWith('/') ? `${baseUrl}ldraw/` : `${baseUrl}/ldraw/`;
  const fileUrl = `${ldrawPath}parts/${cleanId}.dat`;

  return new Promise((resolve, reject) => {
    loader.load(
      fileUrl,
      (group: THREE.Group) => {
        rawGeometryCache.set(key, group.clone(true));
        resolve(group);
      },
      undefined,
      (err) => {
        reject(err);
      }
    );
  });
}

/**
 * Camada de Abstração Unificada de Peças (Unified Mesh & Material Layer):
 * Carrega a BufferGeometry autêntica dos arquivos LDraw (.dat/.ldr) e aplica consistentemente
 * os materiais físicos PBR (ABS Studio) ou nativos (LDraw Loader), eliminando discrepâncias visuais.
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
  if (unifiedPartCache.has(cacheKey)) {
    return unifiedPartCache.get(cacheKey)!.clone(true);
  }

  const partDef = getPartDefinitionOrFallback(cleanId);

  // 2. Peças flexíveis (mangueiras e correntes) via procedural com materiais unificados
  if (partDef.isFlexible) {
    const flexMesh = createBrickMesh(partDef, colorCode, wireframe);
    if (engineMode === 'procedural') {
      applyABSStudioMaterials(flexMesh, colorCode, wireframe);
    }
    unifiedPartCache.set(cacheKey, flexMesh);
    return flexMesh.clone(true);
  }

  // 3. Carregar e interpretar a BufferGeometry autêntica do LDraw
  try {
    const rawGroup = await fetchRawLDrawGeometry(cleanId);
    const instanceGroup = rawGroup.clone(true);

    if (engineMode === 'procedural') {
      // Motor ABS Studio: Plástico ABS PBR físico com reflexos, chanfros e IOR 1.54
      applyABSStudioMaterials(instanceGroup, colorCode, wireframe);
    } else {
      // Motor LDraw Loader: Shading oficial do LDrawLoader com linhas condicionais
      applyLDrawNativeMaterials(instanceGroup, colorCode, wireframe);
    }

    const finalized = finalizeLoadedGroup(instanceGroup, cleanId, colorCode, engineMode);
    unifiedPartCache.set(cacheKey, finalized);
    return finalized.clone(true);
  } catch (err) {
    console.warn(`[Blocchi 3D] Falha ao carregar modelo LDraw "${cleanId}", gerando fallback estável:`, err);
    const fallback = createDefaultFallbackBrick(cleanId, colorCode, partDef, engineMode);
    return fallback;
  }
}

/**
 * Função de retrocompatibilidade para componentes legados que chamavam loadLDrawPart
 */
export async function loadLDrawPart(
  partId: string,
  colorCode: number = 4
): Promise<THREE.Group> {
  return loadUnifiedBrick(partId, colorCode, 'ldraw');
}

/**
 * Cria um bloco padrão de fallback resiliente e visualmente consistente
 * caso um arquivo LDraw específico não possa ser obtido da rede.
 */
export function createDefaultFallbackBrick(
  partId: string,
  colorCode: number = 4,
  partDef?: LegoPartDefinition,
  engineMode: 'procedural' | 'ldraw' = 'procedural'
): THREE.Group {
  const def = partDef || getPartDefinitionOrFallback(partId);

  try {
    const mesh = createBrickMesh(def, colorCode);
    mesh.name = `fallback_${partId}_${colorCode}`;
    if (engineMode === 'procedural') {
      applyABSStudioMaterials(mesh, colorCode, false);
    }
    mesh.userData = {
      partId,
      colorCode,
      engineMode,
      isFallback: true,
    };
    return mesh;
  } catch (err) {
    console.warn(`[Blocchi 3D] Falha ao gerar fallback de "${partId}", usando bloco cúbico:`, err);

    const group = new THREE.Group();
    group.name = `fallback_box_${partId}_${colorCode}`;

    const color = getLDrawColor(colorCode);
    const material =
      engineMode === 'procedural'
        ? new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(color.hex),
            roughness: 0.22,
            metalness: 0.02,
            clearcoat: 0.35,
            clearcoatRoughness: 0.15,
            ior: 1.54,
          })
        : new THREE.MeshStandardMaterial({
            color: new THREE.Color(color.hex),
            roughness: 0.25,
            metalness: 0.05,
          });

    const sx = Math.max(1, def.dimensions?.studsX || 1) * 0.8;
    const sz = Math.max(1, def.dimensions?.studsZ || 1) * 0.8;
    const sy = Math.max(1, def.dimensions?.heightPlates || 3) * 0.32;

    const boxGeo = new THREE.BoxGeometry(sx, sy, sz);
    const boxMesh = new THREE.Mesh(boxGeo, material);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxMesh.position.y = sy / 2;
    group.add(boxMesh);

    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.y = sy / 2;
    group.add(wireframe);

    group.userData = {
      partId,
      colorCode,
      engineMode,
      isFallback: true,
    };

    return group;
  }
}
