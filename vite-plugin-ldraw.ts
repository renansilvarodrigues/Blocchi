import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

export function ldrawVitePlugin(): Plugin {
  let zipInstance: AdmZip | null = null;
  let entryMap: Map<string, any> | null = null;

  function getZip() {
    if (zipInstance && entryMap) return { zip: zipInstance, entryMap };
    const zipPath = path.resolve('ldraw_cache/complete.zip');
    if (!fs.existsSync(zipPath)) return null;

    try {
      zipInstance = new AdmZip(zipPath);
      entryMap = new Map();
      for (const entry of zipInstance.getEntries()) {
        entryMap.set(entry.entryName.toLowerCase(), entry);
      }
      return { zip: zipInstance, entryMap };
    } catch (e) {
      console.warn('[Vite LDraw Plugin] Erro ao carregar complete.zip:', e);
      return null;
    }
  }

  return {
    name: 'vite-plugin-ldraw',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // Interceptar requisições /api/ldraw/status
        if (url === '/api/ldraw/status') {
          const zipPath = path.resolve('ldraw_cache/complete.zip');
          const exists = fs.existsSync(zipPath);
          const catalogPath = path.resolve('public/ldraw/parts-catalog.json');
          const hasCatalog = fs.existsSync(catalogPath);

          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              downloaded: exists,
              indexed: hasCatalog,
              catalogCount: hasCatalog
                ? JSON.parse(fs.readFileSync(catalogPath, 'utf8')).length
                : 0,
            })
          );
          return;
        }

        // Interceptar arquivos LDraw sob demanda (/ldraw/parts/... ou /ldraw/p/...)
        const ldrawMatch = url.match(/\/ldraw\/(parts|p)\/(.+)$/i);
        if (ldrawMatch) {
          const subDir = ldrawMatch[1].toLowerCase();
          const partPath = decodeURIComponent(ldrawMatch[2]).replace(/\\/g, '/');
          const localPath = path.resolve(`public/ldraw/${subDir}/${partPath}`);

          // Se já existe no disco, deixa o Vite servir
          if (fs.existsSync(localPath)) {
            return next();
          }

          const zipData = getZip();
          if (zipData) {
            const candidates = [
              `ldraw/${subDir}/${partPath}`.toLowerCase(),
              `ldraw/parts/s/${partPath}`.toLowerCase(),
              `ldraw/p/${partPath}`.toLowerCase(),
              `ldraw/parts/${partPath}`.toLowerCase(),
            ];

            let foundEntry = null;
            for (const cand of candidates) {
              if (zipData.entryMap.has(cand)) {
                foundEntry = zipData.entryMap.get(cand);
                break;
              }
            }

            if (foundEntry) {
              const data = foundEntry.getData();
              // Cacheia no disco para próximas requisições
              try {
                fs.mkdirSync(path.dirname(localPath), { recursive: true });
                fs.writeFileSync(localPath, data);
              } catch {}

              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.setHeader('Cache-Control', 'public, max-age=31536000');
              res.end(data);
              return;
            }
          }
        }

        next();
      });
    },
  };
}
