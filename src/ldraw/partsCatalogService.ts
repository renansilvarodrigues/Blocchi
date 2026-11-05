import type { LegoPartDefinition, LegoCategory } from '../types/lego';
import { LEGO_PARTS_CATALOG } from './partsData';

let cachedCatalog: LegoPartDefinition[] | null = null;
let catalogPromise: Promise<LegoPartDefinition[]> | null = null;
const partMap = new Map<string, LegoPartDefinition>();

// Inicializa o mapa com as peças curadas embutidas
LEGO_PARTS_CATALOG.forEach((part) => partMap.set(part.id.toLowerCase(), part));

/**
 * Normaliza categorias LDraw para as 10 categorias padrão do Blocchi 3D
 */
export function normalizeCategory(rawCategory: string = '', description: string = ''): LegoCategory {
  const cat = (rawCategory || '').trim().toLowerCase();
  const desc = (description || '').trim().toLowerCase();

  // 1. Minifig
  if (
    cat.includes('minifig') ||
    cat.includes('figure') ||
    desc.includes('minifig') ||
    desc.includes('figure') ||
    desc.includes('torso') ||
    desc.includes('headgear')
  ) {
    return 'Minifig';
  }

  // 2. Technic
  if (cat.includes('technic') || desc.startsWith('technic') || desc.includes('technic axle') || desc.includes('technic pin') || desc.includes('technic beam')) {
    return 'Technic';
  }

  // 3. Slopes
  if (cat.includes('slope') || cat.includes('wedge') || desc.startsWith('slope') || desc.includes('slope ') || desc.includes('wedge ')) {
    return 'Slopes';
  }

  // 4. Tiles
  if (cat.includes('tile') || desc.startsWith('tile') || desc.includes('tile ')) {
    return 'Tiles';
  }

  // 5. Rounds
  if (
    cat.includes('cylinder') ||
    cat.includes('cone') ||
    cat.includes('dish') ||
    cat.includes('round') ||
    desc.includes('round') ||
    desc.includes('cone') ||
    desc.includes('cylinder') ||
    desc.includes('dish')
  ) {
    return 'Rounds';
  }

  // 6. Baseplates
  if (cat.includes('baseplate') || desc.startsWith('baseplate') || desc.includes('baseplate ')) {
    return 'Baseplates';
  }

  // 7. Panels
  if (
    cat.includes('panel') ||
    cat.includes('windscreen') ||
    cat.includes('window') ||
    cat.includes('door') ||
    desc.includes('panel') ||
    desc.includes('windscreen') ||
    desc.includes('window') ||
    desc.includes('door')
  ) {
    return 'Panels';
  }

  // 8. Plates
  if (cat.includes('plate') || desc.startsWith('plate') || desc.includes('plate ')) {
    return 'Plates';
  }

  // 9. Bricks
  if (cat.includes('brick') || cat.includes('arch') || desc.startsWith('brick') || desc.includes('brick ')) {
    return 'Bricks';
  }

  // 10. Special
  return 'Special';
}

/**
 * Estima dimensões aproximadas (studsX, studsZ, heightPlates) a partir do nome/descrição
 */
function estimateDimensions(name: string, category: LegoCategory): { studsX: number; studsZ: number; heightPlates: number } {
  let studsX = 1;
  let studsZ = 1;
  let heightPlates = 3; // Padrão Brick

  // Detectar altura por categoria
  if (category === 'Plates' || category === 'Tiles') {
    heightPlates = 1;
  } else if (category === 'Baseplates') {
    heightPlates = 0.5;
  } else if (category === 'Minifig') {
    heightPlates = 4;
  }

  // Procurar padrão "X x Z" (ex: "Brick 2 x 4" ou "Plate 1 x 2")
  const match = name.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
  if (match) {
    studsX = Math.max(1, Math.round(parseFloat(match[1])));
    studsZ = Math.max(1, Math.round(parseFloat(match[2])));
  }

  return { studsX, studsZ, heightPlates };
}

/**
 * Faz o parse de um arquivo parts.lst oficial do LDraw
 */
