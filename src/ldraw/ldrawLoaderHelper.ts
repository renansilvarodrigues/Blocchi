import * as THREE from 'three';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import { LDRAW_COLORS, getLDrawColor } from './colors';
import { LDU_SCALE, createBrickMesh } from './proceduralBricks';
import { getPartDefinitionOrFallback } from './partsCatalogService';
import type { LegoPartDefinition } from '../types/lego';

let cachedLoader: LDrawLoader | null = null;

// Cache de texturas carregadas para decalques e stickers
const textureCache = new Map<string, THREE.Texture>();

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

  // 1. Pré-popular biblioteca de materiais com todas as cores oficiais LDraw
  for (const color of LDRAW_COLORS) {
    const isTrans = color.isTrans || color.category === 'transparent';
    const isMetal = color.category === 'metallic';

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color.hex),
      roughness: isTrans ? 0.08 : 0.35,
      metalness: isMetal ? 0.75 : 0.04,
      transparent: isTrans,
      opacity: isTrans ? 0.75 : 1.0,
    });
    mat.userData = { code: String(color.code) };
    mat.name = color.name;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).addMaterial?.(mat);

    const edgeHex = color.edgeHex || '#333333';
    const edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(edgeHex) });
    edgeMat.userData = { code: String(color.code) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).edgeMaterialCache?.set(mat, edgeMat);
  }

  // 2. Corrigir cor oficial do código 16 para Vermelho Lego (#C91A09) eliminando acabamento rosa de debug (#FF8080)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainMat = (loader as any).materialLibrary?.['16'];
  if (mainMat && mainMat.color) {
    mainMat.color.set('#C91A09');
  }

  // 3. Pré-carregar filemap oficial assincronamente para resolução garantida de sub-primitivas
  fetch(`${ldrawPath}filemap.json`)
    .then((res) => (res.ok ? res.json() : null))
    .then((map) => {
      if (map && typeof map === 'object') {
        loader.setFileMap(map);
      }
    })
    .catch(() => {});

  cachedLoader = loader;
  return loader;
}

/**
 * Aplica mapeamento UV planar e textura de decalques/stickers baseados nas diretivas LDraw !TEXMAP
 */
function applyPlanarTextureMapping(
  group: THREE.Group,
  texInfo: { p1: THREE.Vector3; p2: THREE.Vector3; p3: THREE.Vector3; imageName: string },
  ldrawPath: string
) {
  const imageUrl = `${ldrawPath}parts/textures/${texInfo.imageName}`;
  let texture = textureCache.get(imageUrl);
  if (!texture) {
    texture = new THREE.TextureLoader().load(imageUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    textureCache.set(imageUrl, texture);
  }

  const { p1, p2, p3 } = texInfo;
  const uVec = new THREE.Vector3().subVectors(p2, p1);
  const vVec = new THREE.Vector3().subVectors(p3, p1);
  const uLenSq = uVec.lengthSq();
  const vLenSq = vVec.lengthSq();

  if (uLenSq === 0 || vLenSq === 0) return;

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geo = mesh.geometry;
      if (!geo || !geo.attributes.position) return;

      const posAttr = geo.attributes.position;
      const uvs = new Float32Array(posAttr.count * 2);
      const vert = new THREE.Vector3();
      const diff = new THREE.Vector3();

      for (let i = 0; i < posAttr.count; i++) {
        vert.fromBufferAttribute(posAttr, i);
        diff.subVectors(vert, p1);
        const u = diff.dot(uVec) / uLenSq;
        const v = 1.0 - diff.dot(vVec) / vLenSq;
        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
      }

      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

      if (mesh.material) {
        const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.Material;
        if (mat) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mat as any).map = texture;
          mat.transparent = true;
          mat.needsUpdate = true;
        }
      }
      mesh.userData.hasTexture = true;
    }
  });
}

/**
 * Camada de Abstração PBR para o Motor ABS Studio:
 * Converte as geometrias extraídas do LDraw em materiais físicos PBR de plástico ABS
 * (com reflexão especular, chanfros, sombras e transmissão para cores transparentes).
 * Oculta qualquer renderização de arestas/wireframe sobrepostas para manter faces lisas.
 */
