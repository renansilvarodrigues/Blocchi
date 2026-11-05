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

  function ensurePartsLst(): string | null {
    const partsLstPath = path.resolve('public/ldraw/parts.lst');
    if (fs.existsSync(partsLstPath)) {
      return fs.readFileSync(partsLstPath, 'utf8');
    }

    const zipData = getZip();
    if (!zipData) return null;

    console.log('[Vite LDraw Plugin] Gerando parts.lst sob demanda a partir do complete.zip...');
    const lines: string[] = [];
    for (const [name, entry] of zipData.entryMap.entries()) {
      if (
        name.startsWith('ldraw/parts/') &&
        name.endsWith('.dat') &&
        !name.startsWith('ldraw/parts/s/') &&
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
          lines.push(`${filename}\t${desc}`);
        }
      }
    }

    lines.sort((a, b) => a.localeCompare(b));
    const content = lines.join('\n');
    try {
      fs.mkdirSync(path.dirname(partsLstPath), { recursive: true });
      fs.writeFileSync(partsLstPath, content, 'utf8');
      console.log(`[Vite LDraw Plugin] parts.lst gerado com ${lines.length} peças.`);
    } catch (err) {
      console.warn('[Vite LDraw Plugin] Falha ao salvar parts.lst no disco:', err);
    }
    return content;
  }

  return {
    name: 'vite-plugin-ldraw',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // 1. Status da biblioteca LDraw
        if (url === '/api/ldraw/status') {
          const zipPath = path.resolve('ldraw_cache/complete.zip');
          const exists = fs.existsSync(zipPath);
          const partsLstPath = path.resolve('public/ldraw/parts.lst');
          const hasPartsLst = fs.existsSync(partsLstPath);
          const catalogPath = path.resolve('public/ldraw/parts-catalog.json');
          const hasCatalog = fs.existsSync(catalogPath);

          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              downloaded: exists,
              indexed: hasPartsLst || hasCatalog,
              hasPartsLst,
              partsCount: hasPartsLst
                ? fs.readFileSync(partsLstPath, 'utf8').split('\n').filter(Boolean).length
                : hasCatalog
                ? JSON.parse(fs.readFileSync(catalogPath, 'utf8')).length
                : 0,
            })
          );
          return;
        }

        // 2. Interceptar parts.lst sob demanda
        if (url.endsWith('/ldraw/parts.lst')) {
          const localPath = path.resolve('public/ldraw/parts.lst');
          if (fs.existsSync(localPath)) {
            return next();
          }

          const content = ensurePartsLst();
          if (content) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.end(content);
            return;
          }
        }

        // 3. Interceptar LDConfig.ldr
        if (url.endsWith('/ldraw/LDConfig.ldr') || url.endsWith('/LDConfig.ldr')) {
          const localPath = path.resolve('public/ldraw/LDConfig.ldr');
          if (fs.existsSync(localPath)) {
            return next();
          }

          const zipData = getZip();
          if (zipData && zipData.entryMap.has('ldraw/ldconfig.ldr')) {
            const data = zipData.entryMap.get('ldraw/ldconfig.ldr').getData();
            try {
              fs.mkdirSync(path.dirname(localPath), { recursive: true });
              fs.writeFileSync(localPath, data);
            } catch {}
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(data);
            return;
          }
        }

        // 4. Interceptar arquivos LDraw sob demanda (/ldraw/parts/... ou /ldraw/p/... ou /ldraw/models/...)
        const ldrawMatch = url.match(/\/ldraw\/(parts|p|models)\/(.+)$/i);
        if (ldrawMatch) {
          const subDir = ldrawMatch[1].toLowerCase();
          let partPath = decodeURIComponent(ldrawMatch[2]).replace(/\\/g, '/');

          // Normalizar caminhos duplicados (ex: parts/parts/s/3001.dat -> parts/s/3001.dat)
          if (subDir === 'parts' && partPath.toLowerCase().startsWith('parts/')) {
            partPath = partPath.substring('parts/'.length);
          } else if (subDir === 'p' && partPath.toLowerCase().startsWith('p/')) {
            partPath = partPath.substring('p/'.length);
          }

          const localPath = path.resolve(`public/ldraw/${subDir}/${partPath}`);

          // Se já existe no disco, deixa o Vite servir
          if (fs.existsSync(localPath)) {
            return next();
          }

          // Se for uma primitiva (ex: stud.dat) solicitada sob parts/, verificar se já existe em p/
          const altLocalPath = path.resolve(`public/ldraw/p/${partPath}`);
          if (subDir === 'parts' && fs.existsSync(altLocalPath)) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.end(fs.readFileSync(altLocalPath));
            return;
          }

          const zipData = getZip();
          if (zipData) {
            const normPath = partPath.toLowerCase();
            const candidates = [
              `ldraw/${subDir}/${normPath}`,
              `ldraw/parts/${normPath}`,
              `ldraw/parts/s/${normPath}`,
              `ldraw/p/${normPath}`,
              `ldraw/p/48/${normPath}`,
              `ldraw/p/8/${normPath}`,
              `ldraw/models/${normPath}`,
              `ldraw/${normPath}`,
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
              // Cacheia no disco para próximas requisições instantâneas
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
