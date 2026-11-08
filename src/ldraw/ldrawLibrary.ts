import * as THREE from 'three';
import type { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';

/**
 * Camada de acesso à biblioteca oficial LDraw.
 *
 * Responsabilidades:
 * - carregar o filemap oficial uma única vez e normalizar caminhos (case-insensitive);
 * - resolver referências de sub-peças usando a prioridade correta
 *   (parts/ > p/48 > p > p/8), evitando primitivas octogonais;
 * - pré-carregar recursivamente toda a árvore de dependências antes do parse;
 * - pré-processar diretivas !TEXMAP PLANAR, injetando códigos de cor sentinela
 *   para que as texturas possam ser aplicadas após o parse do LDrawLoader.
 */

export interface LDrawTexmapRecord {
  code: string;
  imageName: string;
  imagePath: string;
  texture: THREE.Texture;
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  p3: THREE.Vector3;
}

export interface LDrawPreloadResult {
  rootPath: string;
  rootText: string;
  files: Map<string, string>;
  texmaps: Map<string, LDrawTexmapRecord>;
}

interface ProcessedFile {
  text: string;
  refs: string[];
  texmaps: LDrawTexmapRecord[];
}

const BASE_URL = import.meta.env.BASE_URL || '/';
export const LDRAW_BASE_PATH = BASE_URL.endsWith('/')
  ? `${BASE_URL}ldraw/`
  : `${BASE_URL}/ldraw/`;

/**
 * O GitHub Pages é case-sensitive. Toda requisição LDraw passa por aqui antes
 * de virar URL, garantindo que o caminho solicitado seja sempre lowercase.
 */
export function normalizeLDrawPath(value: string): string {
  return value
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^ldraw\//i, '')
    .trim()
    .toLowerCase();
}

const normalizePath = normalizeLDrawPath;

let fileMapPromise: Promise<Record<string, string>> | null = null;
let normalizedFileMap: Record<string, string> = Object.create(null);
let runtimeFileMapProxy: Record<string, string> | null = null;

const rawFileCache = new Map<string, string>();
const processedFileCache = new Map<string, ProcessedFile>();
const textureCache = new Map<string, THREE.Texture>();
const unavailableTextures = new Set<string>();
const texmapRecordsByKey = new Map<string, LDrawTexmapRecord>();
const texmapRecordsByCode = new Map<string, LDrawTexmapRecord>();

let nextTexmapCode = 900001;

function parseFileMap(raw: unknown): Record<string, string> {
  const normalized: Record<string, string> = Object.create(null);
  if (!raw || typeof raw !== 'object') return normalized;

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'string') continue;
    const normalizedKey = normalizePath(key);
    const normalizedValue = normalizePath(value);
    if (!normalizedKey || !normalizedValue) continue;
    normalized[normalizedKey] = normalizedValue;
  }

  return normalized;
}

async function loadFileMap(): Promise<Record<string, string>> {
  const url = `${LDRAW_BASE_PATH}filemap.json`;
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `[LDraw] Não foi possível buscar o filemap em "${url}". Verifique a conexão e o caminho base da aplicação.`,
      { cause: error }
    );
  }

  if (!response.ok) {
    throw new Error(
      `[LDraw] filemap oficial indisponível em "${url}" (HTTP ${response.status} ${response.statusText}). ` +
        'Execute "npm run sync-ldraw" para gerar public/ldraw/filemap.json.'
    );
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch (error) {
    throw new Error(`[LDraw] O arquivo "${url}" não contém JSON válido.`, { cause: error });
  }

  const map = parseFileMap(raw);
  if (Object.keys(map).length === 0) {
    throw new Error(`[LDraw] O filemap em "${url}" está vazio ou em formato inválido.`);
  }

  return map;
}

/**
 * Garante que o filemap esteja carregado e normalizado.
 */
export function ensureLDrawFileMap(): Promise<Record<string, string>> {
  if (!fileMapPromise) {
    fileMapPromise = loadFileMap()
      .then((map) => {
        normalizedFileMap = map;
        runtimeFileMapProxy = null;
        return map;
      })
      .catch((error) => {
        // Permite uma nova tentativa numa próxima chamada.
        fileMapPromise = null;
        throw error;
      });
  }

  return fileMapPromise;
}

