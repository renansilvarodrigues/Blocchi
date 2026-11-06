import type { LegoPartDefinition, LegoCategory } from '../types/lego';
export { OFFICIAL_LDRAW_CATEGORIES } from '../types/lego';
import { LEGO_PARTS_CATALOG } from './partsData';

let cachedCatalog: LegoPartDefinition[] | null = null;
let catalogPromise: Promise<LegoPartDefinition[]> | null = null;
const partMap = new Map<string, LegoPartDefinition>();

// Inicializa o mapa com as peças curadas embutidas
LEGO_PARTS_CATALOG.forEach((part) => partMap.set(part.id.toLowerCase(), part));

/**
 * Categorizador oficial rigoroso baseado na taxonomia oficial do ecossistema LDraw.
 * Exclui explicitamente redirecionamentos e a categoria "Other Compatible Products".
 */
export function categorizeLDrawPart(description: string = '', filename: string = ''): LegoCategory | null {
  const desc = (description || '').trim();
  const d = desc.toLowerCase();
  const f = (filename || '').toLowerCase();

  // 0. Redirecionamentos e alias LDraw
  if (
    d.startsWith('~moved') ||
    d.startsWith('_moved') ||
    d.startsWith('~moved to') ||
    d.startsWith('_moved to') ||
    d.startsWith('~')
  ) {
    return null;
  }

  // 0. Exclusão explícita de "Other Compatible Products" (peças de outros fabricantes compatíveis)
  if (
    d.includes('other compatible') ||
    d.includes('tyco') ||
    d.includes('mega bloks') ||
    d.includes('kre-o') ||
    d.includes('cobi') ||
    d.includes('oxford')
  ) {
    return null;
  }

  // 1. Stickers (Adesivos e Decalques)
  if (
    d.startsWith('sticker') ||
    d.includes('sticker ') ||
    d.startsWith('decal') ||
    d.includes('decal ') ||
    f.endsWith('d01.dat')
  ) {
    return 'Stickers';
  }

  // 2. Textiles (Tecidos, Capas e Velas)
  if (
    d.includes('cloth') ||
    d.includes('fabric') ||
    d.includes('sail') ||
    d.includes('canvas') ||
    d.includes('tent') ||
    d.includes('cape fabric') ||
    d.includes('cape cloth')
  ) {
    return 'Textiles';
  }

  // 3. Animals And Accessories For Animals
  if (
    d.startsWith('animal') ||
    d.includes('animal ') ||
    d.includes('horse') ||
    d.includes('dog') ||
    d.includes('cat ') ||
    d.includes('bird') ||
    d.includes('shark') ||
    d.includes('snake') ||
    d.includes('spider') ||
    d.includes('dragon') ||
    d.includes('bat ') ||
    d.includes('fish ') ||
    d.includes('cow ') ||
    d.includes('pig ') ||
    d.includes('frog') ||
    d.includes('dolphin') ||
    d.includes('monkey') ||
    d.includes('crocodile') ||
    d.includes('alligator') ||
    d.includes('saddle') ||
    d.includes('reins') ||
    d.includes('beast') ||
    d.includes('creature') ||
    d.includes('octopus') ||
    d.includes('crab') ||
    d.includes('owl') ||
    d.includes('parrot') ||
    d.includes('scorpion') ||
    d.includes('dinosaur') ||
    d.includes('elephant') ||
    d.includes('bear ') ||
    d.includes('wolf') ||
    d.includes('lion') ||
    d.includes('camel')
  ) {
    if (!d.startsWith('minifig tail') && !d.includes('minifig mask cat')) {
      return 'Animals And Accessories For Animals';
    }
  }

  // 4. Minifigures & Subcategorias
  if (
    d.startsWith('minifig') ||
    d.includes('minifig') ||
    d.startsWith('figure') ||
    d.includes('figure friends') ||
    d.startsWith('skeleton') ||
    d.startsWith('bigfig') ||
    d.startsWith('microfig')
  ) {
    // Weapons
    if (
      d.includes('weapon') ||
      d.includes('sword') ||
      d.includes('gun') ||
      d.includes('blaster') ||
      d.includes('pistol') ||
      d.includes('rifle') ||
      d.includes('spear') ||
      d.includes('bow ') ||
      d.includes('arrow') ||
      d.includes('axe') ||
      d.includes('dagger') ||
      d.includes('knife') ||
      d.includes('cannon') ||
      d.includes('lightsaber') ||
      d.includes('mace') ||
      d.includes('halberd') ||
      d.includes('scythe')
    ) {
      return 'Minifigures - Weapons';
    }

    // Heads
    if (d.includes('head ') || d.includes('head with') || d.endsWith('head') || d.includes('head 0')) {
      return 'Minifigures - Heads';
    }

    // Hairs
    if (d.includes('hair') || d.includes('beard') || d.includes('mustache')) {
      return 'Minifigures - Hairs';
    }

    // Head Clothing / Chapéus / Capacetes
    if (
      d.includes('helmet') ||
      d.includes('hat') ||
      d.includes('cap') ||
      d.includes('bandana') ||
      d.includes('hood') ||
      d.includes('crown') ||
      d.includes('turban') ||
      d.includes('beret') ||
      d.includes('mask') ||
      d.includes('headgear') ||
      d.includes('visor') ||
      d.includes('headdress')
    ) {
      return 'Minifigures - Head Clothing';
    }

    // Upper Parts
    if (
      d.includes('torso') ||
      d.includes('arm ') ||
      d.includes('arms') ||
      d.includes('hand ') ||
      d.includes('hands') ||
      d.includes('body')
    ) {
      return 'Minifigures - Upper Parts';
    }

    // Lower Parts
    if (
      d.includes('leg') ||
      d.includes('hips') ||
      d.includes('tail') ||
      d.includes('skirt') ||
      d.includes('mermaid') ||
      d.includes('dress')
    ) {
      return 'Minifigures - Lower Parts';
    }

    // Accessories In Hand
    if (
      d.includes('wand') ||
      d.includes('torch') ||
      d.includes('broom') ||
      d.includes('glass') ||
      d.includes('goblet') ||
      d.includes('guitar') ||
      d.includes('microphone') ||
      d.includes('cup') ||
      d.includes('mug') ||
      d.includes('briefcase')
    ) {
      return 'Minifigures - Accessories In Hand';
    }

    // Accessories
    if (
      d.includes('accessory') ||
      d.includes('backpack') ||
      d.includes('air tank') ||
      d.includes('cape') ||
      d.includes('quiver') ||
      d.includes('armor') ||
      d.includes('scuba') ||
      d.includes('skate') ||
      d.includes('ski') ||
      d.includes('flipper') ||
      d.includes('shield') ||
      d.includes('binoculars') ||
      d.includes('camera') ||
      d.includes('bucket')
    ) {
      return 'Minifigures - Accessories';
    }

    return 'Minifigures';
  }

  // 5. Electric Parts (Componentes Elétricos, Motores, Baterias)
  if (
    d.includes('electric') ||
    d.includes('battery') ||
    d.includes('motor') ||
    d.includes('power functions') ||
    d.includes('powered up') ||
    d.includes('sensor') ||
    d.includes('sound ') ||
    d.includes('siren') ||
    d.includes('micro scout') ||
    d.includes('mindstorms') ||
    d.includes('solar cell')
  ) {
    return 'Electric Parts';
  }

  // 6. Food Stuff (Comida e Alimentos)
  if (
    d.includes('food') ||
    d.includes('apple') ||
    d.includes('banana') ||
    d.includes('carrot') ||
    d.includes('cherry') ||
    d.includes('bread') ||
    d.includes('croissant') ||
    d.includes('pizza') ||
    d.includes('cake') ||
    d.includes('ice cream') ||
    d.includes('cookie') ||
    d.includes('pretzel') ||
    d.includes('hot dog') ||
    d.includes('cupcake') ||
    d.includes('chicken leg') ||
    d.includes('bone')
  ) {
    return 'Food Stuff';
  }

  // 7. Plants (Plantas, Árvores e Vegetação)
  if (
    d.startsWith('plant') ||
    d.includes('plant ') ||
    d.includes('flower') ||
    d.includes('tree') ||
    d.includes('grass') ||
    d.includes('leaf') ||
    d.includes('leaves') ||
    d.includes('bush') ||
    d.includes('palm') ||
    d.includes('vine') ||
    d.includes('root') ||
    d.includes('seaweed') ||
    d.includes('mushroom') ||
    d.includes('foliage') ||
    d.includes('stem') ||
    d.includes('cactus') ||
    d.includes('bamboo')
  ) {
    return 'Plants';
  }

  // 8. Fences And Ladders (Cercas e Escadas)
  if (
    d.includes('fence') ||
    d.includes('ladder') ||
    d.includes('barrier') ||
    d.includes('railing') ||
    d.includes('spindle')
  ) {
    return 'Fences And Ladders';
  }

  // 9. Doors & Windows (Portas, Janelas e Vidros)
  if (
    d.includes('door') ||
    d.includes('window') ||
    d.includes('shutter') ||
    d.includes('gate') ||
    d.startsWith('frame 1 x 4 x 6') ||
    d.startsWith('frame 1 x 2 x 2') ||
    d.startsWith('glass for door') ||
    d.startsWith('glass for window')
  ) {
    return 'Doors & Windows';
  }

  // 10. Windscreens And Cockpits (Pára-brisas e Cockpits)
  if (
    d.includes('windscreen') ||
    d.includes('cockpit') ||
    d.includes('canopy') ||
    d.includes('windshield')
  ) {
    return 'Windscreens And Cockpits';
  }

  // 11. Rubbers And Strings (Borrachas, Correias e Cordas)
  if (
    d.includes('rubber') ||
    d.includes('string') ||
    d.includes('belt') ||
    d.includes('elastic') ||
    d.includes('band rubber') ||
    d.includes('rope') ||
    d.includes('net ') ||
    d.includes('winch cable')
  ) {
    return 'Rubbers And Strings';
  }

  // 12. Signs And Flags (Sinais e Bandeiras)
  if (
    d.includes('sign') ||
    d.includes('flag') ||
    d.includes('pennant') ||
    d.includes('roadsign') ||
    d.includes('marker')
  ) {
    return 'Signs And Flags';
  }

  // 13. Slides & Rails (Trilhos e Tobogãs)
  if (
    d.includes('slide') ||
    d.includes('rail') ||
    d.includes('track') ||
    d.includes('roller coaster') ||
    d.includes('coaster') ||
    d.includes('monorail')
  ) {
    return 'Slides & Rails';
  }

  // 14. Transportation (Trens, Aviação, Barcos, Veículos)
  if (
    d.includes('train') ||
    d.includes('locomotive') ||
    d.includes('bogie') ||
    d.includes('pantograph')
  ) {
    return 'Transportation - Trains';
  }

  if (
    d.includes('aircraft') ||
    d.includes('airplane') ||
    d.includes('plane') ||
    d.includes('helicopter') ||
    d.includes('rotor') ||
    d.includes('propeller') ||
    d.includes('fuselage') ||
    d.includes('jet engine')
  ) {
    return 'Transportation - Aviation';
  }

  if (
    d.includes('boat') ||
    d.includes('ship') ||
    d.includes('hull') ||
    d.includes('mast') ||
    d.includes('anchor') ||
    d.includes('rudder') ||
    d.includes('canoe') ||
    d.includes('kayak') ||
    d.includes('oar') ||
    d.includes('paddle')
  ) {
    return 'Transportation - Boats';
  }

  // 15. Wheel Bases / Wheel Based
  if (
    d.includes('wheelbase') ||
    d.includes('wheel base') ||
    d.includes('car base') ||
    d.includes('chassis') ||
    (d.includes('plate') && d.includes('with wheels'))
  ) {
    return 'Wheel Bases';
  }

  if (
    d.includes('wheel bearing') ||
    d.includes('wheel pin') ||
    d.includes('wheel holder') ||
    d.includes('wheel based') ||
    d.includes('steering wheel')
  ) {
    return 'Wheel Based';
  }

  // 16. Tyres And Rims (Pneus e Rodas)
  if (
    d.includes('tyre') ||
    d.includes('tire') ||
    d.includes('rim ') ||
    d.includes('wheel rim') ||
    d.startsWith('wheel ')
  ) {
    if (d.includes('3.2') || d.includes('small') || d.includes('micro') || d.includes('mini')) {
      return 'Tyres And Rims - Ø3.2';
    }
    if (d.includes('4.85') || d.includes('technic') || d.includes('standard')) {
      return 'Tyres And Rims - Ø4.85';
    }
    return 'Tyres And Rims - Special';
  }

  if (
    d.includes('vehicle') ||
    d.includes('car ') ||
    d.includes('truck') ||
    d.includes('mudguard') ||
    d.includes('spoiler') ||
    d.includes('bumper') ||
    d.includes('bonnet') ||
    d.includes('motorcycle') ||
    d.includes('bike') ||
    d.includes('bicycle') ||
    d.includes('tricycle') ||
    d.includes('forklift')
  ) {
    return 'Transportation - Vehicles';
  }

  // 17. Tubes (Mangueiras e Tubos)
  if (
    d.startsWith('hose') ||
    d.includes('hose ') ||
    d.includes('tube') ||
    d.includes('pipe') ||
    d.includes('exhaust') ||
    d.includes('pneumatic hose')
  ) {
    return 'Tubes';
  }

  // 18. Cranes And Scaffold & Construction
  if (
    d.includes('crane') ||
    d.includes('scaffold') ||
    d.includes('winch') ||
    d.includes('pulley') ||
    d.includes('hoist') ||
    d.includes('outrigger')
  ) {
    return 'Cranes And Scaffold';
  }

  if (
    d.includes('girder') ||
    d.includes('truss') ||
    d.includes('pylon') ||
    d.includes('construction') ||
    d.startsWith('rock ')
  ) {
    return 'Construction';
  }

  // 19. Functionnal Elements - Gear Wheels And Racks & Functional
  if (
    d.includes('gear') ||
    d.includes('rack') ||
    d.includes('differential') ||
    d.includes('sprocket') ||
    d.includes('clutch') ||
    d.includes('transmission') ||
    d.includes('driving ring')
  ) {
    return 'Functionnal Elements - Gear Wheels And Racks';
  }

  if (
    d.includes('shock absorber') ||
    d.includes('pneumatic') ||
    d.includes('linear actuator') ||
    d.includes('piston') ||
    d.includes('pump') ||
    d.includes('spring')
  ) {
    return 'Functionnal Elements';
  }

  // 20. Connectors (Pinos, Eixos, Buchas e Conectores Technic)
  if (
    d.includes('technic pin') ||
    d.includes('technic axle') ||
    d.includes('technic bush') ||
    d.includes('axle connector') ||
    d.includes('pin connector') ||
    d.includes('technic connector') ||
    d.includes('toggle joint') ||
    d.includes('universal joint') ||
    d.includes('technic cross block') ||
    d.includes('connector')
  ) {
    return 'Connectors';
  }

  // 21. Beams & Subcategorias
  if (
    d.includes('technic beam') ||
    d.includes('liftarm') ||
    d.startsWith('beam ') ||
    d.includes(' beam ')
  ) {
    if (d.includes('ball') || d.includes('cup') || d.includes('towball') || d.includes('joint')) {
      return 'Beams - Ball & Ball Cup';
    }
    if (d.includes('panel') || d.includes('fairing')) {
      return 'Beams - Panels';
    }
    if (d.includes('thin') || d.includes('half') || d.includes('0.5')) {
      if (
        d.includes('bent') ||
        d.includes('angle') ||
        d.includes('curved') ||
        d.includes('special') ||
        d.includes('triangle')
      ) {
        return 'Beams - Half - Special';
      }
      return 'Beams - Half';
    }
    if (
      d.includes('bent') ||
      d.includes('angle') ||
      d.includes('curved') ||
      d.includes('special') ||
      d.includes('triangle') ||
      d.includes('t-shape') ||
      d.includes('l-shape') ||
      d.includes('frame') ||
      d.includes('crank')
    ) {
      return 'Beams - Special';
    }
    return 'Beams';
  }

  // 22. Decoration Elements
  if (
    d.includes('ornament') ||
    d.includes('plume') ||
    d.includes('feather') ||
    d.includes('flame') ||
    d.includes('crystal') ||
    d.includes('gem') ||
    d.includes('jewel') ||
    d.includes('star') ||
    d.includes('heart') ||
    d.includes('coin') ||
    d.includes('treasure') ||
    d.includes('antenna')
  ) {
    return 'Decoration Elements';
  }

  // 23. Interior (Mobília e Utensílios Domésticos)
  if (
    d.includes('chair') ||
    d.includes('seat') ||
    d.includes('table') ||
    d.includes('cupboard') ||
    d.includes('sink') ||
    d.includes('toilet') ||
    d.includes('desk') ||
    d.includes('bed') ||
    d.includes('tap ') ||
    d.includes('faucet') ||
    d.includes('telephone') ||
    d.includes('clock') ||
    d.includes('radio') ||
    d.includes('oven') ||
    d.includes('computer') ||
    d.includes('container bookcase')
  ) {
    return 'Interior';
  }

  // 24. Wall & Roof Elements (Paredes e Telhados)
  if (
    d.includes('roof') ||
    d.includes('ridge') ||
    d.includes('eaves') ||
    d.includes('cornice') ||
    d.includes('gable') ||
    d.includes('chimney') ||
    d.includes('wall ') ||
    d.includes('parapet') ||
    d.includes('battlement')
  ) {
    return 'Wall & Roof Elements';
  }

  // 25. Support (Pilares e Colunas)
  if (
    d.includes('support') ||
    d.includes('pillar') ||
    d.includes('column') ||
    d.includes('stanchion') ||
    d.includes('post') ||
    d.includes('pier') ||
    d.includes('strut')
  ) {
    return 'Support';
  }

  // 26. Baseplates
  if (d.startsWith('baseplate') || d.includes('baseplate')) {
    return 'Plates - Baseplates';
  }

  // 27. Tiles / Plates - Flat Tiles / Plates - Specials - Flat
  if (d.startsWith('tile') || d.includes('tile ')) {
    if (
      d.includes('round') ||
      d.includes('circle') ||
      d.includes('curved') ||
      d.includes('modified') ||
      d.includes('special') ||
      d.includes('grille') ||
      d.includes('clip') ||
      d.includes('groove') ||
      d.includes('angle') ||
      d.includes('corner')
    ) {
      return 'Plates - Specials - Flat';
    }
    return 'Plates - Flat Tiles';
  }

  // 28. Plates & Subcategorias
  if (d.startsWith('plate') || d.includes('plate ')) {
    if (
      d.includes('round') ||
      d.includes('circle') ||
      d.includes('curved') ||
      d.includes('dish') ||
      d.includes('swivel') ||
      d.includes('turntable')
    ) {
      return 'Plates - Special - Circles';
    }
    if (
      d.includes('corner') ||
      d.includes('angle') ||
      d.includes('wedge plate') ||
      d.includes('wing')
    ) {
      return 'Plates - Special - Angles';
    }
    if (
      d.includes('handle') ||
      d.includes('clip') ||
      d.includes('hinge') ||
      d.includes('modified') ||
      d.includes('special') ||
      d.includes('pin') ||
      d.includes('groove') ||
      d.includes('hook') ||
      d.includes('slider') ||
      d.includes('ball') ||
      d.includes('towball') ||
      d.includes('arm')
    ) {
      return 'Plates - Special';
    }
    return 'Plates';
  }

  // 29. Bricks & Subcategorias
  if (
    d.startsWith('brick') ||
    d.includes('brick ') ||
    d.startsWith('arch') ||
    d.startsWith('slope') ||
    d.startsWith('wedge') ||
    d.startsWith('cone') ||
    d.startsWith('cylinder') ||
    d.startsWith('dome')
  ) {
    if (
      d.includes('technic brick') ||
      d.includes('brick with hole') ||
      d.includes('brick with pin') ||
      d.includes('brick with axlehole') ||
      d.includes('ø4.85') ||
      d.includes('4.85')
    ) {
      return 'Bricks - Special - Ø4.85';
    }
    if (
      d.includes('round') ||
      d.includes('cylinder') ||
      d.includes('circle') ||
      d.includes('dome') ||
      d.includes('macaroni') ||
      d.startsWith('cone')
    ) {
      return 'Bricks - Special - Circles';
    }
    if (d.includes('arch') || d.includes('bow') || d.includes('curved top')) {
      if (d.includes('special') || d.includes('inverted') || d.includes('double')) {
        return 'Bricks - Special - Bows';
      }
      return 'Bricks - Bows';
    }
    if (
      d.includes('slope') ||
      d.includes('sloped') ||
      d.includes('sloping') ||
      d.startsWith('wedge')
    ) {
      if (d.includes('inverted') || d.includes('special') || d.includes('curved') || d.includes('double')) {
        return 'Bricks - Special - Sloping';
      }
      return 'Bricks - Sloping';
    }
    if (d.includes('corner') || d.includes('angle') || d.includes('faceted')) {
      return 'Bricks - Special - Angles';
    }
    if (
      d.includes('headlight') ||
      d.includes('handle') ||
      d.includes('clip') ||
      d.includes('hinge') ||
      d.includes('modified') ||
      d.includes('special') ||
      d.includes('pin') ||
      d.includes('groove') ||
      d.includes('grille') ||
      d.includes('studs on')
    ) {
      return 'Bricks - Special';
    }
    return 'Bricks';
  }

  return 'Various Parts';
}

