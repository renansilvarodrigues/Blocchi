import type { LDrawColor } from '../types/lego';

export const RAW_LDCONFIG_TEXT = `
0 !COLOUR Black                                                   CODE   0   VALUE #1B2A34   EDGE #000000
0 !COLOUR Blue                                                    CODE   1   VALUE #0055BF   EDGE #001D4C
0 !COLOUR Green                                                   CODE   2   VALUE #237841   EDGE #0C371B
0 !COLOUR Dark_Turquoise                                          CODE   3   VALUE #008F9B   EDGE #00545B
0 !COLOUR Red                                                     CODE   4   VALUE #C91A09   EDGE #4C0000
0 !COLOUR Dark_Pink                                               CODE   5   VALUE #C870A0   EDGE #763A5A
0 !COLOUR Brown                                                   CODE   6   VALUE #583927   EDGE #322016
0 !COLOUR Light_Gray                                              CODE   7   VALUE #9BA19D   EDGE #5B5E5C
0 !COLOUR Dark_Gray                                               CODE   8   VALUE #6D6E5C   EDGE #3E3F35
0 !COLOUR Light_Blue                                              CODE   9   VALUE #B4D2E3   EDGE #687983
0 !COLOUR Bright_Green                                            CODE  10   VALUE #4B9F4A   EDGE #2C5D2B
0 !COLOUR Light_Turquoise                                         CODE  11   VALUE #55A5AF   EDGE #326066
0 !COLOUR Salmon                                                  CODE  12   VALUE #F2705E   EDGE #8F392D
0 !COLOUR Pink                                                    CODE  13   VALUE #FC97AC   EDGE #955462
0 !COLOUR Yellow                                                  CODE  14   VALUE #F2CD37   EDGE #5F4B00
0 !COLOUR White                                                   CODE  15   VALUE #FFFFFF   EDGE #999999
0 !COLOUR Light_Green                                             CODE  17   VALUE #C2DAB8   EDGE #71806C
0 !COLOUR Light_Yellow                                            CODE  18   VALUE #FBE696   EDGE #938758
0 !COLOUR Tan                                                     CODE  19   VALUE #E4CD9E   EDGE #7C673A
0 !COLOUR Light_Violet                                            CODE  20   VALUE #C9CAE2   EDGE #767785
0 !COLOUR Purple                                                  CODE  22   VALUE #81007B   EDGE #4B0047
0 !COLOUR Dark_Blue_Violet                                        CODE  23   VALUE #2032B0   EDGE #131E69
0 !COLOUR Orange                                                  CODE  25   VALUE #FE8A18   EDGE #7F3D00
0 !COLOUR Magenta                                                 CODE  26   VALUE #92397D   EDGE #410B35
0 !COLOUR Lime                                                    CODE  27   VALUE #BBE90B   EDGE #4E6600
0 !COLOUR Dark_Tan                                                CODE  28   VALUE #958A73   EDGE #575043
0 !COLOUR Bright_Pink                                             CODE  29   VALUE #E4ADC8   EDGE #7B405E
0 !COLOUR Medium_Lavender                                         CODE  30   VALUE #AC78BA   EDGE #65466D
0 !COLOUR Lavender                                                CODE  31   VALUE #E1D5ED   EDGE #847D8B
0 !COLOUR Very_Light_Orange                                       CODE  68   VALUE #F3CF9B   EDGE #8F7A5B
0 !COLOUR Bright_Purple                                           CODE  69   VALUE #CD6298   EDGE #783959
0 !COLOUR Reddish_Brown                                           CODE  70   VALUE #582A12   EDGE #250E04
0 !COLOUR Light_Bluish_Gray                                       CODE  71   VALUE #A0A5A9   EDGE #54595D
0 !COLOUR Dark_Bluish_Gray                                        CODE  72   VALUE #6C6E68   EDGE #2E302D
0 !COLOUR Medium_Blue                                             CODE  73   VALUE #5A93DB   EDGE #284F80
0 !COLOUR Medium_Green                                            CODE  74   VALUE #73DCA1   EDGE #368257
0 !COLOUR Light_Pink                                              CODE  77   VALUE #FECCCF   EDGE #95787A
0 !COLOUR Light_Nougat                                            CODE  78   VALUE #F6D7B3   EDGE #907E69
0 !COLOUR Medium_Nougat                                           CODE  84   VALUE #AA7D55   EDGE #634932
0 !COLOUR Dark_Purple                                             CODE  85   VALUE #3F3691   EDGE #221D51
0 !COLOUR Dark_Brown                                              CODE  86   VALUE #352100   EDGE #1F1300
0 !COLOUR Royal_Blue                                              CODE  89   VALUE #4C61DB   EDGE #182470
0 !COLOUR Nougat                                                  CODE  92   VALUE #BB805A   EDGE #6E4B35
0 !COLOUR Rust                                                    CODE  95   VALUE #B31004   EDGE #690902
0 !COLOUR Medium_Lime                                             CODE 115   VALUE #C7D23C   EDGE #747B23
0 !COLOUR Aqua                                                    CODE 118   VALUE #B3D7D1   EDGE #697E7B
0 !COLOUR Light_Lime                                              CODE 120   VALUE #D9E4A7   EDGE #7F8662
0 !COLOUR Light_Orange                                            CODE 125   VALUE #F9A777   EDGE #926246
0 !COLOUR Very_Light_Bluish_Gray                                  CODE 151   VALUE #E4E8E8   EDGE #868888
0 !COLOUR Bright_Light_Orange                                     CODE 191   VALUE #F8BB3D   EDGE #926E24
0 !COLOUR Medium_Azure                                            CODE 212   VALUE #36AEBF   EDGE #0F4750
0 !COLOUR Dark_Azure                                              CODE 218   VALUE #078BC9   EDGE #004D73
0 !COLOUR Light_Aqua                                              CODE 219   VALUE #ADC3C0   EDGE #667271
0 !COLOUR Bright_Light_Yellow                                     CODE 226   VALUE #FFF03A   EDGE #968D22
0 !COLOUR Dark_Blue                                               CODE 272   VALUE #0A3463   EDGE #00132B
0 !COLOUR Dark_Green                                              CODE 288   VALUE #184632   EDGE #061D13
0 !COLOUR Maersk_Blue                                             CODE 313   VALUE #359BC3   EDGE #1F5B73
0 !COLOUR Dark_Red                                                CODE 320   VALUE #720E0F   EDGE #300203
0 !COLOUR Olive_Green                                             CODE 330   VALUE #9B945A   EDGE #5B5735
0 !COLOUR Sand_Red                                                CODE 335   VALUE #D67572   EDGE #7E4543
0 !COLOUR Earth_Orange                                            CODE 366   VALUE #FA9C1C   EDGE #935B10
0 !COLOUR Sand_Purple                                             CODE 373   VALUE #845E84   EDGE #4E374E
0 !COLOUR Sand_Green                                              CODE 378   VALUE #A0BCAC   EDGE #4E6859
0 !COLOUR Sand_Blue                                               CODE 379   VALUE #6074A1   EDGE #38445E
0 !COLOUR Fabuland_Brown                                          CODE 450   VALUE #B67B50   EDGE #6B482F
0 !COLOUR Medium_Orange                                           CODE 462   VALUE #FFA70F   EDGE #966209
0 !COLOUR Dark_Orange                                             CODE 484   VALUE #A95500   EDGE #633200
0 !COLOUR Very_Light_Gray                                         CODE 503   VALUE #E6E3DA   EDGE #878580

0 !COLOUR Trans_Black_IR                                          CODE  32   VALUE #635F52   EDGE #3B3830   ALPHA 128
0 !COLOUR Trans_Dark_Blue                                         CODE  33   VALUE #0020A0   EDGE #000E50   ALPHA 128
0 !COLOUR Trans_Green                                             CODE  34   VALUE #84B68D   EDGE #48664D   ALPHA 128
0 !COLOUR Trans_Bright_Green                                      CODE  35   VALUE #D9E4A7   EDGE #7F8662   ALPHA 128
0 !COLOUR Trans_Red                                               CODE  36   VALUE #C91A09   EDGE #600500   ALPHA 128
0 !COLOUR Trans_Dark_Pink                                         CODE  37   VALUE #DF6695   EDGE #833C57   ALPHA 128
0 !COLOUR Trans_Neon_Orange                                       CODE  38   VALUE #FF800D   EDGE #964B07   ALPHA 128
0 !COLOUR Trans_Very_Light_Blue                                   CODE  39   VALUE #C1DFF0   EDGE #72848E   ALPHA 128
0 !COLOUR Trans_Brown                                             CODE  40   VALUE #635F52   EDGE #3B3830   ALPHA 128
0 !COLOUR Trans_Medium_Blue                                       CODE  41   VALUE #559AB7   EDGE #325A6B   ALPHA 128
0 !COLOUR Trans_Neon_Green                                        CODE  42   VALUE #C0F500   EDGE #526A00   ALPHA 128
0 !COLOUR Trans_Light_Blue                                        CODE  43   VALUE #AEE9EF   EDGE #678A8D   ALPHA 128
0 !COLOUR Trans_Bright_Lilac                                      CODE  44   VALUE #96709F   EDGE #58425D   ALPHA 128
0 !COLOUR Trans_Pink                                              CODE  45   VALUE #FC97AC   EDGE #955462   ALPHA 128
0 !COLOUR Trans_Yellow                                            CODE  46   VALUE #F5CD2F   EDGE #785F00   ALPHA 128
0 !COLOUR Trans_Clear                                             CODE  47   VALUE #FCFCFC   EDGE #949494   ALPHA 128
0 !COLOUR Trans_Purple                                            CODE  52   VALUE #A5499C   EDGE #612B5C   ALPHA 128
0 !COLOUR Trans_Neon_Yellow                                       CODE  54   VALUE #DAB000   EDGE #806700   ALPHA 128
0 !COLOUR Trans_Orange                                            CODE  57   VALUE #F08F1C   EDGE #703A00   ALPHA 128
0 !COLOUR Trans_Light_Purple                                      CODE 232   VALUE #96709F   EDGE #58425D   ALPHA 128
0 !COLOUR Trans_Light_Blue_Fluor                                  CODE 284   VALUE #AEE9EF   EDGE #678A8D   ALPHA 128
0 !COLOUR Trans_Light_Green_Fluor                                 CODE 293   VALUE #C9E7B3   EDGE #768869   ALPHA 128

0 !COLOUR Chrome_Antique_Brass                                    CODE  60   VALUE #645A4C   EDGE #3B352D   CHROME
0 !COLOUR Chrome_Blue                                             CODE  61   VALUE #6C96BF   EDGE #3F5870   CHROME
0 !COLOUR Chrome_Green                                            CODE  62   VALUE #3CB371   EDGE #236942   CHROME
0 !COLOUR Chrome_Pink                                             CODE  63   VALUE #AA4D8E   EDGE #642D54   CHROME
0 !COLOUR Chrome_Black                                            CODE  64   VALUE #1B2A34   EDGE #000000   CHROME
0 !COLOUR Metallic_Silver                                         CODE  80   VALUE #A5A9B4   EDGE #4F525A   METAL
0 !COLOUR Metallic_Green                                          CODE  81   VALUE #899B5F   EDGE #515B38   METAL
0 !COLOUR Metallic_Gold                                           CODE  82   VALUE #DBAC34   EDGE #81651F   METAL
0 !COLOUR Metallic_Black                                          CODE  83   VALUE #1A1A1A   EDGE #333333   METAL
0 !COLOUR Metallic_Dark_Gray                                      CODE  87   VALUE #6D6E5C   EDGE #3E3F35   METAL
0 !COLOUR Pearl_Light_Gold                                        CODE 127   VALUE #DCBC81   EDGE #826E4C   PEARL
0 !COLOUR Copper                                                  CODE 134   VALUE #AE7A59   EDGE #664734   PEARL
0 !COLOUR Pearl_Light_Gray                                        CODE 135   VALUE #9CA3A8   EDGE #5C6063   PEARL
0 !COLOUR Pearl_Sand_Blue                                         CODE 137   VALUE #7988A1   EDGE #47505F   PEARL
0 !COLOUR Pearl_Dark_Gray                                         CODE 142   VALUE #575857   EDGE #333433   PEARL
0 !COLOUR Pearl_Very_Light_Gray                                   CODE 148   VALUE #BBBCB6   EDGE #6E6E6B   PEARL
0 !COLOUR Flat_Dark_Gold                                          CODE 178   VALUE #B48455   EDGE #6A4E32   PEARL
0 !COLOUR Flat_Silver                                             CODE 179   VALUE #898788   EDGE #514F50   PEARL
0 !COLOUR Pearl_White                                             CODE 183   VALUE #F2F3F2   EDGE #8E8F8E   PEARL
0 !COLOUR Pearl_Gold                                              CODE 297   VALUE #AA7F2E   EDGE #553D10   PEARL
0 !COLOUR Chrome_Gold                                             CODE 334   VALUE #BBA53D   EDGE #594D18   CHROME
0 !COLOUR Chrome_Silver                                           CODE 383   VALUE #E0E0E0   EDGE #707070   CHROME

0 !COLOUR Glow_In_Dark_Opaque                                     CODE  21   VALUE #D9E4A7   EDGE #7F8662   LUMINANCE 15
0 !COLOUR Rubber_Yellow                                           CODE  65   VALUE #F2CD37   EDGE #5F4B00   RUBBER
0 !COLOUR Rubber_Trans_Yellow                                     CODE  66   VALUE #F5CD2F   EDGE #785F00   ALPHA 128   RUBBER
0 !COLOUR Rubber_Trans_Clear                                      CODE  67   VALUE #FCFCFC   EDGE #949494   ALPHA 128   RUBBER
0 !COLOUR Milky_White                                             CODE  79   VALUE #EEEEEE   EDGE #8B8B8B   ALPHA 240
`;