/**
 * Proxy case-insensitive usado diretamente pelo LDrawLoader.
 * O parser consulta `loader.fileMap[fileName]`, e os arquivos LDraw
 * alternam entre maiúsculas/minúsculas em referências antigas.
 */
export function createCaseInsensitiveFileMap(
  fileMap: Record<string, string> = normalizedFileMap
): Record<string, string> {
  if (fileMap === normalizedFileMap && runtimeFileMapProxy) return runtimeFileMapProxy;

  const proxy = new Proxy(fileMap, {
    get(target, property) {
      if (typeof property !== 'string') {
        return Reflect.get(target, property);
      }
      const key = normalizePath(property);
      return target[key];
    },
    has(target, property) {
      if (typeof property !== 'string') return Reflect.has(target, property);
      return normalizePath(property) in target;
    },
  });

  if (fileMap === normalizedFileMap) {
    runtimeFileMapProxy = proxy;
  }

  return proxy;
}

/**
 * Anexa o filemap oficial (case-insensitive) ao LDrawLoader.
 */
export async function attachLDrawFileMap(loader: LDrawLoader): Promise<void> {
  const map = await ensureLDrawFileMap();
  loader.setFileMap(createCaseInsensitiveFileMap(map));
}

/**
 * Configura o LDrawLoader para usar o BASE_URL do Vite (localhost e subpasta
 * do GitHub Pages) e normaliza qualquer fetch interno para lowercase.
 */
export function configureLDrawLoader(
  loader: LDrawLoader,
  libraryPath: string = LDRAW_BASE_PATH
): void {
  const normalizedLibraryPath = libraryPath.endsWith('/') ? libraryPath : `${libraryPath}/`;

  loader.setPath(normalizedLibraryPath);
  loader.setPartsLibraryPath(normalizedLibraryPath);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loaderAny = loader as any;
  if (loaderAny.__ldrawCaseInsensitiveFetch) return;

  // O método fetchData pertence ao LDrawParsedCache interno (partsCache.parseCache),
  // não ao LDrawLoader. Sem este wrapper, o loader tenta caminhos com case misto
  // e falha em servidores case-sensitive como o GitHub Pages.
  const parseCache = loaderAny.partsCache?.parseCache;
  if (!parseCache || typeof parseCache.fetchData !== 'function') {
    console.warn(
      '[LDraw] partsCache.parseCache.fetchData não encontrado; ' +
        'o carregamento seguirá pelo filemap e pelo cache de arquivos pré-carregados.'
    );
    loaderAny.__ldrawCaseInsensitiveFetch = true;
    return;
  }

  const originalFetchData = parseCache.fetchData.bind(parseCache) as (
    fileName: string
  ) => Promise<string>;
  parseCache.fetchData = async (fileName: string) => {
    const originalName = fileName.replace(/\\/g, '/');
    const normalizedName = normalizePath(originalName);

    try {
      return await originalFetchData(normalizedName);
    } catch (error) {
      // Bibliotecas antigas podem ter sido publicadas com case misto. Nesse
      // caso, o caminho original ainda é tentado como último recurso.
      if (normalizedName !== originalName) {
        console.warn(
          `[LDraw] Busca em lowercase falhou para "${originalName}"; tentando o caminho original.`
        );
        return originalFetchData(originalName);
      }
      throw error;
    }
  };
  loaderAny.__ldrawCaseInsensitiveFetch = true;
}

/**
 * Resolve um nome de arquivo LDraw para o caminho canônico relativo à raiz /ldraw/.
 *
 * Ordem de resolução:
 * 1. caminho exato no filemap (já com a prioridade parts/ > p/48 > p > p/8);
 * 2. referência relativa ao arquivo atual;
 * 3. nome base no filemap.
 */
export function resolveLDrawPath(name: string, fromPath?: string): string | null {
  const normalized = normalizePath(name);
  if (!normalized) return null;

  const direct = normalizedFileMap[normalized];
  if (direct) return normalizePath(direct);

  // Referências relativas ao diretório do arquivo que as contém.
  if (fromPath) {
    const normalizedFrom = normalizePath(fromPath);
    const slash = normalizedFrom.lastIndexOf('/');
    if (slash > 0) {
      const relative = normalizePath(`${normalizedFrom.slice(0, slash)}/${normalized}`);
      const resolved = normalizedFileMap[relative];
      if (resolved) return normalizePath(resolved);
    }
  }

  // Alguns arquivos antigos usam apenas o nome base.
  const base = normalized.split('/').pop();
  if (base && base !== normalized) {
    const resolved = normalizedFileMap[base];
    if (resolved) return normalizePath(resolved);
  }

  const fallback = normalizedFileMap[base || normalized];
  return fallback ? normalizePath(fallback) : null;
}