/**
 * Normaliza categorias de forma segura para a taxonomia oficial do Blocchi 3D
 */
export function normalizeCategory(rawCategory: string = '', description: string = ''): LegoCategory {
  const cat = categorizeLDrawPart(description || rawCategory || '');
  return cat || 'Various Parts';
}

/**
 * Estima dimensões aproximadas (studsX, studsZ, heightPlates) a partir do nome/descrição e categoria oficial
 */
function estimateDimensions(
  name: string,
  category: LegoCategory
): { studsX: number; studsZ: number; heightPlates: number } {
  let studsX = 1;
  let studsZ = 1;
  let heightPlates = 3; // Padrão Brick

  if (category === 'Plates - Baseplates') {
    heightPlates = 0.5;
  } else if (
    category === 'Plates' ||
    category === 'Plates - Flat Tiles' ||
    category === 'Plates - Specials - Flat' ||
    category === 'Plates - Special' ||
    category === 'Plates - Special - Angles' ||
    category === 'Plates - Special - Circles'
  ) {
    heightPlates = 1;
  } else if (category.startsWith('Minifigures')) {
    heightPlates = 4;
  }

  // Procurar padrão "X x Z" (ex: "Brick 2 x 4" ou "Plate 1 x 2")
  const match = name.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
  if (match) {
    studsX = Math.max(1, Math.round(parseFloat(match[1])));
    studsZ = Math.max(1, Math.round(parseFloat(match[2])));
  }

  return { studsX, studsZ, heightPlates };
}

