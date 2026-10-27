import * as THREE from 'three';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import { LEGO_PARTS_CATALOG, generateLDrawSource } from './partsData';
import { generateLDConfigDirectives } from './colors';
import { LDU_SCALE } from './proceduralBricks';

let cachedLoader: LDrawLoader | null = null;

/**
 * Obtém ou inicializa o LDrawLoader configurado com materiais condicionais e cores oficiais
 */
export function getInitializedLDrawLoader(): LDrawLoader {
  if (cachedLoader) return cachedLoader;

  const loader = new LDrawLoader();
  loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
  loader.addDefaultMaterials();

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
 */
export function loadLDrawPart(
  partId: string,
  colorCode: number = 4
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const part = LEGO_PARTS_CATALOG.find(p => p.id === partId);
    if (!part) {
      reject(new Error(`Peça LDraw ${partId} não encontrada no catálogo.`));
      return;
    }

    const loader = getInitializedLDrawLoader();
    const ldrawSource = generateLDrawSource(part, colorCode);

    loader.parse(
      ldrawSource,
      (group: THREE.Group) => {
        // Ajustar orientação do padrão LDraw para o padrão Three.js:
        // No LDraw, -Y é para cima. Invertemos Y e aplicamos a escala LDU_SCALE.
        const wrapper = new THREE.Group();
        wrapper.name = `ldraw_${part.id}_${colorCode}`;

        group.rotation.x = Math.PI; // Inverte Y do LDraw para coincidir com o mundo Three.js (+Y para cima)
        group.scale.set(LDU_SCALE, LDU_SCALE, LDU_SCALE);

        // Habilitar sombras e materiais
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        wrapper.add(group);
        wrapper.userData = {
          partId: part.id,
          colorCode: colorCode,
          isLDrawNative: true,
        };

        resolve(wrapper);
      },
      (error: unknown) => {
        console.error('Erro ao processar LDraw:', error);
        reject(error);
      }
    );
  });
}