export function getLDrawAssetUrl(canonicalPath: string): string {
  return `${LDRAW_BASE_PATH}${normalizePath(canonicalPath)}`;
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

function extractFileReferences(text: string): string[] {
  const refs: string[] = [];

  for (const line of splitLines(text)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('0')) continue;

    const tokens = trimmed.split(/\s+/);
    if (tokens[0] !== '1' || tokens.length < 15) continue;

    const fileName = tokens[tokens.length - 1].replace(/\\/g, '/');
    if (fileName) refs.push(fileName);
  }

  return refs;
}

const TEXMAP_START_REGEX =
  /^0\s+!TEXMAP\s+START\s+PLANAR\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(\S+)/i;

const TEXMAP_FALLBACK_REGEX = /^0\s+!TEXMAP\s+FALLBACK/i;
const TEXMAP_END_REGEX = /^0\s+!TEXMAP\s+END/i;
const ACTIVE_TEXMAP_LINE_REGEX = /^0\s+!:\s*(.*)$/;
const GEOMETRY_LINE_REGEX = /^\s*[1-5]\s+/;

async function loadTexture(imagePath: string): Promise<THREE.Texture | null> {
  const cached = textureCache.get(imagePath);
  if (cached) return cached;
  if (unavailableTextures.has(imagePath)) return null;

  const url = getLDrawAssetUrl(imagePath);
  try {
    // TextureLoader usa o cache HTTP do navegador; também valida a existência
    // do arquivo antes de qualquer geometria texturizada ser aceita.
    const texture = await new THREE.TextureLoader().loadAsync(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    textureCache.set(imagePath, texture);
    return texture;
  } catch (error) {
    unavailableTextures.add(imagePath);
    console.warn(
      `[LDraw] Textura "${imagePath}" não pôde ser carregada em "${url}". ` +
        'A geometria fallback (sem estampa) será usada para este bloco TEXMAP.',
      error
    );
    return null;
  }
}

async function getOrCreateTexmapRecord(
  imageName: string,
  imagePath: string,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3
): Promise<LDrawTexmapRecord | null> {
  const key = `${imagePath}|${p1.x},${p1.y},${p1.z}|${p2.x},${p2.y},${p2.z}|${p3.x},${p3.y},${p3.z}`;
  const existing = texmapRecordsByKey.get(key);
  if (existing) return existing;

  const texture = await loadTexture(imagePath);
  if (!texture) return null;

  // Códigos altos não colidem com a numeração oficial do LDConfig.
  const code = String(nextTexmapCode++);
  const record: LDrawTexmapRecord = {
    code,
    imageName,
    imagePath,
    texture,
    p1,
    p2,
    p3,
  };

  texmapRecordsByKey.set(key, record);
  texmapRecordsByCode.set(code, record);
  return record;
}

function replaceColorCode(line: string, code: string): string {
  const match = line.match(/^(\s*[1-5]\s+)(\S+)([\s\S]*)$/);
  if (!match) return line;
  return `${match[1]}${code}${match[3]}`;
}

/**
 * Processa blocos !TEXMAP PLANAR de um arquivo LDraw.
 *
 * - geometria ativa (`0 !:`) é descomentada e recebe um código sentinela;
 * - geometria fallback é comentada;
 * - TEXMAP não-planar ou sem textura disponível permanece intocado, de modo
 *   que o LDrawLoader continue exibindo a geometria fallback tradicional.
 */
async function processTexmapDirectives(
  text: string,
  canonicalPath: string
): Promise<{ text: string; texmaps: LDrawTexmapRecord[] }> {
  if (!text.includes('!TEXMAP')) {
    return { text, texmaps: [] };
  }

  const lines = splitLines(text);
  const result: string[] = [];
  const texmaps: LDrawTexmapRecord[] = [];

  let activeRecord: LDrawTexmapRecord | null = null;
  let inFallback = false;

  for (const line of lines) {
    const trimmed = line.trim();

    const startMatch = trimmed.match(TEXMAP_START_REGEX);
    if (startMatch) {
      const imageName = startMatch[10];
      const imagePath = resolveLDrawPath(imageName, canonicalPath);

      if (!imagePath) {
        console.warn(
          `[LDraw] TEXMAP em "${canonicalPath}" referencia a textura "${imageName}", ` +
            'mas ela não existe no filemap. A geometria fallback será usada.'
        );
        activeRecord = null;
      } else {
        activeRecord = await getOrCreateTexmapRecord(
          imageName,
          imagePath,
          new THREE.Vector3(
            parseFloat(startMatch[1]),
            parseFloat(startMatch[2]),
            parseFloat(startMatch[3])
          ),
          new THREE.Vector3(
            parseFloat(startMatch[4]),
            parseFloat(startMatch[5]),
            parseFloat(startMatch[6])
          ),
          new THREE.Vector3(
            parseFloat(startMatch[7]),
            parseFloat(startMatch[8]),
            parseFloat(startMatch[9])
          )
        );

        if (activeRecord) {
          texmaps.push(activeRecord);
        }
      }

      inFallback = false;
      result.push(line);
      continue;
    }

    if (TEXMAP_FALLBACK_REGEX.test(trimmed)) {
      if (activeRecord) inFallback = true;
      result.push(line);
      continue;
    }

    if (TEXMAP_END_REGEX.test(trimmed)) {
      activeRecord = null;
      inFallback = false;
      result.push(line);
      continue;
    }

    if (activeRecord) {
      const activeMatch = line.match(ACTIVE_TEXMAP_LINE_REGEX);
      if (activeMatch && activeMatch[1]) {
        const activeLine = replaceColorCode(activeMatch[1], activeRecord.code);
        result.push(activeLine);
        continue;
      }

      if (inFallback && GEOMETRY_LINE_REGEX.test(line)) {
        result.push(`0 // ${line}`);
        continue;
      }
    }

    result.push(line);
  }

  return { text: result.join('\n'), texmaps };
}

function buildAssetCandidates(canonicalPath: string): string[] {
  const normalized = normalizePath(canonicalPath);
  const base = normalized.split('/').pop() ?? normalized;
  const candidates = [normalized];

  // Fallback para bibliotecas publicadas antes da normalização de case, ou
  // quando a referência veio sem o diretório oficial (ex.: "s/..." ou "48/...").
  for (const prefix of [
    'parts/',
    'parts/s/',
    'parts/textures/',
    'p/',
    'p/48/',
    'p/8/',
    'textures/',
    'models/',
  ]) {
    const candidate = `${prefix}${base}`;
    if (!candidates.includes(candidate)) candidates.push(candidate);
  }

  return candidates;
}

async function fetchLDrawText(canonicalPath: string): Promise<string> {
  const normalizedPath = normalizePath(canonicalPath);
  const cached = rawFileCache.get(normalizedPath);
  if (cached !== undefined) return cached;

  const attempts: Array<{ url: string; status: string }> = [];

  for (const candidate of buildAssetCandidates(normalizedPath)) {
    const url = getLDrawAssetUrl(candidate);

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      attempts.push({ url, status: 'falha de rede' });
      console.error(
        `[LDraw] Falha de rede ao buscar "${candidate}". URL exata: ${url}`,
        error
      );
      continue;
    }

    if (!response.ok) {
      attempts.push({ url, status: `HTTP ${response.status} ${response.statusText}` });
      if (response.status === 404) {
        console.error(`[LDraw] 404 (Not Found): ${url}`);
      }
      continue;
    }

    const text = await response.text();
    const head = text.slice(0, 200).trim().toLowerCase();
    if (head.startsWith('<!doctype html') || head.startsWith('<html')) {
      attempts.push({ url, status: 'HTML de fallback (arquivo ausente)' });
      console.error(`[LDraw] O servidor devolveu HTML em vez do arquivo LDraw: ${url}`);
      continue;
    }

    rawFileCache.set(normalizedPath, text);
    return text;
  }

  const attemptedUrls = attempts.map((attempt) => `  - ${attempt.url} (${attempt.status})`).join('\n');
  throw new Error(
    `[LDraw] Recurso oficial não encontrado: "${normalizedPath}".\n` +
      `URLs tentadas (base "${LDRAW_BASE_PATH}"):\n${attemptedUrls}`
  );
}