/**
 * Faz o parse de um arquivo parts.lst oficial do LDraw alocando rigorosamente cada peça
 * na sua respectiva subcategoria oficial LDraw e ignorando aliases.
 */
export function parsePartsLst(content: string): LegoPartDefinition[] {
  const lines = content.split(/\r?\n/);
  const result: LegoPartDefinition[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#') || rawLine.startsWith('0 ')) continue;

    // Formato padrão: "<filename.dat><tab ou espaços><description>"
    const sepIdx = rawLine.search(/[\t\s]/);
    if (sepIdx === -1) continue;

    const fullFilename = rawLine.substring(0, sepIdx).trim();
    const description = rawLine.substring(sepIdx + 1).trim();

    if (!fullFilename.toLowerCase().endsWith('.dat')) continue;

    // Ignorar subpeças internas de /s/ no menu principal
    if (
      fullFilename.toLowerCase().startsWith('s/') ||
      fullFilename.toLowerCase().startsWith('parts/s/')
    ) {
      continue;
    }

    // Extrair ID limpo
    const cleanFilename = fullFilename.replace(/^parts[/\\]/i, '');
    const id = cleanFilename.replace(/\.dat$/i, '').trim();
    if (!id) continue;

    // Ignorar redirecionamentos LDraw (ex: "~Moved to 3821")
    if (
      description.startsWith('~Moved to') ||
      description.startsWith('_Moved to') ||
      description.startsWith('~')
    ) {
      continue;
    }

    // Se já temos a peça na lista de peças curadas, preservá-la
    const curated = partMap.get(id.toLowerCase());
    if (curated) {
      result.push(curated);
      continue;
    }

    const cleanName = description.replace(/^[~_]\s*/, '').trim();
    const category = categorizeLDrawPart(cleanName, cleanFilename);

    // Se a categoria for nula (exclui aliases e 'Other Compatible Products'), ignorar
    if (!category) continue;

    const dimensions = estimateDimensions(cleanName, category);

    const partDef: LegoPartDefinition = {
      id,
      name: cleanName,
      category,
      dimensions,
      lduSize: {
        x: dimensions.studsX * 20,
        y: dimensions.heightPlates * 8,
        z: dimensions.studsZ * 20,
      },
      hasStuds:
        category !== 'Plates - Flat Tiles' &&
        category !== 'Plates - Specials - Flat' &&
        !cleanName.toLowerCase().includes('tile'),
      description: cleanName,
      isFlexible:
        cleanName.toLowerCase().includes('flexible') ||
        cleanName.toLowerCase().includes('hose') ||
        cleanName.toLowerCase().includes('chain'),
    };

    partMap.set(id.toLowerCase(), partDef);
    result.push(partDef);
  }

  return result;
}

