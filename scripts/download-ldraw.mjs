import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { pipeline } from 'node:stream/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(rootDir, 'ldraw_cache');
const zipPath = path.join(cacheDir, 'complete.zip');
const tempPath = `${zipPath}.tmp`;
const sourceUrl = 'https://library.ldraw.org/library/updates/complete.zip';
const redirectStatuses = new Set([301, 302, 303, 307, 308]);

function isCompleteLDrawZip(filePath) {
  try {
    const zip = new AdmZip(filePath);
    return zip.getEntries().some((entry) => entry.entryName.toLowerCase() === 'ldraw/ldconfig.ldr');
  } catch {
    return false;
  }
}

function request(url, redirectsRemaining = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Blocchi build', Accept: 'application/zip, application/octet-stream' } }, (res) => {
      if (redirectStatuses.has(res.statusCode) && res.headers.location) {
        res.resume();
        if (redirectsRemaining <= 0) {
          reject(new Error('Excedido o limite de redirecionamentos ao baixar o LDraw.'));
          return;
        }
        request(new URL(res.headers.location, url), redirectsRemaining - 1).then(resolve, reject);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`Download do LDraw retornou HTTP ${res.statusCode ?? 'desconhecido'}.`));
        return;
      }

      resolve(res);
    });

    req.setTimeout(60_000, () => req.destroy(new Error('Timeout no download do LDraw.')));
    req.on('error', reject);
  });
}

async function downloadOnce() {
  const response = await request(sourceUrl);
  await pipeline(response, fs.createWriteStream(tempPath));

  const contentLength = Number(response.headers['content-length']);
  const actualSize = fs.statSync(tempPath).size;
  if (contentLength && actualSize !== contentLength) {
    throw new Error(`Download incompleto: esperado ${contentLength} bytes, recebido ${actualSize}.`);
  }
  if (!isCompleteLDrawZip(tempPath)) {
    throw new Error('O conteúdo baixado não é um ZIP LDraw válido ou está incompleto.');
  }

  fs.renameSync(tempPath, zipPath);
}

async function main() {
  fs.mkdirSync(cacheDir, { recursive: true });

  if (isCompleteLDrawZip(zipPath)) {
    console.log('[LDraw Download] Cache existente validado; download ignorado.');
    return;
  }

  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[LDraw Download] Baixando biblioteca oficial (tentativa ${attempt}/3)...`);
      await downloadOnce();
      console.log(`[LDraw Download] ZIP íntegro validado (${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    } catch (error) {
      lastError = error;
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.warn(`[LDraw Download] Tentativa ${attempt} falhou: ${error.message}`);
      if (attempt < 3) await delay(1_000 * attempt);
    }
  }

  throw lastError ?? new Error('Não foi possível baixar a biblioteca LDraw.');
}

main().catch((error) => {
  console.error('[LDraw Download Error]', error);
  process.exitCode = 1;
});