export function parsePartsLst(content: string): LegoPartDefinition[] {
  const lines = content.split(/\r?\n/);
  const result: LegoPartDefinition[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#') || rawLine.startsWith('0 ')) continue;

    // Formato padrão: "<filename.dat><tab ou espaços><description>"
    const sepIdx = rawLine.search(/[\t\s]/);
    if (sepIdx === -1) continue;

    const fullFilename = rawLine.substring(0, sepIdx).trim();
    const description = rawLine.substring(sepIdx + 1).trim();

    if (!fullFilename.toLowerCase().endsWith('.dat')) continue;

    // Ignorar subpeças internas de /s/ no menu principal
    if (fullFilename.toLowerCase().startsWith('s/') || fullFilename.toLowerCase().startsWith('parts/s/')) {
      continue;
    }

    // Extrair ID limpo (ex: "parts/3001.dat" -> "3001", "3001.dat" -> "3001")
    const cleanFilename = fullFilename.replace(/^parts[/\\]/i, '');
    const id = cleanFilename.replace(/\.dat$/i, '').trim();
    if (!id) continue;

    // Ignorar redirecionamentos LDraw (ex: "~Moved to 3821")
    if (description.startsWith('~Moved to') || description.startsWith('_Moved to')) {
      continue;
    }

    // Se já temos a peça na lista de peças curadas de alta precisão, preservá-la
    const curated = partMap.get(id.toLowerCase());
    if (curated) {
      result.push(curated);
      continue;
    }

    const cleanName = description.replace(/^[~_]\s*/, '').trim();
    const category = normalizeCategory('', cleanName);
    const dimensions = estimateDimensions(cleanName, category);

    const partDef: LegoPartDefinition = {
      id,
      name: cleanName,
      category,
      dimensions,
      lduSize: {
        x: dimensions.studsX * 20,
        y: dimensions.heightPlates * 8,
        z: dimensions.studsZ * 20,
      },
      hasStuds: category !== 'Tiles' && !cleanName.toLowerCase().includes('tile'),
      description: cleanName,
      isFlexible: cleanName.toLowerCase().includes('flexible') || cleanName.toLowerCase().includes('hose') || cleanName.toLowerCase().includes('chain'),
    };

    partMap.set(id.toLowerCase(), partDef);
    result.push(partDef);
  }

  return result;
}

/**
 * Carrega a lista completa oficial do catálogo LDraw sob demanda (Lazy Loading)
 * Lê prioritariamente `parts.lst` da biblioteca LDraw.
 */
export async function getPartsCatalog(): Promise<LegoPartDefinition[]> {
  if (cachedCatalog) return cachedCatalog;
  if (catalogPromise) return catalogPromise;

  catalogPromise = (async () => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const ldrawBase = baseUrl.endsWith('/') ? `${baseUrl}ldraw/` : `${baseUrl}/ldraw/`;

    // 1. Tentar ler o índice oficial parts.lst
    try {
      const partsLstUrl = `${ldrawBase}parts.lst`;
      const response = await fetch(partsLstUrl);
      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 50) {
          const parsed = parsePartsLst(text);
          if (parsed.length > 0) {
            console.log(`[LDraw Catalog] Carregadas com sucesso ${parsed.length} peças oficiais via parts.lst.`);
            cachedCatalog = parsed;
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('[LDraw Catalog] Aviso ao buscar parts.lst, tentando fallback JSON:', err);
    }

    // 2. Fallback: tentar ler parts-catalog.json se parts.lst não estiver disponível
    try {
      const jsonUrl = `${ldrawBase}parts-catalog.json`;
      const jsonRes = await fetch(jsonUrl);
      if (jsonRes.ok) {
        const jsonData = (await jsonRes.json()) as LegoPartDefinition[];
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const map = new Map<string, LegoPartDefinition>();
          LEGO_PARTS_CATALOG.forEach((p) => map.set(p.id.toLowerCase(), p));
          jsonData.forEach((p) => {
            if (!map.has(p.id.toLowerCase())) {
              map.set(p.id.toLowerCase(), p);
            }
          });
          const merged = Array.from(map.values());
          console.log(`[LDraw Catalog] Carregadas ${merged.length} peças via parts-catalog.json.`);
          merged.forEach((p) => partMap.set(p.id.toLowerCase(), p));
          cachedCatalog = merged;
          return merged;
        }
      }
    } catch (err) {
      console.warn('[LDraw Catalog] Aviso ao carregar parts-catalog.json:', err);
    }

    // 3. Fallback final: usar o catálogo interno estático de alta fidelidade
    console.info('[LDraw Catalog] Usando catálogo interno de alta fidelidade.');
    cachedCatalog = LEGO_PARTS_CATALOG;
    return LEGO_PARTS_CATALOG;
  })();

  return catalogPromise;
}

/**
 * Obtém a definição de uma peça pelo ID (busca O(1))
 */
export function getPartDefinition(partId: string): LegoPartDefinition | undefined {
  return partMap.get(partId.toLowerCase());
}

/**
 * Obtém a definição de uma peça ou cria uma definição segura de fallback
 */
export function getPartDefinitionOrFallback(partId: string): LegoPartDefinition {
  const existing = partMap.get(partId.toLowerCase());
  if (existing) return existing;

  // Cria definição dinâmica segura para peças que não estavam no índice
  const fallbackDef: LegoPartDefinition = {
    id: partId,
    name: `LDraw Part #${partId}`,
    category: 'Special',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 20 },
    hasStuds: true,
    description: `Peça LDraw ${partId}`,
  };

  partMap.set(partId.toLowerCase(), fallbackDef);
  return fallbackDef;
}

