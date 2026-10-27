export type ShadingMode = 'wireframe' | 'solid' | 'material' | 'rendered';

export type ToolMode = 'select' | 'move' | 'rotate' | 'duplicate' | 'delete';

export interface LDrawColor {
  code: number;
  name: string;
  hex: string;
  edgeHex?: string;
  category: 'solid' | 'transparent' | 'metallic' | 'special';
  isTrans?: boolean;
}

export interface LegoPartDefinition {
  id: string; // e.g. "3001"
  name: string; // "Brick 2 x 4"
  category: 'Bricks' | 'Plates' | 'Tiles' | 'Slopes' | 'Baseplates';
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
  description: string;
}

export interface PlacedBrick {
  instanceId: string;
  partId: string;
  name: string;
  colorCode: number;
  position: [number, number, number]; // in Three.js world units
  rotation: [number, number, number]; // Euler angles (radians)
}

export interface ViewportSettings {
  showGrid: boolean;
  showAxes: boolean;
  showShadows: boolean;
  showOutlines: boolean;
  shadingMode: ShadingMode;
  studSnapping: boolean;
}
