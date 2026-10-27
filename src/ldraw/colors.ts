import type { LDrawColor } from '../types/lego';

export const LDRAW_COLORS: LDrawColor[] = [
  // Cores Sólidas Clássicas e Modernas
  { code: 4, name: 'Red', hex: '#C91A09', edgeHex: '#4C0000', category: 'solid' },
  { code: 1, name: 'Blue', hex: '#0055BF', edgeHex: '#001D4C', category: 'solid' },
  { code: 14, name: 'Yellow', hex: '#F2CD37', edgeHex: '#5F4B00', category: 'solid' },
  { code: 0, name: 'Black', hex: '#1B2A34', edgeHex: '#000000', category: 'solid' },
  { code: 15, name: 'White', hex: '#FFFFFF', edgeHex: '#999999', category: 'solid' },
  { code: 2, name: 'Green', hex: '#237841', edgeHex: '#0C371B', category: 'solid' },
  { code: 25, name: 'Orange', hex: '#FE8A18', edgeHex: '#7F3D00', category: 'solid' },
  { code: 27, name: 'Lime', hex: '#BBE90B', edgeHex: '#4E6600', category: 'solid' },
  { code: 71, name: 'Light Bluish Gray', hex: '#A0A5A9', edgeHex: '#54595D', category: 'solid' },
  { code: 72, name: 'Dark Bluish Gray', hex: '#6C6E68', edgeHex: '#2E302D', category: 'solid' },
  { code: 70, name: 'Reddish Brown', hex: '#582A12', edgeHex: '#250E04', category: 'solid' },
  { code: 19, name: 'Tan', hex: '#E4CD9E', edgeHex: '#7C673A', category: 'solid' },
  { code: 212, name: 'Medium Azure', hex: '#36AEBF', edgeHex: '#0F4750', category: 'solid' },
  { code: 320, name: 'Dark Red', hex: '#720E0F', edgeHex: '#300203', category: 'solid' },
  { code: 288, name: 'Dark Green', hex: '#184632', edgeHex: '#061D13', category: 'solid' },
  { code: 29, name: 'Bright Pink', hex: '#E4ADC8', edgeHex: '#7B405E', category: 'solid' },
  { code: 89, name: 'Royal Blue', hex: '#4C61DB', edgeHex: '#182470', category: 'solid' },
  { code: 378, name: 'Sand Green', hex: '#A0BCAC', edgeHex: '#4E6859', category: 'solid' },
  { code: 26, name: 'Magenta', hex: '#92397D', edgeHex: '#410B35', category: 'solid' },
  { code: 323, name: 'Aqua', hex: '#D3F2EA', edgeHex: '#7BB3A5', category: 'solid' },

  // Cores Transparentes
  { code: 47, name: 'Trans-Clear', hex: '#FCFCFC', edgeHex: '#CCCCCC', category: 'transparent', isTrans: true },
  { code: 36, name: 'Trans-Red', hex: '#C91A09', edgeHex: '#600500', category: 'transparent', isTrans: true },
  { code: 33, name: 'Trans-Dark Blue', hex: '#0020A0', edgeHex: '#000E50', category: 'transparent', isTrans: true },
  { code: 46, name: 'Trans-Yellow', hex: '#F5CD2F', edgeHex: '#785F00', category: 'transparent', isTrans: true },
  { code: 42, name: 'Trans-Neon Green', hex: '#C0F500', edgeHex: '#526A00', category: 'transparent', isTrans: true },
  { code: 98, name: 'Trans-Orange', hex: '#F08F1C', edgeHex: '#703A00', category: 'transparent', isTrans: true },

  // Especiais / Metálicas
  { code: 297, name: 'Pearl Gold', hex: '#AA7F2E', edgeHex: '#553D10', category: 'metallic' },
  { code: 80, name: 'Metallic Silver', hex: '#A5A9B4', edgeHex: '#4F525A', category: 'metallic' },
  { code: 334, name: 'Chrome Gold', hex: '#BBA53D', edgeHex: '#594D18', category: 'metallic' },
  { code: 383, name: 'Chrome Silver', hex: '#E0E0E0', edgeHex: '#707070', category: 'metallic' },
];

export function getLDrawColor(code: number): LDrawColor {
  const color = LDRAW_COLORS.find(c => c.code === code);
  return color || LDRAW_COLORS[0]; // fallback to Red
}

/**
 * Gera as diretivas !COLOUR para o parser LDrawLoader
 */
export function generateLDConfigDirectives(): string {
  return LDRAW_COLORS.map(c => {
    const trans = c.isTrans ? ' ALPHA 128' : '';
    const edge = c.edgeHex ? ` EDGE ${c.edgeHex}` : '';
    return `0 !COLOUR ${c.name.replace(/\s+/g, '_')} CODE ${c.code} VALUE ${c.hex}${edge}${trans}`;
  }).join('\n');
}
