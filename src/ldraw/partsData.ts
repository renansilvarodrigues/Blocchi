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
    category: 'Bricks - Special - Angles',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 40 },
    hasStuds: true,
    description: 'Tijolo de canto em L 2x2 para quinas e colunas.',
  },
  {
    id: '6091',
    name: 'Brick 1 x 2 x 1 1/3 Curved Top',
    category: 'Bricks - Bows',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 4 },
    lduSize: { x: 20, y: 32, z: 40 },
    hasStuds: true,
    description: 'Bloco 1x2 com arco superior suave.',
  },
  {
    id: '3659',
    name: 'Brick 1 x 4 Arch',
    category: 'Bricks - Bows',
    dimensions: { studsX: 1, studsZ: 4, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 80 },
    hasStuds: true,
    description: 'Arco clássico 1x4 para pontes e janelas.',
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
  {
    id: '2420',
    name: 'Plate 2 x 2 Corner',
    category: 'Plates - Special - Angles',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 40 },
    hasStuds: true,
    description: 'Placa de canto 2x2 em L.',
  },

  // ==================== TILES (Ladrilhos Lisos) ====================
  {
    id: '3070b',
    name: 'Tile 1 x 1 with Groove',
    category: 'Plates - Specials - Flat',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 20 },
    hasStuds: false,
    description: 'Ladrilho liso 1x1 sem pinos para acabamentos elegantes.',
  },
  {
    id: '3069b',
    name: 'Tile 1 x 2 with Groove',
    category: 'Plates - Specials - Flat',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 40 },
    hasStuds: false,
    description: 'Ladrilho liso 1x2 com chanfro lateral.',
  },
  {
    id: '63864',
    name: 'Tile 1 x 3',
    category: 'Plates - Flat Tiles',
    dimensions: { studsX: 1, studsZ: 3, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 60 },
    hasStuds: false,
    description: 'Ladrilho liso 1x3.',
  },
  {
    id: '2431',
    name: 'Tile 1 x 4 with Groove',
    category: 'Plates - Specials - Flat',
    dimensions: { studsX: 1, studsZ: 4, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 80 },
    hasStuds: false,
    description: 'Ladrilho liso 1x4.',
  },
  {
    id: '6636',
    name: 'Tile 1 x 6 with Groove',
    category: 'Plates - Specials - Flat',
    dimensions: { studsX: 1, studsZ: 6, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 120 },
    hasStuds: false,
    description: 'Ladrilho liso longo 1x6.',
  },
  {
    id: '3068b',
    name: 'Tile 2 x 2 with Groove',
    category: 'Plates - Specials - Flat',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 40 },
    hasStuds: false,
    description: 'Ladrilho liso 2x2 para pisos e tetos lisos.',
  },
  {
    id: '87079',
    name: 'Tile 2 x 4 with Groove',
    category: 'Plates - Specials - Flat',
    dimensions: { studsX: 2, studsZ: 4, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 80 },
    hasStuds: false,
    description: 'Ladrilho liso 2x4 para grandes superfícies planas.',
  },

  // ==================== SLOPES (Inclinadas / Rampas) ====================
  {
    id: '54200',
    name: 'Slope 31 1 x 1 x 2/3 (Cheese)',
    category: 'Bricks - Sloping',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 2 },
    lduSize: { x: 20, y: 16, z: 20 },
    hasStuds: false,
    slopeAngle: 31,
    description: 'Famosa rampa triangular Cheese Slope 1x1.',
  },
  {
    id: '3040b',
    name: 'Slope 45 2 x 1',
    category: 'Bricks - Sloping',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 40 },
    hasStuds: true,
    slopeAngle: 45,
    description: 'Rampa clássica inclinada a 45 graus 2x1.',
  },
  {
    id: '3039',
    name: 'Slope 45 2 x 2',
    category: 'Bricks - Sloping',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 40 },
    hasStuds: true,
    slopeAngle: 45,
    description: 'Rampa de telhado padrão 45 graus 2x2.',
  },
  {
    id: '3037',
    name: 'Slope 45 2 x 4',
    category: 'Bricks - Sloping',
    dimensions: { studsX: 2, studsZ: 4, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 80 },
    hasStuds: true,
    slopeAngle: 45,
    description: 'Rampa de telhado ampla 45 graus 2x4.',
  },
  {
    id: '4286',
    name: 'Slope 33 3 x 1',
    category: 'Bricks - Sloping',
    dimensions: { studsX: 1, studsZ: 3, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 60 },
    hasStuds: true,
    slopeAngle: 33,
    description: 'Rampa suave de inclinação 33 graus 3x1.',
  },
  {
    id: '3298',
    name: 'Slope 33 3 x 2',
    category: 'Bricks - Sloping',
    dimensions: { studsX: 2, studsZ: 3, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 60 },
    hasStuds: true,
    slopeAngle: 33,
    description: 'Rampa suave 33 graus 3x2.',
  },
  {
    id: '3665',
    name: 'Slope 45 2 x 1 Inverted',
    category: 'Bricks - Special - Sloping',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 40 },
    hasStuds: true,
    slopeAngle: 45,
    isInvertedSlope: true,
    description: 'Rampa invertida 45 graus 2x1 com pinos superiores e corte inferior.',
  },
  {
    id: '3660',
    name: 'Slope 45 2 x 2 Inverted',
    category: 'Bricks - Special - Sloping',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 40 },
    hasStuds: true,
    slopeAngle: 45,
    isInvertedSlope: true,
    description: 'Rampa invertida 45 graus 2x2 para asas e beirais.',
  },
  {
    id: '60481',
    name: 'Slope 65 2 x 1 x 2',
    category: 'Bricks - Sloping',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 6 },
    lduSize: { x: 20, y: 48, z: 40 },
    hasStuds: true,
    slopeAngle: 65,
    description: 'Rampa íngreme de 65 graus altura dupla.',
  },
  {
    id: '85984',
    name: 'Slope 30 1 x 2 x 2/3',
    category: 'Bricks - Sloping',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 2 },
    lduSize: { x: 20, y: 16, z: 40 },
    hasStuds: false,
    slopeAngle: 30,
    description: 'Rampa suave 1x2 de altura 2 placas.',
  },

  // ==================== ROUNDS (Peças Cilíndricas) ====================
  {
    id: '4073',
    name: 'Plate 1 x 1 Round (Stud)',
    category: 'Plates - Special - Circles',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 20 },
    hasStuds: true,
    description: 'Pino unitário redondo 1x1, luz ou detalhe centralizado.',
  },
  {
    id: '3062b',
    name: 'Brick 1 x 1 Round with Hollow Stud',
    category: 'Bricks - Special - Circles',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 20 },
    hasStuds: true,
    description: 'Coluna cilíndrica 1x1 com pino vazado.',
  },
  {
    id: '4032',
    name: 'Plate 2 x 2 Round',
    category: 'Plates - Special - Circles',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 40 },
    hasStuds: true,
    description: 'Placa circular 2x2 com 4 pinos.',
  },
  {
    id: '3941',
    name: 'Brick 2 x 2 Round',
    category: 'Bricks - Special - Circles',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 40, y: 24, z: 40 },
    hasStuds: true,
    description: 'Bloco cilíndrico robusto 2x2 para colunas e torres.',
  },
  {
    id: '98138',
    name: 'Tile 1 x 1 Round',
    category: 'Plates - Specials - Flat',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 20 },
    hasStuds: false,
    description: 'Ladrilho circular 1x1 liso.',
  },
  {
    id: '14769',
    name: 'Tile 2 x 2 Round',
    category: 'Plates - Specials - Flat',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 40 },
    hasStuds: false,
    description: 'Ladrilho circular 2x2 liso.',
  },
  {
    // O arquivo oficial atual é 4589.dat; 4589b não existe mais na biblioteca.
    id: '4589',
    name: 'Cone 1 x 1 with Top Groove',
    category: 'Bricks - Special - Circles',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 20 },
    hasStuds: true,
    description: 'Cone 1x1 com pino no topo.',
  },
  {
    id: '3942c',
    name: 'Cone 2 x 2 x 2 with Open Stud',
    category: 'Bricks - Special - Circles',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 6 },
    lduSize: { x: 40, y: 48, z: 40 },
    hasStuds: true,
    description: 'Cone grande 2x2 altura dupla.',
  },
  {
    id: '3960',
    name: 'Dish 4 x 4 Inverted (Radar)',
    category: 'Various Parts',
    dimensions: { studsX: 4, studsZ: 4, heightPlates: 3 },
    lduSize: { x: 80, y: 24, z: 80 },
    hasStuds: true,
    description: 'Antena radar parabólica 4x4.',
  },

  // ==================== TECHNIC (Vigas, Pinos, Eixos) ====================
  {
    id: '3700',
    name: 'Technic Brick 1 x 2 with Hole',
    category: 'Bricks - Special - Ø4.85',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 40 },
    hasStuds: true,
    description: 'Bloco Technic 1x2 com orifício lateral para pinos de conexão.',
    connectionPoints: [
      { type: 'technic-hole', position: [0, 12, 0], direction: [1, 0, 0], radius: 4 },
    ],
  },
  {
    id: '3701',
    name: 'Technic Brick 1 x 4 with 3 Holes',
    category: 'Bricks - Special - Ø4.85',
    dimensions: { studsX: 1, studsZ: 4, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 80 },
    hasStuds: true,
    description: 'Bloco Technic estrutural 1x4 com 3 furos laterais.',
  },
  {
    id: '3894',
    name: 'Technic Brick 1 x 6 with 5 Holes',
    category: 'Bricks - Special - Ø4.85',
    dimensions: { studsX: 1, studsZ: 6, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 120 },
    hasStuds: true,
    description: 'Bloco Technic estrutural 1x6 com 5 furos laterais.',
  },
  {
    id: '3702',
    name: 'Technic Brick 1 x 8 with 7 Holes',
    category: 'Bricks - Special - Ø4.85',
    dimensions: { studsX: 1, studsZ: 8, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 160 },
    hasStuds: true,
    description: 'Bloco Technic estrutural 1x8 com 7 furos laterais.',
  },
  {
    id: '2780',
    name: 'Technic Pin with Friction Ridges',
    category: 'Connectors',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 10, y: 10, z: 40 },
    hasStuds: false,
    description: 'Pino preto de fricção Technic para conectar vigas e blocos.',
    connectionPoints: [
      { type: 'technic-pin', position: [0, 0, 10], direction: [0, 0, 1], radius: 4 },
      { type: 'technic-pin', position: [0, 0, -10], direction: [0, 0, -1], radius: 4 },
    ],
  },
  {
    id: '3673',
    name: 'Technic Pin without Friction',
    category: 'Connectors',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 10, y: 10, z: 40 },
    hasStuds: false,
    description: 'Pino liso cinza Technic para rotação livre.',
  },
  {
    id: '6558',
    name: 'Technic Pin Long with Friction',
    category: 'Connectors',
    dimensions: { studsX: 1, studsZ: 3, heightPlates: 1 },
    lduSize: { x: 10, y: 10, z: 60 },
    hasStuds: false,
    description: 'Pino azul longo Technic 3L.',
  },
  {
    id: '32054',
    name: 'Technic Pin 3L with Stop Bush',
    category: 'Plants',
    dimensions: { studsX: 1, studsZ: 3, heightPlates: 1 },
    lduSize: { x: 10, y: 10, z: 60 },
    hasStuds: false,
    description: 'Pino Technic 3L com flange limitadora.',
  },
  {
    id: '3705',
    name: 'Technic Axle 4L',
    category: 'Connectors',
    dimensions: { studsX: 1, studsZ: 4, heightPlates: 1 },
    lduSize: { x: 10, y: 10, z: 80 },
    hasStuds: false,
    description: 'Eixo cruzado Technic comprimento 4.',
  },
  {
    id: '3706',
    name: 'Technic Axle 6L',
    category: 'Connectors',
    dimensions: { studsX: 1, studsZ: 6, heightPlates: 1 },
    lduSize: { x: 10, y: 10, z: 120 },
    hasStuds: false,
    description: 'Eixo cruzado Technic comprimento 6.',
  },
  {
    id: '32523',
    name: 'Technic Beam 1 x 3 Thick',
    category: 'Beams',
    dimensions: { studsX: 1, studsZ: 3, heightPlates: 2.5 },
    lduSize: { x: 20, y: 20, z: 60 },
    hasStuds: false,
    description: 'Viga estrutural sem pinos Technic 3L.',
  },
  {
    id: '32524',
    name: 'Technic Beam 1 x 7 Thick',
    category: 'Beams',
    dimensions: { studsX: 1, studsZ: 7, heightPlates: 2.5 },
    lduSize: { x: 20, y: 20, z: 140 },
    hasStuds: false,
    description: 'Viga estrutural sem pinos Technic 7L.',
  },

  // ==================== PANELS (Painéis & Pára-brisas) ====================
  {
    id: '4865',
    name: 'Panel 1 x 2 x 1',
    category: 'Various Parts',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 40 },
    hasStuds: true,
    description: 'Painel fino vertical 1x2x1 para divisórias.',
  },
  {
    id: '2362a',
    name: 'Panel 1 x 2 x 3 Hollow Studs',
    category: 'Various Parts',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 9 },
    lduSize: { x: 20, y: 72, z: 40 },
    hasStuds: true,
    description: 'Painel alto 1x2x3 para paredes e frentes de cabine.',
  },
  {
    id: '60581',
    name: 'Panel 1 x 4 x 3',
    category: 'Various Parts',
    dimensions: { studsX: 1, studsZ: 4, heightPlates: 9 },
    lduSize: { x: 20, y: 72, z: 80 },
    hasStuds: true,
    description: 'Painel amplo 1x4x3 para estruturas.',
  },
  {
    id: '3823',
    name: 'Windscreen 2 x 4 x 2',
    category: 'Windscreens And Cockpits',
    dimensions: { studsX: 2, studsZ: 4, heightPlates: 6 },
    lduSize: { x: 40, y: 48, z: 80 },
    hasStuds: true,
    description: 'Pára-brisa curvo para veículos e naves.',
  },
  {
    id: '3853',
    name: 'Window 1 x 4 x 3',
    category: 'Doors & Windows',
    dimensions: { studsX: 1, studsZ: 4, heightPlates: 9 },
    lduSize: { x: 20, y: 72, z: 80 },
    hasStuds: true,
    description: 'Moldura de janela 1x4x3.',
  },

  // ==================== MINIFIG (Minifiguras) ====================
  {
    id: '3626b',
    name: 'Minifig Head Hollow Stud',
    category: 'Minifigures - Heads',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3.5 },
    lduSize: { x: 20, y: 28, z: 20 },
    hasStuds: true,
    description: 'Cabeça clássica de minifigura Lego com pino vazado.',
  },
  {
    id: '973',
    name: 'Minifig Torso',
    category: 'Minifigures - Upper Parts',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 4 },
    lduSize: { x: 20, y: 32, z: 40 },
    hasStuds: true,
    description: 'Torso e braços de minifigura Lego.',
  },
  {
    id: '970c00',
    name: 'Minifig Hips and Legs',
    category: 'Minifigures - Lower Parts',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 5 },
    lduSize: { x: 20, y: 40, z: 40 },
    hasStuds: false,
    description: 'Pernas e quadril articulados de minifigura.',
  },
  {
    id: '3838',
    name: 'Minifig Air Tanks',
    category: 'Minifigures - Accessories',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 20 },
    hasStuds: false,
    description: 'Tanques de oxigênio espaciais/mergulho.',
  },
  {
    id: '3844',
    name: 'Minifig Helmet Castle',
    category: 'Minifigures - Head Clothing',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 20 },
    hasStuds: false,
    description: 'Capacete de cavaleiro clássico.',
  },

  // ==================== BASEPLATES (Placas Base) ====================
  {
    id: '3867',
    name: 'Baseplate 16 x 16',
    category: 'Plates - Baseplates',
    dimensions: { studsX: 16, studsZ: 16, heightPlates: 0.5 },
    lduSize: { x: 320, y: 4, z: 320 },
    hasStuds: true,
    description: 'Placa base ampla 16x16 para ancoragem da construção.',
  },
  {
    id: '3811',
    name: 'Baseplate 32 x 32',
    category: 'Plates - Baseplates',
    dimensions: { studsX: 32, studsZ: 32, heightPlates: 0.5 },
    lduSize: { x: 640, y: 4, z: 640 },
    hasStuds: true,
    description: 'Placa base clássica 32x32 para cidades e grandes maquetes.',
  },
  {
    id: '41539',
    name: 'Plate 8 x 8',
    category: 'Plates',
    dimensions: { studsX: 8, studsZ: 8, heightPlates: 1 },
    lduSize: { x: 160, y: 8, z: 160 },
    hasStuds: true,
    description: 'Placa espessa de ancoragem 8x8.',
  },

  // ==================== SPECIAL & FLEXIBLE ====================
  {
    id: '4070',
    name: 'Brick 1 x 1 with Headlight',
    category: 'Bricks - Special',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 20 },
    hasStuds: true,
    description: 'Bloco farol Erling 1x1 com pino frontal para técnicas SNOT.',
  },
  {
    id: '4085c',
    name: 'Plate 1 x 1 with Clip Vertical',
    category: 'Plates - Special',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 20 },
    hasStuds: true,
    description: 'Placa 1x1 com clipe vertical para fixação de barras e mangueiras.',
  },
  {
    id: '60477',
    name: 'Plate 1 x 2 with Handle',
    category: 'Plates - Special',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 40 },
    hasStuds: true,
    description: 'Placa 1x2 com alça lateral.',
  },
  {
    id: '3937',
    name: 'Hinge Brick 1 x 2 Base',
    category: 'Bricks - Special',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 40 },
    hasStuds: true,
    description: 'Base de dobradiça 1x2 articulada.',
  },
  {
    id: '3938',
    name: 'Hinge Brick 1 x 2 Top',
    category: 'Bricks - Special',
    dimensions: { studsX: 1, studsZ: 2, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 40 },
    hasStuds: true,
    description: 'Topo de dobradiça 1x2 articulada.',
  },
  {
    id: '3680',
    name: 'Turntable 2 x 2 Plate Base',
    category: 'Interior',
    dimensions: { studsX: 2, studsZ: 2, heightPlates: 1 },
    lduSize: { x: 40, y: 8, z: 40 },
    hasStuds: true,
    description: 'Base de prato giratório 2x2 para rotação 360° de veículos.',
  },
  {
    id: '14301',
    name: 'Hose Flexible 11.5L',
    category: 'Tubes',
    dimensions: { studsX: 1, studsZ: 12, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 240 },
    hasStuds: false,
    isFlexible: true,
    description: 'Mangueira plástica flexível com deformação e encaixe nas extremidades.',
  },
  {
    id: '73590',
    name: 'Hose Flexible 8.5L',
    category: 'Tubes',
    dimensions: { studsX: 1, studsZ: 9, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 180 },
    hasStuds: false,
    isFlexible: true,
    description: 'Mangueira estriada flexível de 8.5 pinos de comprimento.',
  },
  {
    id: '30104',
    name: 'Chain 21 Links',
    category: 'Various Parts',
    dimensions: { studsX: 1, studsZ: 10, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 200 },
    hasStuds: false,
    isFlexible: true,
    description: 'Corrente articulada com 21 elos e curvatura por catenária.',
  },
  {
    id: '14696',
    name: 'Technic Chain Link Reinforced',
    category: 'Various Parts',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 1 },
    lduSize: { x: 20, y: 8, z: 20 },
    hasStuds: false,
    isFlexible: true,
    description: 'Elo individual reforçado para esteiras e correntes.',
  },
];

