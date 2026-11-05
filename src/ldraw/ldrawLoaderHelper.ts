import * as THREE from 'three';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import { LEGO_PARTS_CATALOG, generateLDrawSource } from './partsData';
import { generateLDConfigDirectives } from './colors';
import { LDU_SCALE } from './proceduralBricks';

let cachedLoader: LDrawLoader | null = null;

/**
 * Obtém ou inicializa o LDrawLoader configurado com materiais condicionais,
 * cores oficiais e caminho da biblioteca /ldraw/
 */
export function getInitializedLDrawLoader(): LDrawLoader {
  if (cachedLoader) return cachedLoader;

  const loader = new LDrawLoader();
  loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
  loader.addDefaultMaterials();

  // Configurar caminho base da biblioteca LDraw (/p/ e /parts/)
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
 * Carrega e converte uma peça LDraw para um THREE.Group pronto para a cena
 * com fallback inteligente para gerador procedural
 */
export async function loadLDrawPart(
  partId: string,
  colorCode: number = 4
): Promise<THREE.Group> {
  const part = LEGO_PARTS_CATALOG.find((p) => p.id === partId);
  if (!part) {
    throw new Error(`Peça LDraw ${partId} não encontrada no catálogo.`);
  }

  const loader = getInitializedLDrawLoader();
  const baseUrl = import.meta.env.BASE_URL || '/';
  const ldrawPath = baseUrl.endsWith('/') ? `${baseUrl}ldraw/` : `${baseUrl}/ldraw/`;

  // Tentar carregar diretamente o arquivo oficial .dat da biblioteca
  return new Promise((resolve) => {
    const fileUrl = `${ldrawPath}parts/${part.id}.dat`;

    loader.load(
      fileUrl,
      (group: THREE.Group) => {
        const wrapper = finalizeLoadedGroup(group, part.id, colorCode);
        resolve(wrapper);
      },
      undefined,
      (err) => {
        console.warn(`[LDrawLoader] Não foi possível carregar ${fileUrl}, usando gerador embutido:`, err);
        // Fallback: parsear código LDraw gerado proceduralmente
        const ldrawSource = generateLDrawSource(part, colorCode);
        loader.parse(
          ldrawSource,
          (group: THREE.Group) => {
            const wrapper = finalizeLoadedGroup(group, part.id, colorCode);
            resolve(wrapper);
          },
          (parseErr) => {
            console.error('Falha no fallback LDraw:', parseErr);
            throw parseErr;
          }
        );
      }
    );
  });
}

function finalizeLoadedGroup(group: THREE.Group, partId: string, colorCode: number): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.name = `ldraw_${partId}_${colorCode}`;

  // No LDraw, -Y é para cima. Invertemos Y e aplicamos a escala LDU_SCALE
  group.rotation.x = Math.PI;
  group.scale.set(LDU_SCALE, LDU_SCALE, LDU_SCALE);

  // Habilitar projeção e recepção de sombras
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
