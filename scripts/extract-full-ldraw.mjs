import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'node:url';

/**
 * Copia a biblioteca LDraw completa do complete.zip para dist/ldraw após o
 * build do Vite. Assim o catálogo de 20.000+ peças funciona em produção sem
 * inflar o repositório com centenas de MB em public/.
 *
 * Defina LDRAW_FULL_LIBRARY=0 para pular esta etapa em builds locais rápidos.
 */

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const zipPath = path.join(rootDir, 'ldraw_cache', 'complete.zip');
const publicDir = path.join(rootDir, 'public', 'ldraw');
const distDir = path.join(rootDir, 'dist', 'ldraw');

function fail(message) {
  console.error(`[LDraw Full] ERRO: ${message}`);
  process.exit(1);
}

if (process.env.LDRAW_FULL_LIBRARY === '0') {
  console.log('[LDraw Full] Etapa desativada por LDRAW_FULL_LIBRARY=0.');
  process.exit(0);
}

if (!fs.existsSync(distDir)) {
  fail('dist/ldraw não existe. Execute "vite build" antes desta etapa.');
}

if (!fs.existsSync(zipPath)) {
  fail(`Arquivo não encontrado: ${zipPath}`);
}

let zip;
try {
  zip = new AdmZip(zipPath);
} catch (error) {
  fail(`Não foi possível abrir "${zipPath}": ${error instanceof Error ? error.message : error}`);
}

const entries = zip.getEntries();
let written = 0;
let skipped = 0;
let bytes = 0;

console.log('[LDraw Full] Extraindo biblioteca completa para dist/ldraw...');

for (const entry of entries) {
  if (entry.isDirectory) continue;

  const lowerName = entry.entryName.replace(/\\/g, '/').toLowerCase();
  if (!lowerName.startsWith('ldraw/parts/') && !lowerName.startsWith('ldraw/p/')) continue;
  if (!/\.(dat|ldr|png|jpe?g)$/i.test(lowerName)) continue;

  const relPath = lowerName.slice('ldraw/'.length);
  const dest = path.join(distDir, relPath);

  // Preserva os arquivos curados já copiados pelo Vite (ex: p/stud.dat em alta resolução).
  if (fs.existsSync(dest)) {
    skipped += 1;
    continue;
  }

  const data = entry.getData();
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, data);
  written += 1;
  bytes += data.length;
}

for (const fileName of ['parts.lst', 'filemap.json']) {
  const distFile = path.join(distDir, fileName);
  if (fs.existsSync(distFile)) continue;

  const publicFile = path.join(publicDir, fileName);
  if (!fs.existsSync(publicFile)) {
    fail(`"${fileName}" ausente em dist/ldraw e public/ldraw.`);
  }
  fs.copyFileSync(publicFile, distFile);
}

const staleManifest = path.join(distDir, 'available-parts.json');
if (fs.existsSync(staleManifest)) {
  fs.rmSync(staleManifest);
}

const partsLstPath = path.join(distDir, 'parts.lst');
const fileMapPath = path.join(distDir, 'filemap.json');
const partsDir = path.join(distDir, 'parts');

if (!fs.existsSync(partsLstPath)) fail('parts.lst não foi encontrado em dist/ldraw.');
if (!fs.existsSync(fileMapPath)) fail('filemap.json não foi encontrado em dist/ldraw.');
if (!fs.existsSync(partsDir)) fail('dist/ldraw/parts não foi encontrado.');

const catalogCount = fs
  .readFileSync(partsLstPath, 'utf8')
  .split(/\r?\n/)
  .filter((line) => line.trim() && !line.startsWith('#')).length;

const fileMapCount = Object.keys(JSON.parse(fs.readFileSync(fileMapPath, 'utf8'))).length;

const publishedParts = fs
  .readdirSync(partsDir)
  .filter((name) => name.toLowerCase().endsWith('.dat')).length;

if (catalogCount < 20000) {
  fail(`parts.lst em dist/ldraw contém apenas ${catalogCount} peças (esperado 20.000+).`);
}

if (publishedParts < 20000) {
  fail(`dist/ldraw/parts contém apenas ${publishedParts} peças .dat (esperado 20.000+).`);
}

if (fileMapCount < 80000) {
  fail(`filemap.json em dist/ldraw contém apenas ${fileMapCount} entradas (esperado 80.000+).`);
}

console.log(
  `[LDraw Full] Concluído: ${written} arquivo(s) extraído(s), ` +
    `${skipped} preservado(s), ${(bytes / 1024 / 1024).toFixed(1)} MB adicionados. ` +
    `Catálogo: ${catalogCount} peças, ${publishedParts} .dat publicados, ` +
    `${fileMapCount} entradas no filemap.`
);