/**
 * Parser integral para o padrão oficial LDConfig.ldr do LDraw
 */
export function parseLDConfig(content: string): LDrawColor[] {
  const colors: LDrawColor[] = [];
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith('0 !COLOUR')) continue;

    // Formato padrão: 0 !COLOUR Name CODE code VALUE hex EDGE edgeHex [ALPHA a] [LUMINANCE lum] [CHROME|PEARL|METAL|RUBBER]
    const parts = line.split(/\s+/);
    if (parts.length < 6) continue;

    const name = parts[2].replace(/_/g, ' ');
    const codeIndex = parts.indexOf('CODE');
    const valueIndex = parts.indexOf('VALUE');
    const edgeIndex = parts.indexOf('EDGE');
    const alphaIndex = parts.indexOf('ALPHA');

    if (codeIndex === -1 || valueIndex === -1) continue;

    const code = parseInt(parts[codeIndex + 1], 10);
    const hex = parts[valueIndex + 1];
    const edgeHex = edgeIndex !== -1 ? parts[edgeIndex + 1] : undefined;
    const isTrans = alphaIndex !== -1 || line.includes('Trans_') || line.includes('Trans ');

    let category: 'solid' | 'transparent' | 'metallic' | 'special' = 'solid';
    let finish: 'solid' | 'transparent' | 'chrome' | 'pearl' | 'metal' | 'rubber' | 'glow' = 'solid';

    if (isTrans) {
      category = 'transparent';
      finish = 'transparent';
    } else if (line.includes('CHROME')) {
      category = 'metallic';
      finish = 'chrome';
    } else if (line.includes('PEARL')) {
      category = 'metallic';
      finish = 'pearl';
    } else if (line.includes('METAL')) {
      category = 'metallic';
      finish = 'metal';
    } else if (line.includes('RUBBER')) {
      category = 'special';
      finish = 'rubber';
    } else if (line.includes('LUMINANCE') || line.includes('Glow')) {
      category = 'special';
      finish = 'glow';
    } else if (line.includes('Milky')) {
      category = 'special';
      finish = 'glow';
    }

    colors.push({
      code,
      name,
      hex,
      edgeHex,
      category,
      finish,
      isTrans,
    });
  }

  return colors;
}

// Inicializar lista oficial completa de cores a partir do padrão LDConfig
export const LDRAW_COLORS: LDrawColor[] = parseLDConfig(RAW_LDCONFIG_TEXT);

/**
 * Busca uma cor LDraw oficial por código numérico
 */
export function getLDrawColor(code: number): LDrawColor {
  const color = LDRAW_COLORS.find((c) => c.code === code);
  return color || LDRAW_COLORS.find((c) => c.code === 4) || LDRAW_COLORS[0];
}

/**
 * Gera as diretivas !COLOUR para o parser LDrawLoader
 */
export function generateLDConfigDirectives(): string {
  return LDRAW_COLORS.map((c) => {
    const trans = c.isTrans ? ' ALPHA 128' : '';
    const edge = c.edgeHex ? ` EDGE ${c.edgeHex}` : '';
    const finish = c.finish === 'chrome' ? ' CHROME' : c.finish === 'pearl' ? ' PEARL' : c.finish === 'metal' ? ' METAL' : '';
    return `0 !COLOUR ${c.name.replace(/\s+/g, '_')} CODE ${c.code} VALUE ${c.hex}${edge}${trans}${finish}`;
  }).join('\n');
}