async function getProcessedFile(canonicalPath: string): Promise<ProcessedFile> {
  const cached = processedFileCache.get(canonicalPath);
  if (cached) return cached;

  const rawText = await fetchLDrawText(canonicalPath);
  const { text, texmaps } = await processTexmapDirectives(rawText, canonicalPath);
  const processed: ProcessedFile = {
    text,
    refs: extractFileReferences(text),
    texmaps,
  };

  processedFileCache.set(canonicalPath, processed);
  return processed;
}

function normalizePartRequest(partId: string): string[] {
  const clean = partId
    .trim()
    .replace(/\\/g, '/')
    .replace(/^ldraw\//i, '')
    .replace(/^\/+/, '');
  if (!clean) return [];

  const candidates: string[] = [];
  if (clean.toLowerCase().endsWith('.dat') || clean.toLowerCase().endsWith('.ldr')) {
    candidates.push(clean);
  } else {
    candidates.push(`parts/${clean}.dat`, `${clean}.dat`);
  }
  candidates.push(clean);
  return candidates;
}

/**
 * Pré-carrega a árvore completa de dependências de uma peça oficial.
 * Nenhum fallback silencioso é criado: dependências ausentes geram erro
 * detalhado com o encadeamento de referências.
 */
export async function preloadLDrawPart(partId: string): Promise<LDrawPreloadResult> {
  await ensureLDrawFileMap();

  let rootPath: string | null = null;
  const attempted: string[] = [];

  for (const candidate of normalizePartRequest(partId)) {
    attempted.push(candidate);
    rootPath = resolveLDrawPath(candidate);
    if (rootPath) break;
  }

  if (!rootPath) {
    throw new Error(
      `[LDraw] Peça "${partId}" não encontrada no filemap. Tentativas: ${attempted.join(', ')}. ` +
        'Nenhuma geometria substituta será criada.'
    );
  }

  const files = new Map<string, string>();
  const texmaps = new Map<string, LDrawTexmapRecord>();
  const failedDependencies = new Map<string, string[]>();
  const visited = new Set<string>([rootPath]);
  let frontier: string[] = [rootPath];

  while (frontier.length > 0) {
    const nextSet = new Set<string>();

    await Promise.all(
      frontier.map(async (canonicalPath) => {
        const processed = await getProcessedFile(canonicalPath);
        files.set(canonicalPath, processed.text);

        for (const record of processed.texmaps) {
          texmaps.set(record.code, record);
        }

        for (const reference of processed.refs) {
          const resolved = resolveLDrawPath(reference, canonicalPath);
          if (!resolved) {
            const entries = failedDependencies.get(canonicalPath) ?? [];
            entries.push(reference);
            failedDependencies.set(canonicalPath, entries);
            continue;
          }
          if (!visited.has(resolved)) nextSet.add(resolved);
        }
      })
    );

    for (const next of nextSet) visited.add(next);
    frontier = [...nextSet];
  }

  if (failedDependencies.size > 0) {
    const details = [...failedDependencies.entries()]
      .map(([parent, children]) => `  - "${parent}" -> ${children.map((c) => `"${c}"`).join(', ')}`)
      .join('\n');

    failedDependencies.clear();
    throw new Error(
      `[LDraw] Dependências não resolvidas ao carregar a peça "${partId}":\n${details}\n` +
        'A peça será omitida da cena para não corromper o modelo.'
    );
  }

  const rootText = files.get(rootPath);
  if (!rootText) {
    throw new Error(`[LDraw] Arquivo raiz "${rootPath}" não pôde ser pré-carregado.`);
  }

  return { rootPath, rootText, files, texmaps };
}

/**
 * Injeta os textos pré-processados no cache interno do LDrawLoader.
 * Isso evita o trial-and-error de fetchData e preserva os caminhos canônicos,
 * além de garantir que os códigos sentinela de TEXMAP sejam vistos pelo parser.
 */
export function installPreloadedFiles(
  loader: LDrawLoader,
  files: Map<string, string>
): void {
  // Tipos internos do addon não expõem parseCache; o acesso é intencional.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseCache = (loader as any).partsCache?.parseCache;
  if (!parseCache || typeof parseCache.setData !== 'function') {
    throw new Error('[LDraw] Cache interno do LDrawLoader indisponível nesta versão do Three.js.');
  }

  for (const [canonicalPath, text] of files) {
    try {
      parseCache.setData(canonicalPath, text);
    } catch (error) {
      throw new Error(`[LDraw] Falha ao interpretar o arquivo "${canonicalPath}".`, {
        cause: error,
      });
    }
  }
}

export function getTexmapRecordByCode(code: string): LDrawTexmapRecord | undefined {
  return texmapRecordsByCode.get(code);
}

/**
 * Registra materiais sentinela para que o material pass do LDrawLoader
 * resolva os códigos de textura em vez de usar o material "missing".
 */
export function registerTexmapMaterials(
  loader: LDrawLoader,
  records: Iterable<LDrawTexmapRecord>
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loaderAny = loader as any;
  const materialLibrary: Record<string, THREE.Material> = loaderAny.materialLibrary ?? {};

  for (const record of records) {
    if (materialLibrary[record.code]) continue;

    const material = new THREE.MeshStandardMaterial({
      name: `TEXMAP ${record.imageName}`,
      color: new THREE.Color(0xffffff),
      map: record.texture,
      roughness: 0.35,
      metalness: 0.02,
      transparent: true,
      alphaTest: 0.01,
      side: THREE.DoubleSide,
    });
    material.userData = {
      code: record.code,
      texmapCode: record.code,
      texmapImage: record.imagePath,
    };

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(0x111111),
      transparent: true,
      opacity: 0.6,
    });
    edgeMaterial.userData = { code: record.code };

    const conditionalMaterial = new LDrawConditionalLineMaterial({
      color: new THREE.Color(0x111111),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      // A tipagem do addon não declara `color`, embora o shader o aceite.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    conditionalMaterial.userData = { code: record.code };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loaderAny.edgeMaterialCache as WeakMap<THREE.Material, THREE.Material> | undefined)?.set(
      material,
      edgeMaterial
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loaderAny.conditionalEdgeMaterialCache as
      | WeakMap<THREE.Material, THREE.Material>
      | undefined)?.set(edgeMaterial, conditionalMaterial);

    loader.addMaterial(material);
  }
}

