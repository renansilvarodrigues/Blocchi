import type { LegoPartDefinition } from '../types/lego';

export const LEGO_PARTS_CATALOG: LegoPartDefinition[] = [
  {
    id: '3001',
    name: 'Brick 2 x 4',
    category: 'Bricks',
    dimensions: { studsX: 2, studsZ: 4, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 80 },
    hasStuds: true,
    description: 'O clássico e icônico tijolo Lego 2x4. A peça fundamental de montagem.',
  },
  {
    id: '3003',
    name: 'Brick 2 x 2',
    category: 'Bricks',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 40 },
    hasStuds: true,
    description: 'Tijolo quadrado padrão 2x2 com 4 pinos.',
  },
  {
    id: '3004',
    name: 'Brick 1 x 2',
    category: 'Bricks',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 40 },
    hasStuds: true,
    description: 'Tijolo estreito 1x2, ideal para paredes e construções detalhadas.',
  },
  {
    id: '3005',
    name: 'Brick 1 x 1',
    category: 'Bricks',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 20 },
    hasStuds: true,
    description: 'Tijolo unitário 1x1.',
  },
  {
    id: '3010',
    name: 'Brick 1 x 4',
    category: 'Bricks',
    dimensions: { studsX: 1, studsZ: 4, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 80 },
    hasStuds: true,
    description: 'Tijolo linear 1x4.',
  },
  {
    id: '3009',
    name: 'Brick 1 x 6',
    category: 'Bricks',
    dimensions: { studsX: 1, studsZ: 6, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 120 },
    hasStuds: true,
    description: 'Tijolo linear longo 1x6.',
  },
  {
    id: '3020',
    name: 'Plate 2 x 4',
    category: 'Plates',
    dimensions: { studsX: 2, studsZ: 4, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 80 },
    hasStuds: true,
    description: 'Placa fina 2x4 (1/3 da altura do bloco padrão).',
  },
  {
    id: '3022',
    name: 'Plate 2 x 2',
    category: 'Plates',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 40 },
    hasStuds: true,
    description: 'Placa fina quadrada 2x2.',
  },
  {
    id: '3023',
    name: 'Plate 1 x 2',
    category: 'Plates',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 40 },
    hasStuds: true,
    description: 'Placa fina 1x2.',
  },
  {
    id: '3068b',
    name: 'Tile 2 x 2',
    category: 'Tiles',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 40 },
    hasStuds: false,
    description: 'Ladrilho liso 2x2 sem pinos no topo para acabamentos suaves.',
  },
  {
    id: '3867',
    name: 'Baseplate 16 x 16',
    category: 'Baseplates',
    dimensions: { studsX: 16, studsZ: 16, heightPlates: 0.5 },
    lduSize: { x: 320, y: 4, z: 320 },
    hasStuds: true,
    description: 'Placa base ampla 16x16 para ancoragem da construção.',
  },
];

/**
 * Gera código LDraw completo (formato MPD autocontido) para qualquer peça definida
 */
