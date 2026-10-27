import type { PlacedBrick } from '../types/lego';
import { LEGO_PARTS_CATALOG } from './partsData';

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
    const partDef = LEGO_PARTS_CATALOG.find((p) => p.id === brick.partId);
    const fileName = partDef ? `${partDef.id}.dat` : `${brick.partId}.dat`;

    // No padrão LDraw:
    // 1 LDU = 0.04 Three.js units, logo xThree / 0.04 = xThree * 25
    // Y do LDraw é invertido em relação ao Three.js
    const lduX = Math.round(brick.position[0] * 25);
    const lduY = Math.round(-brick.position[1] * 25);
    const lduZ = Math.round(brick.position[2] * 25);

    // Rotação em torno do eixo Y
    const angleY = brick.rotation[1];
    const cos = Math.round(Math.cos(angleY));
    const sin = Math.round(Math.sin(angleY));

    // Matriz de rotação 3x3 LDraw: [a, b, c, d, e, f, g, h, i]
    // Rotação padrão ao redor de Y
    const mat = [cos, 0, sin, 0, 1, 0, -sin, 0, cos];

    return `1 ${brick.colorCode} ${lduX} ${lduY} ${lduZ} ${mat.join(' ')} ${fileName}`;
  });

  const footer = ['', '0'];

  return [...header, ...body, ...footer].join('\n');
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
