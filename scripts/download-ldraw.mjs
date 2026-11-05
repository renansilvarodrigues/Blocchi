import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const cacheDir = path.join(rootDir, 'ldraw_cache');
const zipPath = path.join(cacheDir, 'complete.zip');

const LDRAW_ZIP_URL = 'https://library.ldraw.org/library/updates/complete.zip';

async function downloadFile(url, targetPath) {
  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);
    if (stats.size > 100 * 1024 * 1024) {
      console.log(`[LDraw Sync] complete.zip already downloaded (${(stats.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
  }

  if (!fs.existsSync(path.dirname(targetPath))) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  }

  console.log(`[LDraw Sync] Downloading LDraw complete library from ${url} ...`);
  const tempPath = targetPath + '.tmp';
  const file = fs.createWriteStream(tempPath);

  await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed with HTTP ${res.statusCode}`));
        return;
      }

      const total = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0;
      let lastLog = Date.now();
      const startTime = Date.now();

      res.on('data', (chunk) => {
        downloaded += chunk.length;
        file.write(chunk);
        if (Date.now() - lastLog > 2500) {
          const pct = total ? ((downloaded / total) * 100).toFixed(1) : '?';
          const speed = (downloaded / ((Date.now() - startTime) / 1000) / 1024 / 1024).toFixed(1);
          console.log(`[LDraw Sync] Downloaded ${(downloaded / 1024 / 1024).toFixed(1)} MB (${pct}%) @ ${speed} MB/s`);
          lastLog = Date.now();
        }
      });

      res.on('end', () => {
        file.end();
        console.log(`[LDraw Sync] Download completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s (${(downloaded / 1024 / 1024).toFixed(1)} MB).`);
        fs.renameSync(tempPath, targetPath);
        resolve();
      });

      res.on('error', (err) => {
        file.close();
        fs.unlinkSync(tempPath);
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      reject(err);
    });
  });
}

async function main() {
  await downloadFile(LDRAW_ZIP_URL, zipPath);
}

main().catch((err) => {
  console.error('[LDraw Sync Error]', err);
  process.exit(1);
});
