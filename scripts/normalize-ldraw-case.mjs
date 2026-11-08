import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Normaliza a biblioteca LDraw publicada para letras minúsculas.
 *
 * O GitHub Pages roda em Linux (file system case-sensitive), enquanto o
 * desenvolvimento local no Windows/macOS é case-insensitive. Este script:
 *
 * - renomeia recursivamente todas as pastas e arquivos para lowercase;
 * - reescreve referências de subarquivos/TEXMAP dentro de .dat/.ldr/.mpd;
 * - normaliza o filemap.json e o parts.lst.
 *
 * É idempotente: pode rodar quantas vezes for necessário.
 */

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ldrawDir = path.join(rootDir, 'public', 'ldraw');
const checkOnly = process.argv.includes('--check');

const stats = {
  renamed: 0,
  merged: 0,
  conflicts: 0,
  rewritten: 0,
  fileMapEntries: 0,
};

let tempCounter = 0;

function listEntries(dir) {
  return fs.readdirSync(dir, { withFileTypes: true });
}

function renameCaseOnly(from, to) {
  if (from === to) return;

  const parentDir = path.dirname(from);
  const targetName = path.basename(to);
  const siblingNames = fs.readdirSync(parentDir);

  if (siblingNames.includes(targetName)) {
    const fromStat = fs.statSync(from);
    const toStat = fs.statSync(to);

    if (fromStat.isFile() && toStat.isFile()) {
      const sameContent = fs.readFileSync(from).equals(fs.readFileSync(to));
      if (sameContent) {
        if (!checkOnly) fs.unlinkSync(from);
        stats.merged += 1;
        return;
      }
    }

    stats.conflicts += 1;
    console.warn(
      `[LDraw Normalize] Conflito de case: "${from}" e "${to}" existem simultaneamente. ` +
        'O arquivo original foi mantido para evitar perda de dados.'
    );
    return;
  }

  if (checkOnly) {
    stats.renamed += 1;
    return;
  }

  // Rename em duas etapas para funcionar também em Windows, onde uma mudança
  // apenas de caixa pode ser interpretada como "mesmo caminho".
  const tempName = `.ldraw-case-tmp-${process.pid}-${tempCounter++}`;
  const tempPath = path.join(parentDir, tempName);
  fs.renameSync(from, tempPath);
  fs.renameSync(tempPath, to);
  stats.renamed += 1;
}

function normalizeTree(dir) {
  for (const entry of listEntries(dir)) {
    const currentPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      normalizeTree(currentPath);
    }

    const lowerName = entry.name.toLowerCase();
    if (lowerName !== entry.name) {
      renameCaseOnly(currentPath, path.join(dir, lowerName));
    }
  }
}

function lowerLastToken(line) {
  const trimmedEnd = line.trimEnd();
  const lastSpace = trimmedEnd.lastIndexOf(' ');
  if (lastSpace < 0) return line;

  const token = trimmedEnd.slice(lastSpace + 1);
  if (!/[A-Z]/.test(token)) return line;

  return `${trimmedEnd.slice(0, lastSpace + 1)}${token.toLowerCase()}${line.slice(trimmedEnd.length)}`;
}

function normalizeReferencesInFile(filePath) {
  if (!/\.(dat|ldr|mpd)$/i.test(filePath)) return;

  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  let changed = false;

  const normalizedLines = lines.map((line) => {
    const trimmed = line.trimStart();

    if (/^1\s+/.test(trimmed)) {
      const next = lowerLastToken(line);
      if (next !== line) changed = true;
      return next;
    }

    if (/^0\s+!TEXMAP\s+START\b/i.test(trimmed) || /^0\s+FILE\s+/i.test(trimmed)) {
      const next = lowerLastToken(line);
      if (next !== line) changed = true;
      return next;
    }

    return line;
  });

  if (!changed) return;

  if (!checkOnly) {
    fs.writeFileSync(filePath, normalizedLines.join('\n'), 'utf8');
  }
  stats.rewritten += 1;
}

function normalizeFileContents(dir) {
  for (const entry of listEntries(dir)) {
    const currentPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      normalizeFileContents(currentPath);
    } else {
      normalizeReferencesInFile(currentPath);
    }
  }
}

function normalizeFileMap() {
  const fileMapPath = path.join(ldrawDir, 'filemap.json');
  if (!fs.existsSync(fileMapPath)) return;

  const raw = JSON.parse(fs.readFileSync(fileMapPath, 'utf8'));
  const normalized = Object.create(null);

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== 'string') continue;
    const lowerKey = key.replace(/\\/g, '/').toLowerCase();
    const lowerValue = value.replace(/\\/g, '/').toLowerCase();
    normalized[lowerKey] = lowerValue;
  }

  stats.fileMapEntries = Object.keys(normalized).length;

  if (!checkOnly) {
    fs.writeFileSync(fileMapPath, JSON.stringify(normalized), 'utf8');
  }
}

function normalizePartsLst() {
  const partsLstPath = path.join(ldrawDir, 'parts.lst');
  if (!fs.existsSync(partsLstPath)) return;

  const text = fs.readFileSync(partsLstPath, 'utf8');
  const lines = text.split(/\r?\n/);
  let changed = false;

  const normalizedLines = lines.map((line) => {
    if (!line || line.startsWith('#') || line.startsWith('0 ')) return line;

    const separatorIndex = line.search(/[\t\s]/);
    if (separatorIndex === -1) return line;

    const filename = line.slice(0, separatorIndex);
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename === filename) return line;

    changed = true;
    return `${lowerFilename}${line.slice(separatorIndex)}`;
  });

  if (changed && !checkOnly) {
    fs.writeFileSync(partsLstPath, normalizedLines.join('\n'), 'utf8');
  }
}

function main() {
  if (!fs.existsSync(ldrawDir)) {
    console.warn(`[LDraw Normalize] Pasta não encontrada: ${ldrawDir}. Nada a fazer.`);
    return;
  }

  console.log(`[LDraw Normalize] Normalizando ${ldrawDir} para lowercase...`);

  normalizeTree(ldrawDir);
  normalizeFileContents(ldrawDir);
  normalizeFileMap();
  normalizePartsLst();

  if (stats.conflicts > 0) {
    console.warn(`[LDraw Normalize] ${stats.conflicts} conflito(s) de case precisam de revisão manual.`);
  }

  console.log(
    `[LDraw Normalize] Concluído: ${stats.renamed} nome(s) renomeado(s), ` +
      `${stats.merged} duplicata(s) idêntica(s) removida(s), ` +
      `${stats.rewritten} arquivo(s) com referências normalizadas, ` +
      `${stats.fileMapEntries} entradas no filemap.` +
      (checkOnly ? ' (modo --check: nenhuma alteração gravada)' : '')
  );
}

main();
