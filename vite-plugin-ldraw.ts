import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

export function ldrawVitePlugin(): Plugin {
  let zipInstance: AdmZip | null = null;
  let entryMap: Map<string, any> | null = null;
  let fileMapCache: Record<string, string> | null = null;

  function getZip() {
    if (zipInstance && entryMap) return { zip: zipInstance, entryMap };
    const zipPath = path.resolve('ldraw_cache/complete.zip');
    if (!fs.existsSync(zipPath)) return null;

    try {
      zipInstance = new AdmZip(zipPath);
      entryMap = new Map();
      for (const entry of zipInstance.getEntries()) {
        entryMap.set(entry.entryName.toLowerCase().replace(/\\/g, '/'), entry);
      }
      return { zip: zipInstance, entryMap };
    } catch (e) {
      console.warn('[Vite LDraw Plugin] Erro ao carregar complete.zip:', e);
      return null;
    }
  }

  function basePriority(lowerRel: string): number {
    // Prioridade oficial: parts/ > p/48 > p > p/8.
    if (/^parts\/[^/]+\.dat$/.test(lowerRel)) return 100;
    if (lowerRel.startsWith('parts/textures/')) return 95;
    if (lowerRel.startsWith('parts/') && !lowerRel.startsWith('parts/s/')) return 85;
    if (lowerRel.startsWith('p/48/')) return 80;
    if (lowerRel.startsWith('parts/48/')) return 70;
    if (/^p\/[^/]+\.dat$/.test(lowerRel)) return 60;
    if (lowerRel.startsWith('p/') && !lowerRel.startsWith('p/8/')) return 55;
    if (lowerRel.startsWith('parts/s/')) return 30;
    if (lowerRel.startsWith('p/8/')) return 20;
    return 10;
  }

  function ensureFileMap(): Record<string, string> | null {
    if (fileMapCache) return fileMapCache;

    const fileMapPath = path.resolve('public/ldraw/filemap.json');
    if (fs.existsSync(fileMapPath)) {
      try {
        fileMapCache = JSON.parse(fs.readFileSync(fileMapPath, 'utf8'));
        return fileMapCache;
      } catch {}
    }

    const zipData = getZip();
    if (!zipData) return null;

    console.log('[Vite LDraw Plugin] Indexando mapa completo de arquivos LDraw sob demanda...');
    const map: Record<string, string> = {};
    const priorities = new Map<string, number>();

    for (const [entryKey, entry] of zipData.entryMap.entries()) {
      if (entry.isDirectory) continue;
      if (!entryKey.startsWith('ldraw/')) continue;

      const relPath = entry.entryName.replace(/\\/g, '/').substring('ldraw/'.length);
      const lowerRel = relPath.toLowerCase();
      const base = path.basename(lowerRel);

      // Mapeamento direto do caminho relativo oficial (ex: parts/3001.dat, p/48/1-4cyli.dat)
      map[lowerRel] = relPath;

      // Mapeamento por nome base, respeitando a prioridade de qualidade.
      const priority = basePriority(lowerRel);
      if (!(base in map) || priority > (priorities.get(base) ?? -1)) {
        map[base] = relPath;
        priorities.set(base, priority);
      }

      // Aliases de subdiretórios usados nas referências LDraw.
      if (lowerRel.startsWith('p/48/')) {
        map[`48/${base}`] = relPath;
      } else if (lowerRel.startsWith('p/8/')) {
        map[`8/${base}`] = relPath;
      } else if (lowerRel.startsWith('parts/s/')) {
        map[`s/${base}`] = relPath;
      } else if (lowerRel.startsWith('parts/textures/')) {
        map[`textures/${base}`] = relPath;
      }
    }

    try {
      fs.mkdirSync(path.dirname(fileMapPath), { recursive: true });
      fs.writeFileSync(fileMapPath, JSON.stringify(map), 'utf8');
      console.log(`[Vite LDraw Plugin] filemap.json gerado com ${Object.keys(map).length} mapeamentos.`);
    } catch (e) {
      console.warn('[Vite LDraw Plugin] Falha ao persistir filemap.json:', e);
    }

    fileMapCache = map;
    return map;
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
        const filename = entry.entryName.replace(/\\/g, '/').substring('ldraw/parts/'.length);
        const data = entry.getData();
        const firstNewline = data.indexOf(10);
        const line1 = (firstNewline !== -1 ? data.subarray(0, firstNewline) : data)
          .toString('utf8')
          .trim();
        const desc = line1.replace(/^0\s+/, '').trim();
        if (
          desc &&
          !desc.startsWith('~') &&
          !desc.startsWith('_Moved') &&
          !desc.toLowerCase().includes('other compatible')
        ) {
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
      const configuredBase = server.config.base || '/';
      const normalizedBase =
        configuredBase === './' || configuredBase === '.'
          ? '/'
          : configuredBase.endsWith('/')
          ? configuredBase
          : `${configuredBase}/`;
      const ldrawBase = `${normalizedBase}ldraw/`;

      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ? req.url.split('?')[0] : '';
        const url = decodeURIComponent(rawUrl).replace(/\\/g, '/');

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

        // 2. Mapa oficial de caminhos de arquivos LDraw (evita trial-and-error e fallbacks)
        if (url.endsWith('/ldraw/filemap.json') || url === '/api/ldraw/filemap') {
          const fileMap = ensureFileMap();
          if (fileMap) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.end(JSON.stringify(fileMap));
            return;
          }
        }

        // 3. Interceptar parts.lst sob demanda
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

        // 4. Interceptar LDConfig.ldr
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

        // 5. Interceptar qualquer recurso LDraw sob demanda (/ldraw/...).
        // Importante: apenas a raiz da biblioteca — nunca módulos do app como
        // /src/ldraw/*.ts, que devem ser transformados pelo próprio Vite.
        const isLibraryAsset = url.startsWith(ldrawBase) || url.startsWith('/ldraw/');
        if (isLibraryAsset) {
          let reqPath = (
            url.startsWith(ldrawBase)
              ? url.slice(ldrawBase.length)
              : url.slice('/ldraw/'.length)
          ).trim();

          // Limpar prefixos duplicados acidentais
          reqPath = reqPath.replace(/^parts\/parts\//i, 'parts/');
          reqPath = reqPath.replace(/^p\/p\//i, 'p/');

          const lowerReqPath = reqPath.toLowerCase();
          const baseName = path.basename(lowerReqPath);
          const isPng = lowerReqPath.endsWith('.png');

          // A. Verificar se já existe exatamente no disco
          const exactDiskPath = path.resolve(`public/ldraw/${reqPath}`);
          if (fs.existsSync(exactDiskPath) && !fs.statSync(exactDiskPath).isDirectory()) {
            return next();
          }

          // B. Verificar se existe no disco em subdiretórios conhecidos
          const diskCandidates = [
            path.resolve(`public/ldraw/${reqPath}`),
            path.resolve(`public/ldraw/p/${baseName}`),
            path.resolve(`public/ldraw/p/48/${baseName}`),
            path.resolve(`public/ldraw/p/8/${baseName}`),
            path.resolve(`public/ldraw/parts/${baseName}`),
            path.resolve(`public/ldraw/parts/s/${baseName}`),
            path.resolve(`public/ldraw/parts/textures/${baseName}`),
            path.resolve(`public/ldraw/textures/${baseName}`),
            path.resolve(`public/ldraw/models/${baseName}`),
          ];

          for (const cand of diskCandidates) {
            if (fs.existsSync(cand) && !fs.statSync(cand).isDirectory()) {
              if (isPng) {
                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Cache-Control', 'public, max-age=31536000');
                res.end(fs.readFileSync(cand));
              } else {
                const content = fs.readFileSync(cand, 'utf8');
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Cache-Control', 'public, max-age=31536000');
                res.end(content);
              }
              return;
            }
          }

          // C. Buscar dentro do complete.zip
          const zipData = getZip();
          if (zipData) {
            const fileMap = ensureFileMap();
            let foundEntry: any = null;

            // 1) Tentativa via fileMap oficial
            if (fileMap) {
              const mapped = fileMap[lowerReqPath] || fileMap[baseName];
              if (mapped) {
                const zipKey = `ldraw/${mapped}`.toLowerCase();
                if (zipData.entryMap.has(zipKey)) {
                  foundEntry = zipData.entryMap.get(zipKey);
                }
              }
            }

            // 2) Tentativas heurísticas por candidatos padrão LDraw
            if (!foundEntry) {
              const candidates = [
                `ldraw/${lowerReqPath}`,
                `ldraw/parts/${lowerReqPath}`,
                `ldraw/parts/s/${lowerReqPath.replace(/^s\//, '')}`,
                `ldraw/parts/textures/${lowerReqPath.replace(/^textures\//, '')}`,
                `ldraw/p/${lowerReqPath}`,
                `ldraw/p/48/${lowerReqPath.replace(/^48\//, '')}`,
                `ldraw/p/8/${lowerReqPath.replace(/^8\//, '')}`,
                `ldraw/models/${lowerReqPath}`,
                `ldraw/${baseName}`,
                `ldraw/parts/${baseName}`,
                `ldraw/parts/s/${baseName}`,
                `ldraw/parts/textures/${baseName}`,
                `ldraw/p/${baseName}`,
                `ldraw/p/48/${baseName}`,
                `ldraw/p/8/${baseName}`,
              ];

              for (const cand of candidates) {
                if (zipData.entryMap.has(cand)) {
                  foundEntry = zipData.entryMap.get(cand);
                  break;
                }
              }
            }

            if (foundEntry) {
              const data = foundEntry.getData();

              // Salva em cache no disco para aceleração instantânea de próximas chamadas
              try {
                fs.mkdirSync(path.dirname(exactDiskPath), { recursive: true });
                fs.writeFileSync(exactDiskPath, data);
              } catch {}

              if (isPng) {
                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Cache-Control', 'public, max-age=31536000');
                res.end(data);
              } else {
                const text = data.toString('utf8');
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Cache-Control', 'public, max-age=31536000');
                res.end(text);
              }
              return;
            }
          }

          // Recurso LDraw explicitamente ausente: nunca cair no fallback HTML do SPA,
          // que faria o parser interpretar uma página inteira como geometria.
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(`LDraw asset not found: ${reqPath}`);
          return;
        }

        next();
    });
    },
  };
}