export function applyABSStudioMaterials(
  group: THREE.Group,
  defaultColorCode: number,
  wireframe: boolean = false
): void {
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const curMat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.Material | undefined;

      // Determinar o código de cor oficial da subpeça:
      // Subpeças impressas (ex: olhos de minifigura em cor 0 Preto, dentes em 15 Branco)
      // têm códigos específicos diferentes de 16 (Main_Colour) e 24 (Edge_Colour).
      let resolvedCode = defaultColorCode;
      const meshCode = mesh.userData?.colorCode ?? mesh.parent?.userData?.colorCode;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matCode = (curMat as any)?.userData?.code;

      if (meshCode !== undefined && meshCode !== null && String(meshCode) !== '16' && String(meshCode) !== '24') {
        resolvedCode = Number(meshCode);
      } else if (matCode !== undefined && matCode !== null && String(matCode) !== '16' && String(matCode) !== '24') {
        resolvedCode = Number(matCode);
      }

      const ldrawColor = getLDrawColor(resolvedCode);
      const isTransparent = ldrawColor.isTrans || ldrawColor.category === 'transparent';
      const isMetallic = ldrawColor.category === 'metallic';

      // Preserva mapa de estampa/sticker/decalque se existir
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingMap = (curMat as any)?.map || null;

      // Criação de Material PBR de Plástico ABS Físico de Alta Fidelidade
      const pbrPlasticMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(ldrawColor.hex),
        map: existingMap,
        roughness: isTransparent ? 0.08 : 0.22,
        metalness: isMetallic ? 0.75 : 0.02,
        clearcoat: 0.35,
        clearcoatRoughness: 0.15,
        ior: 1.54, // Índice de refração do plástico ABS real
        reflectivity: 0.5,
        transmission: isTransparent ? 0.85 : 0.0,
        opacity: isTransparent ? 0.75 : 1.0,
        transparent: isTransparent || Boolean(existingMap),
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
    } else if ((child as THREE.LineSegments).isLineSegments || (child as THREE.Line).isLine) {
      // No motor ABS Studio, arestas/linhas de grade sobrepostas ficam ocultas
      // para evitar que as faces do modelo 3D fiquem expostas como malha em grade
      child.visible = wireframe;
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ('wireframe' in m) (m as any).wireframe = true;
          });
        } else if ('wireframe' in mesh.material) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mesh.material as any).wireframe = true;
        }
      }
    }
  });
}

/**
 * Finaliza o THREE.Group com o sistema de coordenadas e escala universais do Blocchi 3D.
 * Ajusta o ponto de origem vertical (pivot) para que a base da peça fique exatamente em Y = 0.
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

  // Ajustar o ponto de origem vertical (pivot) para que a base da peça repouse exatamente sobre o piso (Y = 0)
  group.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(group);
  if (isFinite(bbox.min.y)) {
    group.position.y = -bbox.min.y;
  }

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
 * Carrega a geometria bruta do arquivo LDraw (.dat ou .ldr) com suporte a decalques/estampas e cache em memória.
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

  // Detectar diretivas !TEXMAP para carregar decalques/stickers
  let texmapDirective: {
    p1: THREE.Vector3;
    p2: THREE.Vector3;
    p3: THREE.Vector3;
    imageName: string;
  } | null = null;

  try {
    const rawRes = await fetch(fileUrl);
    if (rawRes.ok) {
      const text = await rawRes.text();
      const match = text.match(
        /0\s+!TEXMAP\s+START\s+PLANAR\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+(\S+)/i
      );
      if (match) {
        texmapDirective = {
          p1: new THREE.Vector3(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])),
          p2: new THREE.Vector3(parseFloat(match[4]), parseFloat(match[5]), parseFloat(match[6])),
          p3: new THREE.Vector3(parseFloat(match[7]), parseFloat(match[8]), parseFloat(match[9])),
          imageName: match[10],
        };
      }
    }
  } catch {}

  return new Promise((resolve, reject) => {
    loader.load(
      fileUrl,
      (group: THREE.Group) => {
        if (texmapDirective) {
          applyPlanarTextureMapping(group, texmapDirective, ldrawPath);
        }
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
 * os materiais físicos PBR (ABS Studio) ou nativos (LDraw Loader), com pivot em Y = 0.
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
      // Motor ABS Studio: Plástico ABS PBR físico com reflexos, chanfros e IOR 1.54 sem malhas de grade
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

    if (engineMode === 'ldraw') {
      const edges = new THREE.EdgesGeometry(boxGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.position.y = sy / 2;
      group.add(wireframe);
    }

    group.userData = {
      partId,
      colorCode,
      engineMode,
      isFallback: true,
    };

    return group;
  }
}
