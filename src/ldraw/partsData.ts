import type { LegoPartDefinition } from '../types/lego';

export const LEGO_PARTS_CATALOG: LegoPartDefinition[] = [
  // ==================== BRICKS (Blocos Padrão) ====================
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
    id: '3002',
    name: 'Brick 2 x 3',
    category: 'Bricks',
    dimensions: { studsX: 2, studsZ: 3, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 60 },
    hasStuds: true,
    description: 'Tijolo 2x3 padrão LDraw com 6 pinos.',
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
    description: 'Tijolo linear 1x2, ideal para paredes e construções detalhadas.',
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
    id: '3622',
    name: 'Brick 1 x 3',
    category: 'Bricks',
    dimensions: { studsX: 1, studsZ: 3, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 60 },
    hasStuds: true,
    description: 'Tijolo linear 1x3 com 3 pinos.',
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
    id: '3008',
    name: 'Brick 1 x 8',
    category: 'Bricks',
    dimensions: { studsX: 1, studsZ: 8, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 160 },
    hasStuds: true,
    description: 'Tijolo linear estrutural 1x8.',
  },
  {
    id: '2456',
    name: 'Brick 2 x 6',
    category: 'Bricks',
    dimensions: { studsX: 2, studsZ: 6, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 120 },
    hasStuds: true,
    description: 'Tijolo largo 2x6 para sustentação robusta.',
  },
  {
    id: '3007',
    name: 'Brick 2 x 8',
    category: 'Bricks',
    dimensions: { studsX: 2, studsZ: 8, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 160 },
    hasStuds: true,
    description: 'Tijolo longo 2x8 com 16 pinos.',
  },
  {
    id: '2357',
    name: 'Brick 2 x 2 Corner',
    category: 'Bricks',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 40 },
    hasStuds: true,
    description: 'Tijolo de canto em L 2x2 para quinas e colunas.',
  },

  // ==================== PLATES (Placas) ====================
  {
    id: '3024',
    name: 'Plate 1 x 1',
    category: 'Plates',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 20 },
    hasStuds: true,
    description: 'Placa fina unitária 1x1 (1/3 da altura do bloco).',
  },
  {
    id: '3023',
    name: 'Plate 1 x 2',
    category: 'Plates',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 40 },
    hasStuds: true,
    description: 'Placa fina 1x2 com 2 pinos.',
  },
  {
    id: '3623',
    name: 'Plate 1 x 3',
    category: 'Plates',
    dimensions: { studsX: 1, studsZ: 3, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 60 },
    hasStuds: true,
    description: 'Placa fina 1x3.',
  },
  {
    id: '3710',
    name: 'Plate 1 x 4',
    category: 'Plates',
    dimensions: { studsX: 1, studsZ: 4, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 80 },
    hasStuds: true,
    description: 'Placa fina linear 1x4.',
  },
  {
    id: '3666',
    name: 'Plate 1 x 6',
    category: 'Plates',
    dimensions: { studsX: 1, studsZ: 6, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 120 },
    hasStuds: true,
    description: 'Placa fina linear 1x6.',
  },
  {
    id: '3460',
    name: 'Plate 1 x 8',
    category: 'Plates',
    dimensions: { studsX: 1, studsZ: 8, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 160 },
    hasStuds: true,
    description: 'Placa fina linear 1x8.',
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
    id: '3021',
    name: 'Plate 2 x 3',
    category: 'Plates',
    dimensions: { studsX: 2, studsZ: 3, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 60 },
    hasStuds: true,
    description: 'Placa fina 2x3.',
  },
  {
    id: '3020',
    name: 'Plate 2 x 4',
    category: 'Plates',
    dimensions: { studsX: 2, studsZ: 4, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 80 },
    hasStuds: true,
    description: 'Placa fina 2x4 (8 LDU de altura).',
  },
  {
    id: '3795',
    name: 'Plate 2 x 6',
    category: 'Plates',
    dimensions: { studsX: 2, studsZ: 6, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 120 },
    hasStuds: true,
    description: 'Placa fina longa 2x6.',
  },
  {
    id: '3034',
    name: 'Plate 2 x 8',
    category: 'Plates',
    dimensions: { studsX: 2, studsZ: 8, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 160 },
    hasStuds: true,
    description: 'Placa fina longa 2x8.',
  },
  {
    id: '3031',
    name: 'Plate 4 x 4',
    category: 'Plates',
    dimensions: { studsX: 4, studsZ: 4, heightPlates: 1 },
    lduSize: { x: 80, y: 8, z: 80 },
    hasStuds: true,
    description: 'Placa quadrada 4x4.',
  },
  {
    id: '3032',
    name: 'Plate 4 x 6',
    category: 'Plates',
    dimensions: { studsX: 4, studsZ: 6, heightPlates: 1 },
    lduSize: { x: 80, y: 8, z: 120 },
    hasStuds: true,
    description: 'Placa retangular 4x6.',
  },
  {
    id: '3035',
    name: 'Plate 4 x 8',
    category: 'Plates',
    dimensions: { studsX: 4, studsZ: 8, heightPlates: 1 },
    lduSize: { x: 80, y: 8, z: 160 },
    hasStuds: true,
    description: 'Placa retangular 4x8.',
  },

  // ==================== TILES (Ladrilhos Lisos) ====================
  {
    id: '3070b',
    name: 'Tile 1 x 1 with Groove',
    category: 'Tiles',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 20 },
    hasStuds: false,
    description: 'Ladrilho liso 1x1 sem pinos para acabamentos elegantes.',
  },
  {
    id: '3069b',
    name: 'Tile 1 x 2 with Groove',
    category: 'Tiles',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 40 },
    hasStuds: false,
    description: 'Ladrilho liso 1x2 com chanfro lateral.',
  },
  {
    id: '63864',
    name: 'Tile 1 x 3',
    category: 'Tiles',
    dimensions: { studsX: 1, studsZ: 3, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 60 },
    hasStuds: false,
    description: 'Ladrilho liso 1x3.',
  },
  {
    id: '2431',
    name: 'Tile 1 x 4 with Groove',
    category: 'Tiles',
    dimensions: { studsX: 1, studsZ: 4, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 80 },
    hasStuds: false,
    description: 'Ladrilho liso 1x4.',
  },
  {
    id: '3068b',
    name: 'Tile 2 x 2 with Groove',
    category: 'Tiles',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 40 },
    hasStuds: false,
    description: 'Ladrilho liso 2x2 para pisos e tetos lisos.',
  },
  {
    id: '87079',
    name: 'Tile 2 x 4 with Groove',
    category: 'Tiles',
    dimensions: { studsX: 2, studsZ: 4, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 80 },
    hasStuds: false,
    description: 'Ladrilho liso 2x4 para grandes superfícies planas.',
  },

  // ==================== SLOPES (Inclinadas / Rampas) ====================
  {
    id: '54200',
    name: 'Slope 31 1 x 1 x 2/3 (Cheese)',
    category: 'Slopes',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 2 },
    lduSize: { x: 20, y: 16, z: 20 },
    hasStuds: false,
    description: 'Famosa rampa triangular Cheese Slope 1x1.',
  },
  {
    id: '3040',
    name: 'Slope 45 2 x 1',
    category: 'Slopes',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 40 },
    hasStuds: true,
    description: 'Rampa clássica inclinada a 45 graus 2x1.',
  },
  {
    id: '3039',
    name: 'Slope 45 2 x 2',
    category: 'Slopes',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 40 },
    hasStuds: true,
    description: 'Rampa de telhado padrão 45 graus 2x2.',
  },
  {
    id: '3037',
    name: 'Slope 45 2 x 4',
    category: 'Slopes',
    dimensions: { studsX: 2, studsZ: 4, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 80 },
    hasStuds: true,
    description: 'Rampa de telhado ampla 45 graus 2x4.',
  },
  {
    id: '4286',
    name: 'Slope 33 3 x 1',
    category: 'Slopes',
    dimensions: { studsX: 1, studsZ: 3, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 60 },
    hasStuds: true,
    description: 'Rampa suave de inclinação 33 graus 3x1.',
  },
  {
    id: '3298',
    name: 'Slope 33 3 x 2',
    category: 'Slopes',
    dimensions: { studsX: 2, studsZ: 3, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 60 },
    hasStuds: true,
    description: 'Rampa suave 33 graus 3x2.',
  },

  // ==================== ROUNDS (Peças Cilíndricas) ====================
  {
    id: '4073',
    name: 'Plate 1 x 1 Round (Stud)',
    category: 'Rounds',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 20 },
    hasStuds: true,
    description: 'Pino unitário redondo 1x1, luz ou detalhe.',
  },
  {
    id: '3062b',
    name: 'Brick 1 x 1 Round with Hollow Stud',
    category: 'Rounds',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 20 },
    hasStuds: true,
    description: 'Coluna cilíndrica 1x1 com pino vazado.',
  },
  {
    id: '4032',
    name: 'Plate 2 x 2 Round',
    category: 'Rounds',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 40 },
    hasStuds: true,
    description: 'Placa circular 2x2 com 4 pinos.',
  },
  {
    id: '3941',
    name: 'Brick 2 x 2 Round',
    category: 'Rounds',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 40 },
    hasStuds: true,
    description: 'Bloco cilíndrico robusto 2x2 para colunas e torres.',
  },
  {
    id: '98138',
    name: 'Tile 1 x 1 Round',
    category: 'Rounds',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 20 },
    hasStuds: false,
    description: 'Ladrilho circular 1x1 liso.',
  },

  // ==================== BASEPLATES (Placas Base) ====================
  {
    id: '3867',
    name: 'Baseplate 16 x 16',
    category: 'Baseplates',
    dimensions: { studsX: 16, studsZ: 16, heightPlates: 0.5 },
    lduSize: { x: 320, y: 4, z: 320 },
    hasStuds: true,
    description: 'Placa base ampla 16x16 para ancoragem da construção.',
  },
  {
    id: '3811',
    name: 'Baseplate 32 x 32',
    category: 'Baseplates',
    dimensions: { studsX: 32, studsZ: 32, heightPlates: 0.5 },
    lduSize: { x: 640, y: 4, z: 640 },
    hasStuds: true,
    description: 'Placa base clássica 32x32 para cidades e grandes maquetes.',
  },
  {
    id: '41539',
    name: 'Plate 8 x 8',
    category: 'Baseplates',
    dimensions: { studsX: 8, studsZ: 8, heightPlates: 1 },
    lduSize: { x: 160, y: 8, z: 160 },
    hasStuds: true,
    description: 'Placa espessa de ancoragem 8x8.',
  },

  // ==================== TECHNIC & MODIFIED ====================
  {
    id: '3700',
    name: 'Technic Brick 1 x 2 with Hole',
    category: 'Technic',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 40 },
    hasStuds: true,
    description: 'Bloco Technic 1x2 com orifício para eixos ou pinos de conexão.',
  },
  {
    id: '3701',
    name: 'Technic Brick 1 x 4 with 3 Holes',
    category: 'Technic',
    dimensions: { studsX: 1, studsZ: 4, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 80 },
    hasStuds: true,
    description: 'Bloco Technic estrutural 1x4 com 3 furos.',
  },
  {
    id: '4070',
    name: 'Brick 1 x 1 with Headlight',
    category: 'Technic',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 20 },
    hasStuds: true,
    description: 'Bloco farol Erling 1x1 com rebaixo e pino lateral para técnicas SNOT.',
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

  // Se for rampa / slope
  if (part.category === 'Slopes') {
    // Face inferior
    lines.push(`4 16 ${-hx} ${botY} ${-hz} ${hx} ${botY} ${-hz} ${hx} ${botY} ${hz} ${-hx} ${botY} ${hz}`);
    // Face posterior (+Z)
    lines.push(`4 16 ${-hx} ${botY} ${hz} ${hx} ${botY} ${hz} ${hx} ${topY} ${hz} ${-hx} ${topY} ${hz}`);
    // Face frontal inclinada (rampa descendo para -Z)
    lines.push(`4 16 ${-hx} ${topY} ${hz} ${hx} ${topY} ${hz} ${hx} ${botY} ${-hz} ${-hx} ${botY} ${-hz}`);
    // Laterais triangulares
    lines.push(`3 16 ${-hx} ${botY} ${-hz} ${-hx} ${botY} ${hz} ${-hx} ${topY} ${hz}`);
    lines.push(`3 16 ${hx} ${botY} ${hz} ${hx} ${botY} ${-hz} ${hx} ${topY} ${hz}`);
    // Arestas
    lines.push(`2 24 ${-hx} ${topY} ${hz} ${hx} ${topY} ${hz}`);
    lines.push(`2 24 ${hx} ${botY} ${-hz} ${-hx} ${botY} ${-hz}`);
    lines.push(`2 24 ${-hx} ${topY} ${hz} ${-hx} ${botY} ${-hz}`);
    lines.push(`2 24 ${hx} ${topY} ${hz} ${hx} ${botY} ${-hz}`);
  } else if (part.category === 'Rounds') {
    // Cilindro
    const radius = Math.min(width, length) / 2;
    const segments = 16;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const x1 = Math.round(Math.cos(a1) * radius * 100) / 100;
      const z1 = Math.round(Math.sin(a1) * radius * 100) / 100;
      const x2 = Math.round(Math.cos(a2) * radius * 100) / 100;
      const z2 = Math.round(Math.sin(a2) * radius * 100) / 100;

      // Parede lateral
      lines.push(`4 16 ${x1} ${botY} ${z1} ${x2} ${botY} ${z2} ${x2} ${topY} ${z2} ${x1} ${topY} ${z1}`);
      // Topo
      lines.push(`3 16 0 ${topY} 0 ${x1} ${topY} ${z1} ${x2} ${topY} ${z2}`);
      // Aresta superior
      lines.push(`2 24 ${x1} ${topY} ${z1} ${x2} ${topY} ${z2}`);
    }
  } else {
    // Faces externas da caixa principal (Bricks, Plates, Tiles, Baseplates)
    // Top Face
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
  }

  // Se tiver studs, adicionar referências aos studs no topo
  if (part.hasStuds) {
    if (part.category === 'Rounds') {
      if (studsX === 1 && studsZ === 1) {
        lines.push(`1 16 0 ${topY} 0 1 0 0 0 1 0 0 0 1 stud.dat`);
      } else {
        for (let xIdx = 0; xIdx < studsX; xIdx++) {
          const sx = -hx + 10 + xIdx * 20;
          for (let zIdx = 0; zIdx < studsZ; zIdx++) {
            const sz = -hz + 10 + zIdx * 20;
            lines.push(`1 16 ${sx} ${topY} ${sz} 1 0 0 0 1 0 0 0 1 stud.dat`);
          }
        }
      }
    } else {
      for (let xIdx = 0; xIdx < studsX; xIdx++) {
        const sx = -hx + 10 + xIdx * 20;
        for (let zIdx = 0; zIdx < studsZ; zIdx++) {
          const sz = -hz + 10 + zIdx * 20;
          lines.push(`1 16 ${sx} ${topY} ${sz} 1 0 0 0 1 0 0 0 1 stud.dat`);
        }
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

  // Subpart stud.dat
  lines.push('0 FILE stud.dat');
  lines.push('0 Stud');
  lines.push('0 Name: stud.dat');
  lines.push('0 BFC CERTIFY CCW');

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

    lines.push(`4 16 ${x1} 0 ${z1} ${x2} 0 ${z2} ${x2} ${-studH} ${z2} ${x1} ${-studH} ${z1}`);
    lines.push(`3 16 0 ${-studH} 0 ${x1} ${-studH} ${z1} ${x2} ${-studH} ${z2}`);
    lines.push(`2 24 ${x1} ${-studH} ${z1} ${x2} ${-studH} ${z2}`);
  }

  lines.push('0');

  // Subpart tube.dat
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

      lines.push(`4 16 ${x1} 0 ${z1} ${x2} 0 ${z2} ${x2} ${-tubeH} ${z2} ${x1} ${-tubeH} ${z1}`);
      lines.push(`2 24 ${x1} 0 ${z1} ${x2} 0 ${z2}`);
    }

    lines.push('0');
  }

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
