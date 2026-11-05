import * as THREE from 'three';
import type { PlacedBrick } from '../types/lego';
import { getPartDefinition } from './partsCatalogService';
import { LDU_SCALE } from './proceduralBricks';

/**
 * Gera o arquivo LDraw oficial (.ldr) a partir das peças posicionadas na mesa
 */
export function exportModelToLDraw(bricks: PlacedBrick[], modelName: string = 'Blocchi_Model'): string {
  const header = [
    `0 ${modelName}`,
    `0 Name: ${modelName.toLowerCase()}.ldr`,
    `0 Author: Blocchi Lego Studio`,
    `0 !LDRAW_ORG Model`,
    `0 BFC CERTIFY CCW`,
    '',
  ];

  const body = bricks.map((brick) => {
    const partDef = getPartDefinition(brick.partId);
    const fileName = partDef ? `${partDef.id}.dat` : `${brick.partId}.dat`;

    // No padrão LDraw:
    // 1 LDU = 0.04 Three.js units, logo xThree / 0.04 = xThree * 25
    // Y do LDraw é invertido em relação ao Three.js
    const lduX = Math.round(brick.position[0] / LDU_SCALE);
    const lduY = Math.round(-brick.position[1] / LDU_SCALE);
    const lduZ = Math.round(brick.position[2] / LDU_SCALE);

    // Rotação em torno do eixo Y
    const angleY = brick.rotation[1];
    const cos = Math.round(Math.cos(angleY) * 1000) / 1000;
    const sin = Math.round(Math.sin(angleY) * 1000) / 1000;

    // Matriz de rotação 3x3 LDraw: [a, b, c, d, e, f, g, h, i]
    const mat = [cos, 0, sin, 0, 1, 0, -sin, 0, cos];

    return `1 ${brick.colorCode} ${lduX} ${lduY} ${lduZ} ${mat.join(' ')} ${fileName}`;
  });

  const footer = ['', '0'];

  return [...header, ...body, ...footer].join('\n');
}

/**
 * Importa e converte um arquivo de projeto LDraw (.ldr) em uma lista de peças PlacedBrick
 */
export function importModelFromLDraw(ldrContent: string): PlacedBrick[] {
  const lines = ldrContent.split(/\r?\n/);
  const bricks: PlacedBrick[] = [];
  let brickCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Linha tipo 1: 1 <colour> x y z a b c d e f g h i <file.dat>
    if (!trimmed.startsWith('1 ') && !trimmed.startsWith('1\t')) continue;

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 15) continue;

    const colorCode = parseInt(tokens[1], 10) || 16;
    const lduX = parseFloat(tokens[2]) || 0;
    const lduY = parseFloat(tokens[3]) || 0;
    const lduZ = parseFloat(tokens[4]) || 0;

    // Matriz 3x3
    const a = parseFloat(tokens[5]) || 1;
    const b = parseFloat(tokens[6]) || 0;
    const c = parseFloat(tokens[7]) || 0;
    const d = parseFloat(tokens[8]) || 0;
    const e = parseFloat(tokens[9]) || 1;
    const f = parseFloat(tokens[10]) || 0;
    const g = parseFloat(tokens[11]) || 0;
    const h = parseFloat(tokens[12]) || 0;
    const k = parseFloat(tokens[13]) || 1;

    // Arquivo da peça (pode conter espaços se for o último token)
    const fileToken = tokens.slice(14).join(' ').replace(/\\/g, '/');
    const cleanId = fileToken.replace(/\.dat$/i, '').replace(/^parts[/\\]/i, '').trim();

    // Posição no Three.js: LDraw Y invertido
    const posX = lduX * LDU_SCALE;
    const posY = -lduY * LDU_SCALE;
    const posZ = lduZ * LDU_SCALE;

    // Rotação: extrair ângulos Euler da matriz 3x3
    const matrix = new THREE.Matrix4().set(
      a, b, c, 0,
      d, e, f, 0,
      g, h, k, 0,
      0, 0, 0, 1
    );
    const euler = new THREE.Euler().setFromRotationMatrix(matrix, 'YXZ');

    brickCounter++;
    bricks.push({
      instanceId: `brick_imported_${Date.now()}_${brickCounter}`,
      partId: cleanId,
      name: `Part ${cleanId}`,
      colorCode: colorCode === 16 ? 4 : colorCode, // Fallback para Vermelho se for cor de referência 16
      position: [posX, posY, posZ],
      rotation: [euler.x, euler.y, euler.z],
    });
  }

  return bricks;
}

/**
 * Dispara o download de um arquivo LDraw no navegador
 */
export function downloadLDrawFile(content: string, filename: string = 'blocchi_model.ldr') {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
