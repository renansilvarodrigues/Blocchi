export type ShadingMode = 'wireframe' | 'solid' | 'material' | 'rendered';

export type ToolMode = 'select' | 'move' | 'rotate' | 'duplicate' | 'delete';

export type SelectionSubMode = 'click' | 'box';

/**
 * Taxonomia oficial rigorosa de categorias do ecossistema LDraw / Mecabricks
 * (excluindo explicitamente "Other Compatible Products")
 */
export const OFFICIAL_LDRAW_CATEGORIES = [
  'Animals And Accessories For Animals',
  'Beams',
  'Beams - Ball & Ball Cup',
  'Beams - Half',
  'Beams - Half - Special',
  'Beams - Panels',
  'Beams - Special',
  'Bricks',
  'Bricks - Bows',
  'Bricks - Sloping',
  'Bricks - Special',
  'Bricks - Special - Angles',
  'Bricks - Special - Bows',
  'Bricks - Special - Circles',
  'Bricks - Special - Ø4.85',
  'Bricks - Special - Sloping',
  'Connectors',
  'Construction',
  'Cranes And Scaffold',
  'Decoration Elements',
  'Doors & Windows',
  'Electric Parts',
  'Fences And Ladders',
  'Food Stuff',
  'Functionnal Elements',
  'Functionnal Elements - Gear Wheels And Racks',
  'Interior',
  'Minifigures',
  'Minifigures - Accessories',
  'Minifigures - Accessories In Hand',
  'Minifigures - Hairs',
  'Minifigures - Head Clothing',
  'Minifigures - Heads',
  'Minifigures - Lower Parts',
  'Minifigures - Upper Parts',
  'Minifigures - Weapons',
  'Plants',
  'Plates',
  'Plates - Baseplates',
  'Plates - Flat Tiles',
  'Plates - Special',
  'Plates - Special - Angles',
  'Plates - Special - Circles',
  'Plates - Specials - Flat',
  'Rubbers And Strings',
  'Signs And Flags',
  'Slides & Rails',
  'Stickers',
  'Support',
  'Textiles',
  'Transportation - Aviation',
  'Transportation - Boats',
  'Transportation - Trains',
  'Transportation - Vehicles',
  'Tubes',
  'Tyres And Rims - Ø3.2',
  'Tyres And Rims - Ø4.85',
  'Tyres And Rims - Special',
  'Various Parts',
  'Wall & Roof Elements',
  'Wheel Based',
  'Wheel Bases',
  'Windscreens And Cockpits',
] as const;

export type LegoCategory = (typeof OFFICIAL_LDRAW_CATEGORIES)[number];

export interface LDrawColor {
  code: number;
  name: string;
  hex: string;
  edgeHex?: string;
  category: 'solid' | 'transparent' | 'metallic' | 'special';
  finish?: 'solid' | 'transparent' | 'chrome' | 'pearl' | 'metal' | 'rubber' | 'glow';
  isTrans?: boolean;
}

export interface ConnectionPoint {
  type: 'stud' | 'anti-stud' | 'technic-hole' | 'technic-pin' | 'flexible-anchor';
  position: [number, number, number]; // in LDU or Three.js units
  direction: [number, number, number]; // normal vector (e.g. [0, 1, 0] for top stud, [1, 0, 0] for side hole)
  radius?: number;
}

export interface LegoPartDefinition {
  id: string; // e.g. "3001"
  name: string; // "Brick 2 x 4"
  category: LegoCategory;
  dimensions: {
    studsX: number;
    studsZ: number;
    heightPlates: number; // 3 plates = 1 standard brick
  };
  lduSize: {
    x: number; // studsX * 20
    y: number; // heightPlates * 8
    z: number; // studsZ * 20
  };
  hasStuds: boolean;
  isFlexible?: boolean;
  isFallback?: boolean;
  slopeAngle?: number;
  isInvertedSlope?: boolean;
  connectionPoints?: ConnectionPoint[];
  description: string;
}

export interface PlacedBrick {
  instanceId: string;
  partId: string;
  name: string;
  colorCode: number;
  position: [number, number, number]; // in Three.js world units
  rotation: [number, number, number]; // Euler angles (radians)
  flexibleCurvePoints?: [number, number, number][]; // Pontos de controle da spline se for peça flexível
}

export interface ActivePlacement {
  mode: 'insert' | 'duplicate' | 'reposition';
  partDef: LegoPartDefinition;
  colorCode: number;
  initialRotation?: [number, number, number];
  repositionBrickId?: string;
  originalPosition?: [number, number, number];
  originalRotation?: [number, number, number];
}

export interface ViewportSettings {
  showGrid: boolean;
  showAxes: boolean;
  showShadows: boolean;
  showOutlines: boolean;
  shadingMode: ShadingMode;
  studSnapping: boolean;
}