/**
 * Gera código LDraw autocontido para peças procedurais
 */
export function generateLDrawSource(part: LegoPartDefinition, colorCode: number = 16): string {
  const { studsX, studsZ, heightPlates } = part.dimensions;
  const width = studsX * 20;
  const height = heightPlates * 8;
  const length = studsZ * 20;

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

  if (part.category === 'Bricks - Sloping' || part.category === 'Bricks - Special - Sloping' || (part.category as string) === 'Slopes') {
    if (part.isInvertedSlope) {
      // Rampa invertida: topo reto com pinos, base recortada inclinada
      lines.push(`4 16 ${-hx} ${topY} ${-hz} ${hx} ${topY} ${-hz} ${hx} ${topY} ${hz} ${-hx} ${topY} ${hz}`);
      lines.push(`4 16 ${-hx} ${topY} ${hz} ${hx} ${topY} ${hz} ${hx} ${botY} ${hz} ${-hx} ${botY} ${hz}`);
      lines.push(`4 16 ${-hx} ${botY} ${hz} ${hx} ${botY} ${hz} ${hx} ${topY + 8} ${-hz} ${-hx} ${topY + 8} ${-hz}`);
    } else {
      // Rampa normal
      lines.push(`4 16 ${-hx} ${botY} ${-hz} ${hx} ${botY} ${-hz} ${hx} ${botY} ${hz} ${-hx} ${botY} ${hz}`);
      lines.push(`4 16 ${-hx} ${botY} ${hz} ${hx} ${botY} ${hz} ${hx} ${topY} ${hz} ${-hx} ${topY} ${hz}`);
      lines.push(`4 16 ${-hx} ${topY} ${hz} ${hx} ${topY} ${hz} ${hx} ${botY} ${-hz} ${-hx} ${botY} ${-hz}`);
      lines.push(`3 16 ${-hx} ${botY} ${-hz} ${-hx} ${botY} ${hz} ${-hx} ${topY} ${hz}`);
      lines.push(`3 16 ${hx} ${botY} ${hz} ${hx} ${botY} ${-hz} ${hx} ${topY} ${hz}`);
    }
  } else if (part.category.includes('Circles') || (part.category as string) === 'Rounds') {
    const radius = Math.min(width, length) / 2;
    const segments = 24;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const x1 = Math.round(Math.cos(a1) * radius * 100) / 100;
      const z1 = Math.round(Math.sin(a1) * radius * 100) / 100;
      const x2 = Math.round(Math.cos(a2) * radius * 100) / 100;
      const z2 = Math.round(Math.sin(a2) * radius * 100) / 100;

      lines.push(`4 16 ${x1} ${botY} ${z1} ${x2} ${botY} ${z2} ${x2} ${topY} ${z2} ${x1} ${topY} ${z1}`);
      lines.push(`3 16 0 ${topY} 0 ${x1} ${topY} ${z1} ${x2} ${topY} ${z2}`);
    }
  } else {
    // Bricks, Plates, Tiles, Baseplates, Technic, Panels, Minifig
    lines.push(`4 16 ${-hx} ${topY} ${-hz} ${hx} ${topY} ${-hz} ${hx} ${topY} ${hz} ${-hx} ${topY} ${hz}`);
    lines.push(`4 16 ${-hx} ${botY} ${hz} ${hx} ${botY} ${hz} ${hx} ${topY} ${hz} ${-hx} ${topY} ${hz}`);
    lines.push(`4 16 ${hx} ${botY} ${-hz} ${-hx} ${botY} ${-hz} ${-hx} ${topY} ${-hz} ${hx} ${topY} ${-hz}`);
    lines.push(`4 16 ${-hx} ${botY} ${-hz} ${-hx} ${botY} ${hz} ${-hx} ${topY} ${hz} ${-hx} ${topY} ${-hz}`);
    lines.push(`4 16 ${hx} ${botY} ${hz} ${hx} ${botY} ${-hz} ${hx} ${topY} ${-hz} ${hx} ${topY} ${hz}`);
  }

  // Pinos superiores
  if (part.hasStuds) {
    if (part.category.includes('Circles') || (part.category as string) === 'Rounds') {
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
  }

  lines.push('0');

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
