import * as THREE from 'three';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import { generateLDConfigDirectives, getLDrawColor } from './colors';
import { LDU_SCALE, createBrickMesh } from './proceduralBricks';
import { getPartDefinitionOrFallback } from './partsCatalogService';
import type { LegoPartDefinition } from '../types/lego';

let cachedLoader: LDrawLoader | null = null;
const partGroupCache = new Map<string, THREE.Group>();

/**
 * Obtém ou inicializa o LDrawLoader configurado com materiais condicionais,
 * cores oficiais e caminho da biblioteca /ldraw/
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

  // Registrar todas as cores oficiais Lego via diretivas !COLOUR
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

  cachedLoader = loader;
  return loader;
}

/**
 * Cria um bloco padrão de fallback resiliente e visualmente consistente
 * caso um arquivo LDraw específico falhe ao carregar ou contenha erros de sintaxe.
 */
export function createDefaultFallbackBrick(
  partId: string,
  colorCode: number = 4,
  partDef?: LegoPartDefinition
): THREE.Group {
  const def = partDef || getPartDefinitionOrFallback(partId);

  try {
    const mesh = createBrickMesh(def, colorCode);
    mesh.name = `fallback_${partId}_${colorCode}`;
    mesh.userData = {
      partId,
      colorCode,
      isFallback: true,
    };
    return mesh;
  } catch (err) {
    console.warn(`[Blocchi 3D] Falha no gerador procedural para fallback de "${partId}", usando bloco cúbico:`, err);

    // Bloco cúbico mínimo garantido 100% à prova de falhas
    const group = new THREE.Group();
    group.name = `fallback_box_${partId}_${colorCode}`;

    const color = getLDrawColor(colorCode);
    const material = new THREE.MeshStandardMaterial({
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

    // Adicionar contorno de aviso
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.y = sy / 2;
    group.add(wireframe);

    group.userData = {
      partId,
      colorCode,
      isFallback: true,
    };

    return group;
  }
}

/**
 * Carrega e converte uma peça LDraw para um THREE.Group pronto para a cena
 * Implementa carregamento sob demanda real (Lazy Loading) e cache em memória.
 */
export async function loadLDrawPart(
  partId: string,
  colorCode: number = 4
): Promise<THREE.Group> {
  const cleanId = partId.replace(/\.dat$/i, '').trim();
  const cacheKey = `${cleanId}_${colorCode}`.toLowerCase();

  // 1. Verificar cache em memória para reaproveitamento instantâneo
  if (partGroupCache.has(cacheKey)) {
    return partGroupCache.get(cacheKey)!.clone(true);
  }

  const loader = getInitializedLDrawLoader();
  const baseUrl = import.meta.env.BASE_URL || '/';
  const ldrawPath = baseUrl.endsWith('/') ? `${baseUrl}ldraw/` : `${baseUrl}/ldraw/`;
  const fileUrl = `${ldrawPath}parts/${cleanId}.dat`;

  return new Promise((resolve) => {
    loader.load(
      fileUrl,
      (group: THREE.Group) => {
        try {
          // Aplicar cor oficial nas geometrias que utilizam a cor padrão 16
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (loader as any).applyMaterialsToMesh?.(
            group,
            String(colorCode),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (loader as any).materialLibrary,
            true
          );

          const wrapper = finalizeLoadedGroup(group, cleanId, colorCode);
          partGroupCache.set(cacheKey, wrapper);
          resolve(wrapper.clone(true));
        } catch (err) {
          console.warn(`[Blocchi 3D] Erro ao finalizar peça LDraw "${cleanId}":`, err);
          const fallback = createDefaultFallbackBrick(cleanId, colorCode);
          resolve(fallback);
        }
      },
      undefined,
      (err) => {
        // Tratamento elegante de erro: log de aviso sem quebrar a aplicação
        console.warn(
          `[Blocchi 3D] Peça LDraw "${cleanId}" não pôde ser carregada de "${fileUrl}". Usando bloco padrão (fallback):`,
          err
        );
        const fallback = createDefaultFallbackBrick(cleanId, colorCode);
        resolve(fallback);
      }
    );
  });
}

function finalizeLoadedGroup(group: THREE.Group, partId: string, colorCode: number): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.name = `ldraw_${partId}_${colorCode}`;

  // No padrão LDraw, -Y é para cima. Invertemos Y e aplicamos a escala oficial LDU_SCALE
  group.rotation.x = Math.PI;
  group.scale.set(LDU_SCALE, LDU_SCALE, LDU_SCALE);

  // Habilitar sombras e metadados
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  wrapper.add(group);
  wrapper.userData = {
    partId: partId,
    colorCode: colorCode,
    isLDrawNative: true,
  };

  return wrapper;
}
