import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const cacheDir = path.join(rootDir, 'ldraw_cache');
const zipPath = path.join(cacheDir, 'complete.zip');
const publicLDrawDir = path.join(rootDir, 'public', 'ldraw');

const LDRAW_ZIP_URL = 'https://library.ldraw.org/library/updates/complete.zip';

// Lista de peças prioritárias oficiais do catálogo abrangendo todas as categorias
export const CURATED_PARTS_LIST = [
  // Bricks
  { id: '3001', name: 'Brick 2 x 4', category: 'Bricks', studsX: 2, studsZ: 4, heightPlates: 3, hasStuds: true },
  { id: '3002', name: 'Brick 2 x 3', category: 'Bricks', studsX: 2, studsZ: 3, heightPlates: 3, hasStuds: true },
  { id: '3003', name: 'Brick 2 x 2', category: 'Bricks', studsX: 2, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3004', name: 'Brick 1 x 2', category: 'Bricks', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3005', name: 'Brick 1 x 1', category: 'Bricks', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: true },
  { id: '3622', name: 'Brick 1 x 3', category: 'Bricks', studsX: 1, studsZ: 3, heightPlates: 3, hasStuds: true },
  { id: '3010', name: 'Brick 1 x 4', category: 'Bricks', studsX: 1, studsZ: 4, heightPlates: 3, hasStuds: true },
  { id: '3009', name: 'Brick 1 x 6', category: 'Bricks', studsX: 1, studsZ: 6, heightPlates: 3, hasStuds: true },
  { id: '3008', name: 'Brick 1 x 8', category: 'Bricks', studsX: 1, studsZ: 8, heightPlates: 3, hasStuds: true },
  { id: '2456', name: 'Brick 2 x 6', category: 'Bricks', studsX: 2, studsZ: 6, heightPlates: 3, hasStuds: true },
  { id: '3007', name: 'Brick 2 x 8', category: 'Bricks', studsX: 2, studsZ: 8, heightPlates: 3, hasStuds: true },
  { id: '2357', name: 'Brick 2 x 2 Corner', category: 'Bricks - Special - Angles', studsX: 2, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '6091', name: 'Brick 1 x 2 x 1 1/3 with Curved Top', category: 'Bricks - Bows', studsX: 1, studsZ: 2, heightPlates: 4, hasStuds: true },
  { id: '3659', name: 'Brick 1 x 4 Arch', category: 'Bricks - Bows', studsX: 1, studsZ: 4, heightPlates: 3, hasStuds: true },

  // Plates
  { id: '3024', name: 'Plate 1 x 1', category: 'Plates', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: true },
  { id: '3023', name: 'Plate 1 x 2', category: 'Plates', studsX: 1, studsZ: 2, heightPlates: 1, hasStuds: true },
  { id: '3623', name: 'Plate 1 x 3', category: 'Plates', studsX: 1, studsZ: 3, heightPlates: 1, hasStuds: true },
  { id: '3710', name: 'Plate 1 x 4', category: 'Plates', studsX: 1, studsZ: 4, heightPlates: 1, hasStuds: true },
  { id: '3666', name: 'Plate 1 x 6', category: 'Plates', studsX: 1, studsZ: 6, heightPlates: 1, hasStuds: true },
  { id: '3460', name: 'Plate 1 x 8', category: 'Plates', studsX: 1, studsZ: 8, heightPlates: 1, hasStuds: true },
  { id: '3022', name: 'Plate 2 x 2', category: 'Plates', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: true },
  { id: '3021', name: 'Plate 2 x 3', category: 'Plates', studsX: 2, studsZ: 3, heightPlates: 1, hasStuds: true },
  { id: '3020', name: 'Plate 2 x 4', category: 'Plates', studsX: 2, studsZ: 4, heightPlates: 1, hasStuds: true },
  { id: '3795', name: 'Plate 2 x 6', category: 'Plates', studsX: 2, studsZ: 6, heightPlates: 1, hasStuds: true },
  { id: '3034', name: 'Plate 2 x 8', category: 'Plates', studsX: 2, studsZ: 8, heightPlates: 1, hasStuds: true },
  { id: '3031', name: 'Plate 4 x 4', category: 'Plates', studsX: 4, studsZ: 4, heightPlates: 1, hasStuds: true },
  { id: '3032', name: 'Plate 4 x 6', category: 'Plates', studsX: 4, studsZ: 6, heightPlates: 1, hasStuds: true },
  { id: '3035', name: 'Plate 4 x 8', category: 'Plates', studsX: 4, studsZ: 8, heightPlates: 1, hasStuds: true },
  { id: '2420', name: 'Plate 2 x 2 Corner', category: 'Plates - Special - Angles', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: true },

  // Tiles
  { id: '3070b', name: 'Tile 1 x 1 with Groove', category: 'Plates - Specials - Flat', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: false },
  { id: '3069b', name: 'Tile 1 x 2 with Groove', category: 'Plates - Specials - Flat', studsX: 1, studsZ: 2, heightPlates: 1, hasStuds: false },
  { id: '63864', name: 'Tile 1 x 3', category: 'Plates - Flat Tiles', studsX: 1, studsZ: 3, heightPlates: 1, hasStuds: false },
  { id: '2431', name: 'Tile 1 x 4 with Groove', category: 'Plates - Specials - Flat', studsX: 1, studsZ: 4, heightPlates: 1, hasStuds: false },
  { id: '6636', name: 'Tile 1 x 6 with Groove', category: 'Plates - Specials - Flat', studsX: 1, studsZ: 6, heightPlates: 1, hasStuds: false },
  { id: '3068b', name: 'Tile 2 x 2 with Groove', category: 'Plates - Specials - Flat', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: false },
  { id: '87079', name: 'Tile 2 x 4 with Groove', category: 'Plates - Specials - Flat', studsX: 2, studsZ: 4, heightPlates: 1, hasStuds: false },

  // Slopes (Rampas / Inclinadas)
  { id: '54200', name: 'Slope 31 1 x 1 x 2/3 (Cheese)', category: 'Bricks - Sloping', studsX: 1, studsZ: 1, heightPlates: 2, hasStuds: false },
  { id: '3040b', name: 'Slope 45 2 x 1', category: 'Bricks - Sloping', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3039', name: 'Slope 45 2 x 2', category: 'Bricks - Sloping', studsX: 2, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3037', name: 'Slope 45 2 x 4', category: 'Bricks - Sloping', studsX: 2, studsZ: 4, heightPlates: 3, hasStuds: true },
  { id: '4286', name: 'Slope 33 3 x 1', category: 'Bricks - Sloping', studsX: 1, studsZ: 3, heightPlates: 3, hasStuds: true },
  { id: '3298', name: 'Slope 33 3 x 2', category: 'Bricks - Sloping', studsX: 2, studsZ: 3, heightPlates: 3, hasStuds: true },
  { id: '3665', name: 'Slope 45 2 x 1 Inverted', category: 'Bricks - Special - Sloping', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3660', name: 'Slope 45 2 x 2 Inverted', category: 'Bricks - Special - Sloping', studsX: 2, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '60481', name: 'Slope 65 2 x 1 x 2', category: 'Bricks - Sloping', studsX: 1, studsZ: 2, heightPlates: 6, hasStuds: true },
  { id: '85984', name: 'Slope 30 1 x 2 x 2/3', category: 'Bricks - Sloping', studsX: 1, studsZ: 2, heightPlates: 2, hasStuds: false },

  // Rounds (Cilíndricas)
  { id: '4073', name: 'Plate 1 x 1 Round', category: 'Plates - Special - Circles', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: true },
  { id: '3062b', name: 'Brick 1 x 1 Round with Hollow Stud', category: 'Bricks - Special - Circles', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: true },
  { id: '4032', name: 'Plate 2 x 2 Round', category: 'Plates - Special - Circles', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: true },
  { id: '3941', name: 'Brick 2 x 2 Round', category: 'Bricks - Special - Circles', studsX: 2, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '98138', name: 'Tile 1 x 1 Round', category: 'Plates - Specials - Flat', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: false },
  { id: '14769', name: 'Tile 2 x 2 Round', category: 'Plates - Specials - Flat', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: false },
  { id: '4589', name: 'Cone 1 x 1 with Top Groove', category: 'Bricks - Special - Circles', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: true },
  { id: '3942c', name: 'Cone 2 x 2 x 2 with Open Stud', category: 'Bricks - Special - Circles', studsX: 2, studsZ: 2, heightPlates: 6, hasStuds: true },
  { id: '3960', name: 'Dish 4 x 4 Inverted (Radar)', category: 'Various Parts', studsX: 4, studsZ: 4, heightPlates: 3, hasStuds: true },

  // Technic
  { id: '3700', name: 'Technic Brick 1 x 2 with Hole', category: 'Bricks - Special - Ø4.85', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3701', name: 'Technic Brick 1 x 4 with 3 Holes', category: 'Bricks - Special - Ø4.85', studsX: 1, studsZ: 4, heightPlates: 3, hasStuds: true },
  { id: '3894', name: 'Technic Brick 1 x 6 with 5 Holes', category: 'Bricks - Special - Ø4.85', studsX: 1, studsZ: 6, heightPlates: 3, hasStuds: true },
  { id: '3702', name: 'Technic Brick 1 x 8 with 7 Holes', category: 'Bricks - Special - Ø4.85', studsX: 1, studsZ: 8, heightPlates: 3, hasStuds: true },
  { id: '2780', name: 'Technic Pin with Friction Ridges', category: 'Connectors', studsX: 1, studsZ: 2, heightPlates: 1, hasStuds: false },
  { id: '3673', name: 'Technic Pin without Friction', category: 'Connectors', studsX: 1, studsZ: 2, heightPlates: 1, hasStuds: false },
  { id: '6558', name: 'Technic Pin Long with Friction', category: 'Connectors', studsX: 1, studsZ: 3, heightPlates: 1, hasStuds: false },
  { id: '32054', name: 'Technic Pin 3L with Stop Bush', category: 'Plants', studsX: 1, studsZ: 3, heightPlates: 1, hasStuds: false },
  { id: '3705', name: 'Technic Axle 4L', category: 'Connectors', studsX: 1, studsZ: 4, heightPlates: 1, hasStuds: false },
  { id: '3706', name: 'Technic Axle 6L', category: 'Connectors', studsX: 1, studsZ: 6, heightPlates: 1, hasStuds: false },
  { id: '32523', name: 'Technic Beam 1 x 3 Thick', category: 'Beams', studsX: 1, studsZ: 3, heightPlates: 2.5, hasStuds: false },
  { id: '32524', name: 'Technic Beam 1 x 7 Thick', category: 'Beams', studsX: 1, studsZ: 7, heightPlates: 2.5, hasStuds: false },

  // Panels
  { id: '4865', name: 'Panel 1 x 2 x 1', category: 'Various Parts', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '2362a', name: 'Panel 1 x 2 x 3 with Hollow Studs', category: 'Various Parts', studsX: 1, studsZ: 2, heightPlates: 9, hasStuds: true },
  { id: '60581', name: 'Panel 1 x 4 x 3', category: 'Various Parts', studsX: 1, studsZ: 4, heightPlates: 9, hasStuds: true },
  { id: '3823', name: 'Windscreen 2 x 4 x 2', category: 'Windscreens And Cockpits', studsX: 2, studsZ: 4, heightPlates: 6, hasStuds: true },
  { id: '3853', name: 'Window 1 x 4 x 3', category: 'Doors & Windows', studsX: 1, studsZ: 4, heightPlates: 9, hasStuds: true },

  // Minifig
  { id: '3626b', name: 'Minifig Head with Hollow Stud', category: 'Minifigures - Heads', studsX: 1, studsZ: 1, heightPlates: 3.5, hasStuds: true },
  { id: '973', name: 'Minifig Torso', category: 'Minifigures - Upper Parts', studsX: 1, studsZ: 2, heightPlates: 4, hasStuds: true },
  { id: '970c00', name: 'Minifig Hips and Legs', category: 'Minifigures - Lower Parts', studsX: 1, studsZ: 2, heightPlates: 5, hasStuds: false },
  { id: '3838', name: 'Minifig Air Tanks', category: 'Minifigures - Accessories', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: false },
  { id: '3844', name: 'Minifig Helmet Castle', category: 'Minifigures - Head Clothing', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: false },

  // Baseplates
  { id: '3867', name: 'Baseplate 16 x 16', category: 'Plates - Baseplates', studsX: 16, studsZ: 16, heightPlates: 0.5, hasStuds: true },
  { id: '3811', name: 'Baseplate 32 x 32', category: 'Plates - Baseplates', studsX: 32, studsZ: 32, heightPlates: 0.5, hasStuds: true },
  { id: '41539', name: 'Plate 8 x 8', category: 'Plates', studsX: 8, studsZ: 8, heightPlates: 1, hasStuds: true },

  // Special & Flexible
  { id: '4070', name: 'Brick 1 x 1 with Headlight', category: 'Bricks - Special', studsX: 1, studsZ: 1, heightPlates: 3, hasStuds: true },
  { id: '4085c', name: 'Plate 1 x 1 with Clip Vertical', category: 'Plates - Special', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: true },
  { id: '60477', name: 'Plate 1 x 2 with Handle', category: 'Plates - Special', studsX: 1, studsZ: 2, heightPlates: 1, hasStuds: true },
  { id: '3937', name: 'Hinge Brick 1 x 2 Base', category: 'Bricks - Special', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3938', name: 'Hinge Brick 1 x 2 Top', category: 'Bricks - Special', studsX: 1, studsZ: 2, heightPlates: 3, hasStuds: true },
  { id: '3680', name: 'Turntable 2 x 2 Plate Base', category: 'Interior', studsX: 2, studsZ: 2, heightPlates: 1, hasStuds: true },
  { id: '14301', name: 'Hose Flexible 11.5L', category: 'Tubes', studsX: 1, studsZ: 12, heightPlates: 1, hasStuds: false, isFlexible: true },
  { id: '73590', name: 'Hose Flexible 8.5L', category: 'Tubes', studsX: 1, studsZ: 9, heightPlates: 1, hasStuds: false, isFlexible: true },
  { id: '30104', name: 'Chain 21 Links', category: 'Various Parts', studsX: 1, studsZ: 10, heightPlates: 1, hasStuds: false, isFlexible: true },
  { id: '14696', name: 'Technic Chain Link Reinforced', category: 'Various Parts', studsX: 1, studsZ: 1, heightPlates: 1, hasStuds: false, isFlexible: true },
];

/**
 * Normaliza categorias de metadados LDraw para a taxonomia padrão do Blocchi
 */
export function normalizeCategory(rawCategory, description = '') {
  const desc = (description || rawCategory || '').trim();
  const d = desc.toLowerCase();

  if (d.startsWith('~') || d.startsWith('_moved') || d.includes('other compatible')) {
    return 'Various Parts';
  }

  // 1. Stickers
  if (d.startsWith('sticker') || d.includes('sticker ') || d.startsWith('decal')) return 'Stickers';

  // 2. Textiles
  if (d.includes('cloth') || d.includes('fabric') || d.includes('sail') || d.includes('tent') || d.includes('cape')) return 'Textiles';

  // 3. Animals
  if (d.startsWith('animal') || d.includes('animal ') || d.includes('horse') || d.includes('dog') || d.includes('cat ') || d.includes('bird') || d.includes('shark') || d.includes('snake') || d.includes('spider') || d.includes('dragon') || d.includes('frog') || d.includes('dinosaur')) return 'Animals And Accessories For Animals';

  // 4. Minifigures
  if (d.startsWith('minifig') || d.includes('minifig') || d.startsWith('figure') || d.startsWith('skeleton')) {
    if (d.includes('weapon') || d.includes('sword') || d.includes('gun') || d.includes('blaster') || d.includes('spear') || d.includes('bow ') || d.includes('axe') || d.includes('shield')) return 'Minifigures - Weapons';
    if (d.includes('head ') || d.includes('head with') || d.endsWith('head')) return 'Minifigures - Heads';
    if (d.includes('hair') || d.includes('beard')) return 'Minifigures - Hairs';
    if (d.includes('helmet') || d.includes('hat') || d.includes('cap') || d.includes('hood') || d.includes('crown') || d.includes('mask')) return 'Minifigures - Head Clothing';
    if (d.includes('torso') || d.includes('arm ') || d.includes('arms') || d.includes('hand ') || d.includes('hands')) return 'Minifigures - Upper Parts';
    if (d.includes('leg') || d.includes('hips') || d.includes('tail') || d.includes('skirt')) return 'Minifigures - Lower Parts';
    if (d.includes('wand') || d.includes('torch') || d.includes('glass') || d.includes('guitar') || d.includes('cup') || d.includes('mug')) return 'Minifigures - Accessories In Hand';
    if (d.includes('accessory') || d.includes('backpack') || d.includes('air tank') || d.includes('cape') || d.includes('binoculars')) return 'Minifigures - Accessories';
    return 'Minifigures';
  }

  // 5. Electric
  if (d.includes('electric') || d.includes('battery') || d.includes('motor') || d.includes('power functions') || d.includes('sensor')) return 'Electric Parts';

  // 6. Food
  if (d.includes('food') || d.includes('apple') || d.includes('banana') || d.includes('pizza') || d.includes('bread') || d.includes('cake') || d.includes('ice cream')) return 'Food Stuff';

  // 7. Plants
  if (d.startsWith('plant') || d.includes('plant ') || d.includes('flower') || d.includes('tree') || d.includes('leaf') || d.includes('leaves') || d.includes('bush') || d.includes('palm')) return 'Plants';

  // 8. Fences & Ladders
  if (d.includes('fence') || d.includes('ladder') || d.includes('barrier') || d.includes('railing')) return 'Fences And Ladders';

  // 9. Doors & Windows
  if (d.includes('door') || d.includes('window') || d.includes('shutter') || d.includes('gate') || d.startsWith('frame 1 x')) return 'Doors & Windows';

  // 10. Windscreens
  if (d.includes('windscreen') || d.includes('cockpit') || d.includes('canopy') || d.includes('windshield')) return 'Windscreens And Cockpits';

  // 11. Rubbers & Strings
  if (d.includes('rubber') || d.includes('string') || d.includes('belt') || d.includes('elastic') || d.includes('rope')) return 'Rubbers And Strings';

  // 12. Signs & Flags
  if (d.includes('sign') || d.includes('flag') || d.includes('pennant')) return 'Signs And Flags';

  // 13. Slides & Rails
  if (d.includes('slide') || d.includes('rail') || d.includes('track') || d.includes('roller coaster')) return 'Slides & Rails';

  // 14. Transportation
  if (d.includes('train') || d.includes('locomotive') || d.includes('bogie')) return 'Transportation - Trains';
  if (d.includes('aircraft') || d.includes('airplane') || d.includes('helicopter') || d.includes('rotor') || d.includes('propeller')) return 'Transportation - Aviation';
  if (d.includes('boat') || d.includes('ship') || d.includes('hull') || d.includes('mast') || d.includes('anchor')) return 'Transportation - Boats';
  if (d.includes('wheelbase') || d.includes('wheel base') || d.includes('car base') || d.includes('chassis')) return 'Wheel Bases';
  if (d.includes('wheel bearing') || d.includes('wheel pin') || d.includes('wheel holder') || d.includes('wheel based') || d.includes('steering wheel')) return 'Wheel Based';
  if (d.includes('tyre') || d.includes('tire') || d.includes('rim ') || d.startsWith('wheel ')) {
    if (d.includes('3.2') || d.includes('small') || d.includes('micro') || d.includes('mini')) return 'Tyres And Rims - Ø3.2';
    if (d.includes('4.85') || d.includes('technic') || d.includes('standard')) return 'Tyres And Rims - Ø4.85';
    return 'Tyres And Rims - Special';
  }
  if (d.includes('vehicle') || d.includes('car ') || d.includes('truck') || d.includes('mudguard') || d.includes('motorcycle')) return 'Transportation - Vehicles';

  // 15. Tubes
  if (d.startsWith('hose') || d.includes('hose ') || d.includes('tube') || d.includes('pipe')) return 'Tubes';

  // 16. Cranes & Construction
  if (d.includes('crane') || d.includes('scaffold') || d.includes('winch') || d.includes('pulley')) return 'Cranes And Scaffold';
  if (d.includes('girder') || d.includes('truss') || d.includes('pylon') || d.includes('construction')) return 'Construction';

  // 17. Gears & Functional
  if (d.includes('gear') || d.includes('rack') || d.includes('differential') || d.includes('sprocket') || d.includes('transmission')) return 'Functionnal Elements - Gear Wheels And Racks';
  if (d.includes('shock absorber') || d.includes('pneumatic') || d.includes('linear actuator') || d.includes('piston') || d.includes('spring')) return 'Functionnal Elements';

  // 18. Connectors
  if (d.includes('technic pin') || d.includes('technic axle') || d.includes('technic bush') || d.includes('axle connector') || d.includes('pin connector') || d.includes('connector')) return 'Connectors';

  // 19. Beams
  if (d.includes('technic beam') || d.includes('liftarm') || d.startsWith('beam ') || d.includes(' beam ')) {
    if (d.includes('ball') || d.includes('cup') || d.includes('joint')) return 'Beams - Ball & Ball Cup';
    if (d.includes('panel') || d.includes('fairing')) return 'Beams - Panels';
    if (d.includes('thin') || d.includes('half') || d.includes('0.5')) {
      if (d.includes('bent') || d.includes('angle') || d.includes('curved') || d.includes('special')) return 'Beams - Half - Special';
      return 'Beams - Half';
    }
    if (d.includes('bent') || d.includes('angle') || d.includes('curved') || d.includes('special') || d.includes('triangle')) return 'Beams - Special';
    return 'Beams';
  }

  // 20. Decoration & Interior
  if (d.includes('ornament') || d.includes('plume') || d.includes('feather') || d.includes('crystal') || d.includes('gem') || d.includes('star') || d.includes('antenna')) return 'Decoration Elements';
  if (d.includes('chair') || d.includes('seat') || d.includes('table') || d.includes('cupboard') || d.includes('sink') || d.includes('desk') || d.includes('tap ') || d.includes('telephone')) return 'Interior';

  // 21. Wall & Roof & Support
  if (d.includes('roof') || d.includes('ridge') || d.includes('wall ') || d.includes('chimney')) return 'Wall & Roof Elements';
  if (d.includes('support') || d.includes('pillar') || d.includes('column') || d.includes('post')) return 'Support';

  // 22. Baseplates
  if (d.startsWith('baseplate') || d.includes('baseplate')) return 'Plates - Baseplates';

  // 23. Tiles
  if (d.startsWith('tile') || d.includes('tile ')) {
    if (d.includes('round') || d.includes('curved') || d.includes('modified') || d.includes('special') || d.includes('grille')) return 'Plates - Specials - Flat';
    return 'Plates - Flat Tiles';
  }

  // 24. Plates
  if (d.startsWith('plate') || d.includes('plate ')) {
    if (d.includes('round') || d.includes('circle') || d.includes('curved') || d.includes('dish') || d.includes('turntable')) return 'Plates - Special - Circles';
    if (d.includes('corner') || d.includes('angle') || d.includes('wedge plate') || d.includes('wing')) return 'Plates - Special - Angles';
    if (d.includes('handle') || d.includes('clip') || d.includes('hinge') || d.includes('modified') || d.includes('special') || d.includes('pin')) return 'Plates - Special';
    return 'Plates';
  }

  // 25. Bricks
  if (d.startsWith('brick') || d.includes('brick ') || d.startsWith('arch') || d.startsWith('slope') || d.startsWith('wedge') || d.startsWith('cone') || d.startsWith('cylinder')) {
    if (d.includes('technic brick') || d.includes('brick with hole') || d.includes('brick with pin') || d.includes('ø4.85') || d.includes('4.85')) return 'Bricks - Special - Ø4.85';
    if (d.includes('round') || d.includes('cylinder') || d.includes('circle') || d.includes('dome') || d.startsWith('cone')) return 'Bricks - Special - Circles';
    if (d.includes('arch') || d.includes('bow') || d.includes('curved top')) {
      if (d.includes('special') || d.includes('inverted')) return 'Bricks - Special - Bows';
      return 'Bricks - Bows';
    }
    if (d.includes('slope') || d.includes('sloped') || d.startsWith('wedge')) {
      if (d.includes('inverted') || d.includes('special') || d.includes('curved')) return 'Bricks - Special - Sloping';
      return 'Bricks - Sloping';
    }
    if (d.includes('corner') || d.includes('angle')) return 'Bricks - Special - Angles';
    if (d.includes('headlight') || d.includes('handle') || d.includes('clip') || d.includes('hinge') || d.includes('modified') || d.includes('special')) return 'Bricks - Special';
    return 'Bricks';
  }

  return 'Various Parts';
}

/**
 * Baixa arquivo via HTTPS
 */
export async function downloadCompleteZip() {
  if (fs.existsSync(zipPath)) {
    const stats = fs.statSync(zipPath);
    if (stats.size > 100 * 1024 * 1024) {
      console.log(`[LDraw Sync] complete.zip já existente e verificado (${(stats.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
  }

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  console.log(`[LDraw Sync] Baixando biblioteca oficial LDraw de ${LDRAW_ZIP_URL} ...`);
  const tempPath = zipPath + '.tmp';
  const file = fs.createWriteStream(tempPath);

  await new Promise((resolve, reject) => {
    https.get(LDRAW_ZIP_URL, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Falha no download, HTTP ${res.statusCode}`));
        return;
      }

      const total = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0;
      let lastLog = Date.now();
      const startTime = Date.now();

      res.on('data', (chunk) => {
        downloaded += chunk.length;
        file.write(chunk);
        if (Date.now() - lastLog > 3000) {
          const pct = total ? ((downloaded / total) * 100).toFixed(1) : '?';
          const speed = (downloaded / ((Date.now() - startTime) / 1000) / 1024 / 1024).toFixed(1);
          console.log(`[LDraw Sync] Baixados ${(downloaded / 1024 / 1024).toFixed(1)} MB (${pct}%) @ ${speed} MB/s`);
          lastLog = Date.now();
        }
      });

      res.on('end', () => {
        file.end();
        console.log(`[LDraw Sync] Download concluído em ${((Date.now() - startTime) / 1000).toFixed(1)}s (${(downloaded / 1024 / 1024).toFixed(1)} MB).`);
        fs.renameSync(tempPath, zipPath);
        resolve();
      });

      res.on('error', (err) => {
        file.close();
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      reject(err);
    });
  });
}

/**
 * Prioridade canônica das primitivas LDraw:
 * parts/ > p/48 > p > p/8. Isso impede que `stud.dat` resolva para
 * p/8/stud.dat (octogonal) quando existe p/stud.dat (16 lados + p/48).
 */
function basePriority(lowerRel) {
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

function buildFileMap(entries) {
  const map = Object.create(null);
  const priorities = new Map();

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (!entry.entryName.toLowerCase().startsWith('ldraw/')) continue;

    const relPath = entry.entryName.replace(/\\/g, '/').substring('ldraw/'.length);
    const lowerRel = relPath.toLowerCase();
    const base = path.basename(lowerRel);

    // Todos os caminhos publicados e mapeados são lowercase para funcionar
    // em servidores case-sensitive (GitHub Pages/Linux).
    map[lowerRel] = lowerRel;

    const priority = basePriority(lowerRel);
    if (!(base in map) || priority > (priorities.get(base) ?? -1)) {
      map[base] = lowerRel;
      priorities.set(base, priority);
    }

    if (lowerRel.startsWith('p/48/')) {
      map[`48/${base}`] = lowerRel;
    } else if (lowerRel.startsWith('p/8/')) {
      map[`8/${base}`] = lowerRel;
    } else if (lowerRel.startsWith('parts/s/')) {
      map[`s/${base}`] = lowerRel;
    } else if (lowerRel.startsWith('parts/textures/')) {
      map[`textures/${base}`] = lowerRel;
    }
  }

  return map;
}

/**
 * Extrai primitivas, cores, texturas e peças do catálogo com resolução recursiva de dependências
 */
export async function extractAndIndexLibrary() {
  console.log('[LDraw Sync] Processando arquivo ZIP e extraindo dependências...');
  const zip = new AdmZip(zipPath);

  fs.mkdirSync(publicLDrawDir, { recursive: true });
  fs.mkdirSync(path.join(publicLDrawDir, 'p'), { recursive: true });
  fs.mkdirSync(path.join(publicLDrawDir, 'parts'), { recursive: true });
  fs.mkdirSync(path.join(publicLDrawDir, 'parts', 's'), { recursive: true });
  fs.mkdirSync(path.join(publicLDrawDir, 'parts', 'textures'), { recursive: true });

  const entries = zip.getEntries();
  const entryMap = new Map();
  for (const entry of entries) {
    entryMap.set(entry.entryName.replace(/\\/g, '/').toLowerCase(), entry);
  }

  // 1. Extrair LDConfig.ldr (sempre em lowercase)
  const ldconfigEntry = entryMap.get('ldraw/ldconfig.ldr');
  if (ldconfigEntry) {
    fs.writeFileSync(path.join(publicLDrawDir, 'ldconfig.ldr'), ldconfigEntry.getData());
    console.log('[LDraw Sync] ldconfig.ldr extraído.');
  }

  // 2. Extrair todas as primitivas (/p)
  console.log('[LDraw Sync] Extraindo primitivas LDraw (/p)...');
  let primitivesCount = 0;
  for (const entry of entries) {
    const lowerEntryName = entry.entryName.toLowerCase().replace(/\\/g, '/');
    if (lowerEntryName.startsWith('ldraw/p/')) {
      const relPath = lowerEntryName.replace(/^ldraw\//, '');
      const dest = path.join(publicLDrawDir, relPath);
      if (entry.isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
      } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, entry.getData());
        primitivesCount++;
      }
    }
  }
  console.log(`[LDraw Sync] ${primitivesCount} primitivas extraídas em public/ldraw/p/.`);

  // 2b. Gerar filemap canônico (parts/ > p/48 > p > p/8)
  console.log('[LDraw Sync] Gerando filemap canônico...');
  const fileMap = buildFileMap(entries);
  const fileMapPath = path.join(publicLDrawDir, 'filemap.json');
  fs.writeFileSync(fileMapPath, JSON.stringify(fileMap), 'utf8');
  console.log(
    `[LDraw Sync] filemap.json gerado com ${Object.keys(fileMap).length} mapeamentos ` +
      `(${(fs.statSync(fileMapPath).size / 1024 / 1024).toFixed(2)} MB).`
  );

  // 2c. Extrair todas as texturas oficiais usadas por !TEXMAP
  console.log('[LDraw Sync] Extraindo texturas oficiais de peças...');
  let textureCount = 0;
  for (const entry of entries) {
    const lowerName = entry.entryName.toLowerCase();
    if (
      entry.isDirectory ||
      !lowerName.startsWith('ldraw/parts/textures/') ||
      !/\.(png|jpg|jpeg)$/i.test(lowerName)
    ) {
      continue;
    }

    const relPath = entry.entryName.replace(/\\/g, '/').substring('ldraw/'.length).toLowerCase();
    const dest = path.join(publicLDrawDir, relPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, entry.getData());
    textureCount++;
  }
  console.log(`[LDraw Sync] ${textureCount} texturas extraídas em public/ldraw/parts/textures/.`);

  // 3. Gerar arquivo de índice oficial parts.lst a partir do complete.zip
  console.log('[LDraw Sync] Gerando arquivo de índice oficial parts.lst...');
  const partsListLines = [];
  let totalIndexedParts = 0;

  for (const entry of entries) {
    const normName = entry.entryName.toLowerCase();
    // Apenas peças oficiais da pasta /parts/ (excluir subpeças /parts/s/ que não são peças finais de catálogo)
    if (
      normName.startsWith('ldraw/parts/') &&
      normName.endsWith('.dat') &&
      !normName.startsWith('ldraw/parts/s/') &&
      !entry.isDirectory
    ) {
      const filename = entry.entryName.substring('ldraw/parts/'.length).toLowerCase();
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
        partsListLines.push(`${filename}\t${desc}`);
        totalIndexedParts++;
      }
    }
  }

  partsListLines.sort((a, b) => a.localeCompare(b));
  const partsLstPath = path.join(publicLDrawDir, 'parts.lst');
  fs.writeFileSync(partsLstPath, partsListLines.join('\n'), 'utf8');
  console.log(
    `[LDraw Sync] parts.lst gerado com ${totalIndexedParts} peças oficiais (${(
      fs.statSync(partsLstPath).size / 1024 / 1024
    ).toFixed(2)} MB).`
  );

  // 4. Montar catálogo indexado das peças curadas + extrair dependências
  console.log('[LDraw Sync] Extraindo e indexando peças prioritárias...');
  const catalog = [];
  const extractedParts = new Set();
  const missingDependencies = new Set();

  function resolveLdrawReference(name, fromCanonical) {
    const normalized = name.replace(/\\/g, '/').toLowerCase().replace(/^ldraw\//, '');
    if (!normalized) return null;

    const direct = fileMap[normalized];
    if (direct) return direct;

    if (fromCanonical) {
      const slash = fromCanonical.replace(/\\/g, '/').lastIndexOf('/');
      if (slash > 0) {
        const relative = `${fromCanonical.slice(0, slash)}/${normalized}`.toLowerCase();
        if (fileMap[relative]) return fileMap[relative];
      }
    }

    const base = path.basename(normalized);
    return fileMap[base] ?? null;
  }

  function extractPartRecursive(requestName, fromCanonical = null) {
    const canonical = resolveLdrawReference(requestName, fromCanonical);
    if (!canonical) {
      missingDependencies.add(
        `"${requestName}"${fromCanonical ? ` (referenciado por "${fromCanonical}")` : ''}`
      );
      return;
    }

    const norm = canonical.replace(/\\/g, '/').toLowerCase();
    if (extractedParts.has(norm)) return;
    extractedParts.add(norm);

    const zipEntry = entryMap.get(`ldraw/${norm}`);
    if (!zipEntry) {
      missingDependencies.add(`"${canonical}" (entrada ausente no complete.zip)`);
      return;
    }

    const dest = path.join(publicLDrawDir, norm);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const data = zipEntry.getData();
    fs.writeFileSync(dest, data);

    // Resolver subarquivos (linha tipo 1) preservando o contexto canônico.
    const text = data.toString('utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('1 ')) continue;
      const tokens = trimmed.split(/\s+/);
      if (tokens.length < 15) continue;
      const subfile = tokens[tokens.length - 1];
      if (subfile) extractPartRecursive(subfile, canonical);
    }
  }

  for (const item of CURATED_PARTS_LIST) {
    const filename = `parts/${item.id}.dat`;
    const canonicalRoot = resolveLdrawReference(filename);
    const zipEntry = canonicalRoot ? entryMap.get(`ldraw/${canonicalRoot.toLowerCase()}`) : null;
    let description = item.name;
    let category = item.category;

    if (zipEntry) {
      extractPartRecursive(filename);
      const text = zipEntry.getData().toString('utf8');
      const lines = text.split(/\r?\n/);
      const firstLineDesc = lines[0]?.replace(/^0\s+/, '').trim();
      if (firstLineDesc && !firstLineDesc.startsWith('~') && !firstLineDesc.startsWith('_')) {
        description = firstLineDesc;
      }
      for (const line of lines.slice(0, 20)) {
        const match = line.match(/^0\s+!CATEGORY\s+(.+)$/i);
        if (match) {
          category = normalizeCategory(match[1], description);
          break;
        }
      }
    } else {
      missingDependencies.add(`"${item.id}.dat" (peça curada ausente)`);
    }

    catalog.push({
      id: item.id,
      name: item.name,
      category: category,
      dimensions: {
        studsX: item.studsX,
        studsZ: item.studsZ,
        heightPlates: item.heightPlates,
      },
      lduSize: {
        x: item.studsX * 20,
        y: item.heightPlates * 8,
        z: item.studsZ * 20,
      },
      hasStuds: item.hasStuds,
      description: description,
      isFlexible: item.isFlexible || false,
    });
  }

  // 4b. Substituir p/stud.dat por uma versão explícita de alta resolução.
  // As referências usam 48/... para nunca depender da prioridade do filemap.
  const highResStud = [
    '0 Stud',
    '0 Name: stud.dat',
    '0 Author: James Jessiman',
    '0 !LDRAW_ORG Primitive UPDATE 2012-01',
    '0 !LICENSE Licensed under CC BY 4.0 : see CAreadme.txt',
    '',
    '0 BFC CERTIFY CCW',
    '',
    '1 16 0 0 0 6 0 0 0 1 0 0 0 6 48/4-4edge.dat',
    '1 16 0 -4 0 6 0 0 0 1 0 0 0 6 48/4-4edge.dat',
    '1 16 0 0 0 6 0 0 0 -4 0 0 0 6 48/4-4cyli.dat',
    '1 16 0 -4 0 6 0 0 0 1 0 0 0 6 48/4-4disc.dat',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(publicLDrawDir, 'p', 'stud.dat'), highResStud, 'utf8');
  console.log('[LDraw Sync] p/stud.dat substituído pela versão de alta resolução (p/48).');

  if (missingDependencies.size > 0) {
    console.warn(
      `[LDraw Sync] ${missingDependencies.size} dependências não encontradas:\n` +
        [...missingDependencies].slice(0, 50).join('\n')
    );
  }

  // 5. Salvar índice do catálogo em JSON para carregamento otimizado (Lazy Loading no Frontend)
  const catalogJsonPath = path.join(publicLDrawDir, 'parts-catalog.json');
  fs.writeFileSync(catalogJsonPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`[LDraw Sync] Catálogo salvo com ${catalog.length} peças em ${catalogJsonPath}.`);
  console.log(`[LDraw Sync] Total de arquivos de peças/subpartes extraídos: ${extractedParts.size}.`);
}

async function main() {
  await downloadCompleteZip();
  await extractAndIndexLibrary();
  console.log('[LDraw Sync] Biblioteca LDraw sincronizada e indexada com sucesso!');
}

main().catch((err) => {
  console.error('[LDraw Sync Error]', err);
  process.exit(1);
});

