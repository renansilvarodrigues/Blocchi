export type ShadingMode = 'wireframe' | 'solid' | 'material' | 'rendered';

export type ToolMode = 'select' | 'move' | 'rotate' | 'duplicate' | 'delete';

export type SelectionSubMode = 'click' | 'box';

export type LegoCategory =
  | 'Bricks'
  | 'Plates'
  | 'Tiles'
  | 'Slopes'
  | 'Technic'
  | 'Rounds'
  | 'Panels'
  | 'Minifig'
  | 'Baseplates'
  | 'Special';

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