/**
 * Aplica coordenadas UV planares por grupo de material.
 *
 * O LDrawLoader gera uma única geometria com grupos de material, então cada
 * grupo texturizado recebe a projeção do seu próprio plano TEXMAP.
 */
export function applyTexmapUVs(group: THREE.Object3D): void {
  group.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;

    const mesh = child as THREE.Mesh;
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const position = geometry?.attributes?.position;
    if (!position) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const groups = geometry.groups.length > 0 ? geometry.groups : null;
    if (!groups) return;

    let uvAttribute: THREE.BufferAttribute | null = null;

    for (const groupInfo of groups) {
      const materialIndex = groupInfo.materialIndex ?? 0;
      const material = materials[materialIndex] as THREE.Material | undefined;
      const code = material?.userData?.texmapCode as string | undefined;
      if (!code) continue;

      const record = texmapRecordsByCode.get(code);
      if (!record) continue;

      if (!uvAttribute) {
        uvAttribute = new THREE.BufferAttribute(new Float32Array(position.count * 2), 2);
      }

      const uVec = new THREE.Vector3().subVectors(record.p2, record.p1);
      const vVec = new THREE.Vector3().subVectors(record.p3, record.p1);
      const uLenSq = uVec.lengthSq();
      const vLenSq = vVec.lengthSq();
      if (uLenSq === 0 || vLenSq === 0) continue;

      const vertex = new THREE.Vector3();
      const diff = new THREE.Vector3();
      const start = Math.max(0, groupInfo.start);
      const end = Math.min(position.count, start + groupInfo.count);

      for (let i = start; i < end; i++) {
        vertex.fromBufferAttribute(position, i);
        diff.subVectors(vertex, record.p1);
        const u = diff.dot(uVec) / uLenSq;
        const v = 1.0 - diff.dot(vVec) / vLenSq;
        uvAttribute.setXY(i, u, v);
      }
    }

    if (uvAttribute) {
      uvAttribute.needsUpdate = true;
      geometry.setAttribute('uv', uvAttribute);
    }
  });
}