export function generateLDrawSource(part: LegoPartDefinition, colorCode: number = 16): string {
  const { studsX, studsZ, heightPlates } = part.dimensions;
  const width = studsX * 20; // X
  const height = heightPlates * 8; // Y (height in LDU)
  const length = studsZ * 20; // Z

  const hx = width / 2;
  const hz = length / 2;
  const topY = -height;
  const botY = 0;

  const lines: string[] = [
    `0 FILE ${part.id}.dat`,
    `0 ${part.name}`,
    `0 Name: ${part.id}.dat`,
    `0 Author: Blocchi LDraw Generator`,
    `0 !LDRAW_ORG Part`,
    `0 BFC CERTIFY CCW`,
    '',
  ];

  // Faces externas da caixa principal
  // Top Face (se não for tile, os studs ficam sobre ela)
  lines.push(`4 16 ${-hx} ${topY} ${-hz} ${hx} ${topY} ${-hz} ${hx} ${topY} ${hz} ${-hx} ${topY} ${hz}`);
  // Front Face (+Z)
  lines.push(`4 16 ${-hx} ${botY} ${hz} ${hx} ${botY} ${hz} ${hx} ${topY} ${hz} ${-hx} ${topY} ${hz}`);
  // Back Face (-Z)
  lines.push(`4 16 ${hx} ${botY} ${-hz} ${-hx} ${botY} ${-hz} ${-hx} ${topY} ${-hz} ${hx} ${topY} ${-hz}`);
  // Left Face (-X)
  lines.push(`4 16 ${-hx} ${botY} ${-hz} ${-hx} ${botY} ${hz} ${-hx} ${topY} ${hz} ${-hx} ${topY} ${-hz}`);
  // Right Face (+X)
  lines.push(`4 16 ${hx} ${botY} ${hz} ${hx} ${botY} ${-hz} ${hx} ${topY} ${-hz} ${hx} ${topY} ${hz}`);

  // Linhas de aresta externas de contraste (cor 24 no padrão LDraw)
  lines.push(`2 24 ${-hx} ${topY} ${-hz} ${hx} ${topY} ${-hz}`);
  lines.push(`2 24 ${hx} ${topY} ${-hz} ${hx} ${topY} ${hz}`);
  lines.push(`2 24 ${hx} ${topY} ${hz} ${-hx} ${topY} ${hz}`);
  lines.push(`2 24 ${-hx} ${topY} ${hz} ${-hx} ${topY} ${-hz}`);

  lines.push(`2 24 ${-hx} ${botY} ${-hz} ${hx} ${botY} ${-hz}`);
  lines.push(`2 24 ${hx} ${botY} ${-hz} ${hx} ${botY} ${hz}`);
  lines.push(`2 24 ${hx} ${botY} ${hz} ${-hx} ${botY} ${hz}`);
  lines.push(`2 24 ${-hx} ${botY} ${hz} ${-hx} ${botY} ${-hz}`);

  lines.push(`2 24 ${-hx} ${botY} ${-hz} ${-hx} ${topY} ${-hz}`);
  lines.push(`2 24 ${hx} ${botY} ${-hz} ${hx} ${topY} ${-hz}`);
  lines.push(`2 24 ${hx} ${botY} ${hz} ${hx} ${topY} ${hz}`);
  lines.push(`2 24 ${-hx} ${botY} ${hz} ${-hx} ${topY} ${hz}`);

  // Se tiver studs, adicionar referências aos studs no topo
  if (part.hasStuds) {
    for (let xIdx = 0; xIdx < studsX; xIdx++) {
      const sx = -hx + 10 + xIdx * 20;
      for (let zIdx = 0; zIdx < studsZ; zIdx++) {
        const sz = -hz + 10 + zIdx * 20;
        // 1 <color> <x> <y> <z> <mat3x3> stud.dat
        lines.push(`1 16 ${sx} ${topY} ${sz} 1 0 0 0 1 0 0 0 1 stud.dat`);
      }
    }
  }

  // Tubos inferiores para peças 2xN
  if (studsX >= 2 && studsZ >= 2 && part.category !== 'Baseplates') {
    const tubeCountX = studsX - 1;
    const tubeCountZ = studsZ - 1;
    const startX = -((tubeCountX - 1) * 20) / 2;
    const startZ = -((tubeCountZ - 1) * 20) / 2;

    for (let ix = 0; ix < tubeCountX; ix++) {
      for (let iz = 0; iz < tubeCountZ; iz++) {
        const tx = startX + ix * 20;
        const tz = startZ + iz * 20;
        lines.push(`1 16 ${tx} 0 ${tz} 1 0 0 0 1 0 0 0 1 tube.dat`);
      }
    }
  }

  lines.push('0');

  // Definir subpart stud.dat no mesmo arquivo MPD
  lines.push('0 FILE stud.dat');
  lines.push('0 Stud');
  lines.push('0 Name: stud.dat');
  lines.push('0 BFC CERTIFY CCW');

  // Gerar cilindro de stud: raio = 6, altura = 4 (de y=0 até y=-4)
  const segments = 16;
  const radius = 6;
  const studH = 4;

  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = Math.round(Math.cos(a1) * radius * 100) / 100;
    const z1 = Math.round(Math.sin(a1) * radius * 100) / 100;
    const x2 = Math.round(Math.cos(a2) * radius * 100) / 100;
    const z2 = Math.round(Math.sin(a2) * radius * 100) / 100;

    // Parede lateral do pino (quadrilátero)
    lines.push(`4 16 ${x1} 0 ${z1} ${x2} 0 ${z2} ${x2} ${-studH} ${z2} ${x1} ${-studH} ${z1}`);
    // Topo do pino (triângulo para o centro 0,-studH,0)
    lines.push(`3 16 0 ${-studH} 0 ${x1} ${-studH} ${z1} ${x2} ${-studH} ${z2}`);
    // Aresta circular superior
    lines.push(`2 24 ${x1} ${-studH} ${z1} ${x2} ${-studH} ${z2}`);
  }

  lines.push('0');

  // Definir subpart tube.dat para conexões inferiores
  if (studsX >= 2 && studsZ >= 2 && part.category !== 'Baseplates') {
    lines.push('0 FILE tube.dat');
    lines.push('0 Anti-Stud Tube');
    lines.push('0 Name: tube.dat');
    lines.push('0 BFC CERTIFY CCW');

    const tubeR = 8.14;
    const tubeH = height - 2.5;

    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const x1 = Math.round(Math.cos(a1) * tubeR * 100) / 100;
      const z1 = Math.round(Math.sin(a1) * tubeR * 100) / 100;
      const x2 = Math.round(Math.cos(a2) * tubeR * 100) / 100;
      const z2 = Math.round(Math.sin(a2) * tubeR * 100) / 100;

      // Parede externa do tubo
      lines.push(`4 16 ${x1} 0 ${z1} ${x2} 0 ${z2} ${x2} ${-tubeH} ${z2} ${x1} ${-tubeH} ${z1}`);
      lines.push(`2 24 ${x1} 0 ${z1} ${x2} 0 ${z2}`);
    }

    lines.push('0');
  }

  // Se o colorCode for diferente de 16, adicionamos uma chamada raiz envolvendo o arquivo
  if (colorCode !== 16) {
    const rootWrapper = [
      `0 FILE model.ldr`,
      `0 Model with color ${colorCode}`,
      `1 ${colorCode} 0 0 0 1 0 0 0 1 0 0 0 1 ${part.id}.dat`,
      '0',
      ...lines,
    ];
    return rootWrapper.join('\n');
  }

  return lines.join('\n');
}
