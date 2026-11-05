import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const cacheDir = path.join(rootDir, 'ldraw_cache');
const zipPath = path.join(cacheDir, 'complete.zip');
const publicLDrawDir = path.join(rootDir, 'public', 'ldraw');

const LDRAW_ZIP_URL = 'https://library.ldraw.org/library/updates/complete.zip';

// Lista de peças prioritárias oficiais do catálogo abrangendo todas as categorias
export const CURATED_PARTS_LIST = [
  // Bricks
  { id: '3001', name: 'Brick 2 x 4', category: 'Bricks', studsX: 2, studsZ: 4, heightPlates: 3, hasStuds: true },
  { id: '3002', name: 'Brick 2 x 3', category: 'Bricks', studsX: 2, studsZ: 3, heightPlates: 3, hasStuds: true },
  { id: '3003', name: 'Brick 2 x 2', category: 'Bricks', studsX: 2, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3004', name: 'Brick 1 x 2', category: 'Bricks', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3005', name: 'Brick 1 x 1', category: 'Bricks', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: true },
  { id: '3622', name: 'Brick 1 x 3', category: 'Bricks', studsX: 1, studsZ: 3, heightPlates: 3, hasStuds: true },
  { id: '3010', name: 'Brick 1 x 4', category: 'Bricks', studsX: 1, studsZ: 4, heightPlates: 3, hasStuds: true },
  { id: '3009', name: 'Brick 1 x 6', category: 'Bricks', studsX: 1, studsZ: 6, heightPlates: 3, hasStuds: true },
  { id: '3008', name: 'Brick 1 x 8', category: 'Bricks', studsX: 1, studsZ: 8, heightPlates: 3, hasStuds: true },
  { id: '2456', name: 'Brick 2 x 6', category: 'Bricks', studsX: 2, studsZ: 6, heightPlates: 3, hasStuds: true },
  { id: '3007', name: 'Brick 2 x 8', category: 'Bricks', studsX: 2, studsZ: 8, heightPlates: 3, hasStuds: true },
  { id: '2357', name: 'Brick 2 x 2 Corner', category: 'Bricks', studsX: 2, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '6091', name: 'Brick 1 x 2 x 1 1/3 with Curved Top', category: 'Bricks', studsX: 1, studsZ: 2, heightPlates: 4, hasStuds: true },
  { id: '3659', name: 'Brick 1 x 4 Arch', category: 'Bricks', studsX: 1, studsZ: 4, heightPlates: 3, hasStuds: true },

  // Plates
  { id: '3024', name: 'Plate 1 x 1', category: 'Plates', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: true },
  { id: '3023', name: 'Plate 1 x 2', category: 'Plates', studsX: 1, studsZ: 2, heightPlates: 1, hasStuds: true },
  { id: '3623', name: 'Plate 1 x 3', category: 'Plates', studsX: 1, studsZ: 3, heightPlates: 1, hasStuds: true },
  { id: '3710', name: 'Plate 1 x 4', category: 'Plates', studsX: 1, studsZ: 4, heightPlates: 1, hasStuds: true },
  { id: '3666', name: 'Plate 1 x 6', category: 'Plates', studsX: 1, studsZ: 6, heightPlates: 1, hasStuds: true },
  { id: '3460', name: 'Plate 1 x 8', category: 'Plates', studsX: 1, studsZ: 8, heightPlates: 1, hasStuds: true },
  { id: '3022', name: 'Plate 2 x 2', category: 'Plates', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: true },
  { id: '3021', name: 'Plate 2 x 3', category: 'Plates', studsX: 2, studsZ: 3, heightPlates: 1, hasStuds: true },
  { id: '3020', name: 'Plate 2 x 4', category: 'Plates', studsX: 2, studsZ: 4, heightPlates: 1, hasStuds: true },
  { id: '3795', name: 'Plate 2 x 6', category: 'Plates', studsX: 2, studsZ: 6, heightPlates: 1, hasStuds: true },
  { id: '3034', name: 'Plate 2 x 8', category: 'Plates', studsX: 2, studsZ: 8, heightPlates: 1, hasStuds: true },
  { id: '3031', name: 'Plate 4 x 4', category: 'Plates', studsX: 4, studsZ: 4, heightPlates: 1, hasStuds: true },
  { id: '3032', name: 'Plate 4 x 6', category: 'Plates', studsX: 4, studsZ: 6, heightPlates: 1, hasStuds: true },
  { id: '3035', name: 'Plate 4 x 8', category: 'Plates', studsX: 4, studsZ: 8, heightPlates: 1, hasStuds: true },
  { id: '2420', name: 'Plate 2 x 2 Corner', category: 'Plates', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: true },

  // Tiles
  { id: '3070b', name: 'Tile 1 x 1 with Groove', category: 'Tiles', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: false },
  { id: '3069b', name: 'Tile 1 x 2 with Groove', category: 'Tiles', studsX: 1, studsZ: 2, heightPlates: 1, hasStuds: false },
  { id: '63864', name: 'Tile 1 x 3', category: 'Tiles', studsX: 1, studsZ: 3, heightPlates: 1, hasStuds: false },
  { id: '2431', name: 'Tile 1 x 4 with Groove', category: 'Tiles', studsX: 1, studsZ: 4, heightPlates: 1, hasStuds: false },
  { id: '6636', name: 'Tile 1 x 6 with Groove', category: 'Tiles', studsX: 1, studsZ: 6, heightPlates: 1, hasStuds: false },
  { id: '3068b', name: 'Tile 2 x 2 with Groove', category: 'Tiles', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: false },
  { id: '87079', name: 'Tile 2 x 4 with Groove', category: 'Tiles', studsX: 2, studsZ: 4, heightPlates: 1, hasStuds: false },

  // Slopes (Rampas / Inclinadas)
  { id: '54200', name: 'Slope 31 1 x 1 x 2/3 (Cheese)', category: 'Slopes', studsX: 1, studsZ: 1, heightPlates: 2, hasStuds: false },
  { id: '3040b', name: 'Slope 45 2 x 1', category: 'Slopes', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3039', name: 'Slope 45 2 x 2', category: 'Slopes', studsX: 2, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3037', name: 'Slope 45 2 x 4', category: 'Slopes', studsX: 2, studsZ: 4, heightPlates: 3, hasStuds: true },
  { id: '4286', name: 'Slope 33 3 x 1', category: 'Slopes', studsX: 1, studsZ: 3, heightPlates: 3, hasStuds: true },
  { id: '3298', name: 'Slope 33 3 x 2', category: 'Slopes', studsX: 2, studsZ: 3, heightPlates: 3, hasStuds: true },
  { id: '3665', name: 'Slope 45 2 x 1 Inverted', category: 'Slopes', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3660', name: 'Slope 45 2 x 2 Inverted', category: 'Slopes', studsX: 2, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '60481', name: 'Slope 65 2 x 1 x 2', category: 'Slopes', studsX: 1, studsZ: 2, heightPlates: 6, hasStuds: true },
  { id: '85984', name: 'Slope 30 1 x 2 x 2/3', category: 'Slopes', studsX: 1, studsZ: 2, heightPlates: 2, hasStuds: false },

  // Rounds (Cilíndricas)
  { id: '4073', name: 'Plate 1 x 1 Round', category: 'Rounds', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: true },
  { id: '3062b', name: 'Brick 1 x 1 Round with Hollow Stud', category: 'Rounds', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: true },
  { id: '4032', name: 'Plate 2 x 2 Round', category: 'Rounds', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: true },
  { id: '3941', name: 'Brick 2 x 2 Round', category: 'Rounds', studsX: 2, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '98138', name: 'Tile 1 x 1 Round', category: 'Rounds', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: false },
  { id: '14769', name: 'Tile 2 x 2 Round', category: 'Rounds', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: false },
  { id: '4589b', name: 'Cone 1 x 1 with Top Groove', category: 'Rounds', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: true },
  { id: '3942c', name: 'Cone 2 x 2 x 2 with Open Stud', category: 'Rounds', studsX: 2, studsZ: 2, heightPlates: 6, hasStuds: true },
  { id: '3960', name: 'Dish 4 x 4 Inverted (Radar)', category: 'Rounds', studsX: 4, studsZ: 4, heightPlates: 3, hasStuds: true },

  // Technic
  { id: '3700', name: 'Technic Brick 1 x 2 with Hole', category: 'Technic', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3701', name: 'Technic Brick 1 x 4 with 3 Holes', category: 'Technic', studsX: 1, studsZ: 4, heightPlates: 3, hasStuds: true },
  { id: '3894', name: 'Technic Brick 1 x 6 with 5 Holes', category: 'Technic', studsX: 1, studsZ: 6, heightPlates: 3, hasStuds: true },
  { id: '3702', name: 'Technic Brick 1 x 8 with 7 Holes', category: 'Technic', studsX: 1, studsZ: 8, heightPlates: 3, hasStuds: true },
  { id: '2780', name: 'Technic Pin with Friction Ridges', category: 'Technic', studsX: 1, studsZ: 2, heightPlates: 1, hasStuds: false },
  { id: '3673', name: 'Technic Pin without Friction', category: 'Technic', studsX: 1, studsZ: 2, heightPlates: 1, hasStuds: false },
  { id: '6558', name: 'Technic Pin Long with Friction', category: 'Technic', studsX: 1, studsZ: 3, heightPlates: 1, hasStuds: false },
  { id: '32054', name: 'Technic Pin 3L with Stop Bush', category: 'Technic', studsX: 1, studsZ: 3, heightPlates: 1, hasStuds: false },
  { id: '3705', name: 'Technic Axle 4L', category: 'Technic', studsX: 1, studsZ: 4, heightPlates: 1, hasStuds: false },
  { id: '3706', name: 'Technic Axle 6L', category: 'Technic', studsX: 1, studsZ: 6, heightPlates: 1, hasStuds: false },
  { id: '32523', name: 'Technic Beam 1 x 3 Thick', category: 'Technic', studsX: 1, studsZ: 3, heightPlates: 2.5, hasStuds: false },
  { id: '32524', name: 'Technic Beam 1 x 7 Thick', category: 'Technic', studsX: 1, studsZ: 7, heightPlates: 2.5, hasStuds: false },

  // Panels
  { id: '4865', name: 'Panel 1 x 2 x 1', category: 'Panels', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '2362a', name: 'Panel 1 x 2 x 3 with Hollow Studs', category: 'Panels', studsX: 1, studsZ: 2, heightPlates: 9, hasStuds: true },
  { id: '60581', name: 'Panel 1 x 4 x 3', category: 'Panels', studsX: 1, studsZ: 4, heightPlates: 9, hasStuds: true },
  { id: '3823', name: 'Windscreen 2 x 4 x 2', category: 'Panels', studsX: 2, studsZ: 4, heightPlates: 6, hasStuds: true },
  { id: '3853', name: 'Window 1 x 4 x 3', category: 'Panels', studsX: 1, studsZ: 4, heightPlates: 9, hasStuds: true },

  // Minifig
  { id: '3626b', name: 'Minifig Head with Hollow Stud', category: 'Minifig', studsX: 1, studsZ: 1, heightPlates: 3.5, hasStuds: true },
  { id: '973', name: 'Minifig Torso', category: 'Minifig', studsX: 1, studsZ: 2, heightPlates: 4, hasStuds: true },
  { id: '970c00', name: 'Minifig Hips and Legs', category: 'Minifig', studsX: 1, studsZ: 2, heightPlates: 5, hasStuds: false },
  { id: '3838', name: 'Minifig Air Tanks', category: 'Minifig', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: false },
  { id: '3844', name: 'Minifig Helmet Castle', category: 'Minifig', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: false },

  // Baseplates
  { id: '3867', name: 'Baseplate 16 x 16', category: 'Baseplates', studsX: 16, studsZ: 16, heightPlates: 0.5, hasStuds: true },
  { id: '3811', name: 'Baseplate 32 x 32', category: 'Baseplates', studsX: 32, studsZ: 32, heightPlates: 0.5, hasStuds: true },
  { id: '41539', name: 'Plate 8 x 8', category: 'Baseplates', studsX: 8, studsZ: 8, heightPlates: 1, hasStuds: true },

  // Special & Flexible
  { id: '4070', name: 'Brick 1 x 1 with Headlight', category: 'Special', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: true },
  { id: '4085c', name: 'Plate 1 x 1 with Clip Vertical', category: 'Special', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: true },
  { id: '60477', name: 'Plate 1 x 2 with Handle', category: 'Special', studsX: 1, studsZ: 2, heightPlates: 1, hasStuds: true },
  { id: '3937', name: 'Hinge Brick 1 x 2 Base', category: 'Special', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3938', name: 'Hinge Brick 1 x 2 Top', category: 'Special', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3680', name: 'Turntable 2 x 2 Plate Base', category: 'Special', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: true },
  { id: '14301', name: 'Hose Flexible 11.5L', category: 'Special', studsX: 1, studsZ: 12, heightPlates: 1, hasStuds: false, isFlexible: true },
  { id: '73590', name: 'Hose Flexible 8.5L', category: 'Special', studsX: 1, studsZ: 9, heightPlates: 1, hasStuds: false, isFlexible: true },
  { id: '30104', name: 'Chain 21 Links', category: 'Special', studsX: 1, studsZ: 10, heightPlates: 1, hasStuds: false, isFlexible: true },
  { id: '14696', name: 'Technic Chain Link Reinforced', category: 'Special', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: false, isFlexible: true },
];

/**
 * Normaliza categorias de metadados LDraw para a taxonomia padrão do Blocchi
 */
export function normalizeCategory(rawCategory, description = '') {
  const cat = (rawCategory || '').trim().toLowerCase();
  const desc = (description || '').trim().toLowerCase();

  // 1. Minifig
  if (cat.includes('minifig') || cat.includes('figure') || desc.includes('minifig') || desc.includes('figure')) {
    return 'Minifig';
  }

  // 2. Technic
  if (cat.includes('technic') || desc.startsWith('technic')) {
    return 'Technic';
  }

  // 3. Slopes
  if (cat.includes('slope') || cat.includes('wedge') || desc.startsWith('slope') || desc.includes('slope ')) {
    return 'Slopes';
  }

  // 4. Tiles
  if (cat.includes('tile') || desc.startsWith('tile')) {
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
    desc.includes('cylinder')
  ) {
    return 'Rounds';
  }

  // 6. Baseplates
  if (cat.includes('baseplate') || desc.startsWith('baseplate')) {
    return 'Baseplates';
  }

  // 7. Panels
  if (cat.includes('panel') || cat.includes('windscreen') || cat.includes('window') || cat.includes('door') || desc.includes('panel') || desc.includes('windscreen')) {
    return 'Panels';
  }

  // 8. Plates
  if (cat.includes('plate') || desc.startsWith('plate')) {
    return 'Plates';
  }

  // 9. Bricks
  if (cat.includes('brick') || cat.includes('arch') || desc.startsWith('brick')) {
    return 'Bricks';
  }

  // 10. Special
  return 'Special';
}

/**
 * Baixa arquivo via HTTPS
 */
export async function downloadCompleteZip() {
  if (fs.existsSync(zipPath)) {
    const stats = fs.statSync(zipPath);
    if (stats.size > 100 * 1024 * 1024) {
      console.log(`[LDraw Sync] complete.zip já existente e verificado (${(stats.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
  }

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  console.log(`[LDraw Sync] Baixando biblioteca oficial LDraw de ${LDRAW_ZIP_URL} ...`);
  const tempPath = zipPath + '.tmp';
  const file = fs.createWriteStream(tempPath);

  await new Promise((resolve, reject) => {
    https.get(LDRAW_ZIP_URL, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Falha no download, HTTP ${res.statusCode}`));
        return;
      }

      const total = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0;
      let lastLog = Date.now();
      const startTime = Date.now();

      res.on('data', (chunk) => {
        downloaded += chunk.length;
        file.write(chunk);
        if (Date.now() - lastLog > 3000) {
          const pct = total ? ((downloaded / total) * 100).toFixed(1) : '?';
          const speed = (downloaded / ((Date.now() - startTime) / 1000) / 1024 / 1024).toFixed(1);
          console.log(`[LDraw Sync] Baixados ${(downloaded / 1024 / 1024).toFixed(1)} MB (${pct}%) @ ${speed} MB/s`);
          lastLog = Date.now();
        }
      });

      res.on('end', () => {
        file.end();
        console.log(`[LDraw Sync] Download concluído em ${((Date.now() - startTime) / 1000).toFixed(1)}s (${(downloaded / 1024 / 1024).toFixed(1)} MB).`);
        fs.renameSync(tempPath, zipPath);
        resolve();
      });

      res.on('error', (err) => {
        file.close();
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      reject(err);
    });
  });
}