/**
 * Carrega a lista completa oficial do catálogo LDraw sob demanda (Lazy Loading)
 * Lê prioritariamente `parts.lst` da biblioteca LDraw.
 */
export async function getPartsCatalog(): Promise<LegoPartDefinition[]> {
  if (cachedCatalog) return cachedCatalog;
  if (catalogPromise) return catalogPromise;

  catalogPromise = (async () => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const ldrawBase = baseUrl.endsWith('/') ? `${baseUrl}ldraw/` : `${baseUrl}/ldraw/`;

    // 1. Tentar ler o índice oficial parts.lst
    try {
      const partsLstUrl = `${ldrawBase}parts.lst`;
      const response = await fetch(partsLstUrl);
      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 50) {
          const parsed = parsePartsLst(text);
          if (parsed.length > 0) {
            console.log(`[LDraw Catalog] Carregadas com sucesso ${parsed.length} peças oficiais via parts.lst.`);
            cachedCatalog = parsed;
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('[LDraw Catalog] Aviso ao buscar parts.lst, tentando fallback JSON:', err);
    }

    // 2. Fallback: tentar ler parts-catalog.json se parts.lst não estiver disponível
    try {
      const jsonUrl = `${ldrawBase}parts-catalog.json`;
      const jsonRes = await fetch(jsonUrl);
      if (jsonRes.ok) {
        const jsonData = (await jsonRes.json()) as LegoPartDefinition[];
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const map = new Map<string, LegoPartDefinition>();
          LEGO_PARTS_CATALOG.forEach((p) => map.set(p.id.toLowerCase(), p));
          jsonData.forEach((p) => {
            if (!map.has(p.id.toLowerCase())) {
              // Re-normalizar se necessário para a taxonomia estrita
              const cat = categorizeLDrawPart(p.description || p.name, `${p.id}.dat`) || 'Various Parts';
              map.set(p.id.toLowerCase(), { ...p, category: cat });
            }
          });
          const merged = Array.from(map.values());
          console.log(`[LDraw Catalog] Carregadas ${merged.length} peças via parts-catalog.json.`);
          merged.forEach((p) => partMap.set(p.id.toLowerCase(), p));
          cachedCatalog = merged;
          return merged;
        }
      }
    } catch (err) {
      console.warn('[LDraw Catalog] Aviso ao carregar parts-catalog.json:', err);
    }

    // 3. Fallback final: usar o catálogo interno estático de alta fidelidade
    console.info('[LDraw Catalog] Usando catálogo interno curado.');
    cachedCatalog = LEGO_PARTS_CATALOG;
    return LEGO_PARTS_CATALOG;
  })();

  return catalogPromise;
}

/**
 * Obtém a definição de uma peça pelo ID (busca O(1))
 */
export function getPartDefinition(partId: string): LegoPartDefinition | undefined {
  return partMap.get(partId.toLowerCase());
}

/**
 * Obtém a definição de uma peça ou cria uma definição segura de fallback
 */
export function getPartDefinitionOrFallback(partId: string): LegoPartDefinition {
  const existing = partMap.get(partId.toLowerCase());
  if (existing) return existing;

  // Cria definição dinâmica segura para peças que não estavam no índice
  const fallbackDef: LegoPartDefinition = {
    id: partId,
    name: `LDraw Part #${partId}`,
    category: categorizeLDrawPart(`LDraw Part ${partId}`, `${partId}.dat`) || 'Various Parts',
    dimensions: { studsX: 1, studsZ: 1, heightPlates: 3 },
    lduSize: { x: 20, y: 24, z: 20 },
    hasStuds: true,
    description: `Peça LDraw ${partId}`,
  };

  partMap.set(partId.toLowerCase(), fallbackDef);
  return fallbackDef;
}