/**
 * Extrai primitivas, cores e peças do catálogo com resolução recursiva de dependências
 */
export async function extractAndIndexLibrary() {
  console.log('[LDraw Sync] Processando arquivo ZIP e extraindo dependências...');
  const zip = new AdmZip(zipPath);

  fs.mkdirSync(publicLDrawDir, { recursive: true });
  fs.mkdirSync(path.join(publicLDrawDir, 'p'), { recursive: true });
  fs.mkdirSync(path.join(publicLDrawDir, 'parts'), { recursive: true });
  fs.mkdirSync(path.join(publicLDrawDir, 'parts', 's'), { recursive: true });

  const entries = zip.getEntries();
  const entryMap = new Map();
  for (const entry of entries) {
    entryMap.set(entry.entryName.toLowerCase(), entry);
  }

  // 1. Extrair LDConfig.ldr
  const ldconfigEntry = entryMap.get('ldraw/ldconfig.ldr');
  if (ldconfigEntry) {
    fs.writeFileSync(path.join(publicLDrawDir, 'LDConfig.ldr'), ldconfigEntry.getData());
    // Copiar também para public/LDConfig.ldr para compatibilidade legada
    fs.writeFileSync(path.join(rootDir, 'public', 'LDConfig.ldr'), ldconfigEntry.getData());
    console.log('[LDraw Sync] LDConfig.ldr extraído.');
  }

  // 2. Extrair todas as primitivas (/p)
  console.log('[LDraw Sync] Extraindo primitivas LDraw (/p)...');
  let primitivesCount = 0;
  for (const entry of entries) {
    if (entry.entryName.startsWith('ldraw/p/')) {
      const relPath = entry.entryName.replace(/^ldraw\//, '');
      const dest = path.join(publicLDrawDir, relPath);
      if (entry.isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
      } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, entry.getData());
        primitivesCount++;
      }
    }
  }
  console.log(`[LDraw Sync] ${primitivesCount} primitivas extraídas em public/ldraw/p/.`);

  // 3. Gerar arquivo de índice oficial parts.lst a partir do complete.zip
  console.log('[LDraw Sync] Gerando arquivo de índice oficial parts.lst...');
  const partsListLines = [];
  let totalIndexedParts = 0;

  for (const entry of entries) {
    const normName = entry.entryName.toLowerCase();
    // Apenas peças oficiais da pasta /parts/ (excluir subpeças /parts/s/ que não são peças finais de catálogo)
    if (
      normName.startsWith('ldraw/parts/') &&
      normName.endsWith('.dat') &&
      !normName.startsWith('ldraw/parts/s/') &&
      !entry.isDirectory
    ) {
      const filename = entry.entryName.substring('ldraw/parts/'.length);
      const data = entry.getData();
      const firstNewline = data.indexOf(10);
      const line1 = (firstNewline !== -1 ? data.subarray(0, firstNewline) : data)
        .toString('utf8')
        .trim();
      const desc = line1.replace(/^0\s+/, '').trim();
      if (desc) {
        partsListLines.push(`${filename}\t${desc}`);
        totalIndexedParts++;
      }
    }
  }

  partsListLines.sort((a, b) => a.localeCompare(b));
  const partsLstPath = path.join(publicLDrawDir, 'parts.lst');
  fs.writeFileSync(partsLstPath, partsListLines.join('\n'), 'utf8');
  console.log(
    `[LDraw Sync] parts.lst gerado com ${totalIndexedParts} peças oficiais (${(
      fs.statSync(partsLstPath).size / 1024 / 1024
    ).toFixed(2)} MB).`
  );

  // 4. Montar catálogo indexado das peças curadas + extrair dependências
  console.log('[LDraw Sync] Extraindo e indexando peças prioritárias...');
  const catalog = [];
  const extractedParts = new Set();

  function extractPartRecursive(filename) {
    const norm = filename.replace(/\\/g, '/').toLowerCase();
    if (extractedParts.has(norm)) return;
    extractedParts.add(norm);

    let zipEntry = entryMap.get(`ldraw/parts/${norm}`);
    if (!zipEntry && !norm.startsWith('s/')) {
      zipEntry = entryMap.get(`ldraw/parts/s/${norm}`);
    }
    if (!zipEntry) {
      zipEntry = entryMap.get(`ldraw/p/${norm}`);
    }

    if (!zipEntry) return;

    // Salvar no destino correto
    let dest;
    if (norm.startsWith('s/')) {
      dest = path.join(publicLDrawDir, 'parts', norm);
    } else {
      dest = path.join(publicLDrawDir, 'parts', norm);
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const data = zipEntry.getData();
    fs.writeFileSync(dest, data);

    // Parsear sub-arquivos referenciados (Linha tipo 1)
    const text = data.toString('utf8');
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('1 ')) {
        const parts = trimmed.split(/\s+/);
        const subfile = parts[parts.length - 1];
        if (subfile && subfile.endsWith('.dat')) {
          extractPartRecursive(subfile);
        }
      }
    }
  }

  for (const item of CURATED_PARTS_LIST) {
    const filename = `${item.id}.dat`;
    let zipEntry = entryMap.get(`ldraw/parts/${filename.toLowerCase()}`);
    let description = item.name;
    let category = item.category;

    if (zipEntry) {
      extractPartRecursive(filename);
      const text = zipEntry.getData().toString('utf8');
      const lines = text.split(/\r?\n/);
      const firstLineDesc = lines[0]?.replace(/^0\s+/, '').trim();
      if (firstLineDesc && !firstLineDesc.startsWith('~') && !firstLineDesc.startsWith('_')) {
        description = firstLineDesc;
      }
      for (const line of lines.slice(0, 20)) {
        const match = line.match(/^0\s+!CATEGORY\s+(.+)$/i);
        if (match) {
          category = normalizeCategory(match[1], description);
          break;
        }
      }
    }

    catalog.push({
      id: item.id,
      name: item.name,
      category: category,
      dimensions: {
        studsX: item.studsX,
        studsZ: item.studsZ,
        heightPlates: item.heightPlates,
      },
      lduSize: {
        x: item.studsX * 20,
        y: item.heightPlates * 8,
        z: item.studsZ * 20,
      },
      hasStuds: item.hasStuds,
      description: description,
      isFlexible: item.isFlexible || false,
    });
  }

  // 4. Salvar índice do catálogo em JSON para carregamento otimizado (Lazy Loading no Frontend)
  const catalogJsonPath = path.join(publicLDrawDir, 'parts-catalog.json');
  fs.writeFileSync(catalogJsonPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`[LDraw Sync] Catálogo salvo com ${catalog.length} peças em ${catalogJsonPath}.`);
  console.log(`[LDraw Sync] Total de arquivos de peças/subpartes extraídos: ${extractedParts.size}.`);
}

async function main() {
  await downloadCompleteZip();
  await extractAndIndexLibrary();
  console.log('[LDraw Sync] Biblioteca LDraw sincronizada e indexada com sucesso!');
}

main().catch((err) => {
  console.error('[LDraw Sync Error]', err);
  process.exit(1);
});

