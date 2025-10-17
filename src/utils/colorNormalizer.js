/**
 * Color Normalizer Utility
 * Converts CSS color names, hex, rgb, rgba, hsl, hsla to normalized hex format
 */

// CSS Color Keywords Map (140 standard colors)
const CSS_COLOR_KEYWORDS = {
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#00ffff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000000',
  blanchedalmond: '#ffebcd',
  blue: '#0000ff',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgrey: '#a9a9a9',
  darkgreen: '#006400',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  grey: '#808080',
  green: '#008000',
  greenyellow: '#adff2f',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgrey: '#d3d3d3',
  lightgreen: '#90ee90',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#ff0000',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#ffffff',
  whitesmoke: '#f5f5f5',
  yellow: '#ffff00',
  yellowgreen: '#9acd32',
};

/**
 * Validates if a string is a valid color format
 * @param {string} color - Color string to validate
 * @returns {boolean}
 */
export function isValidColor(color) {
  if (!color || typeof color !== 'string') return false;

  const trimmed = color.trim().toLowerCase();

  // Check hex format (#fff or #ffffff)
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return true;

  // Check CSS keyword
  if (CSS_COLOR_KEYWORDS[trimmed]) return true;

  // Check rgb/rgba format (allow negative and large numbers, will be clamped)
  if (/^rgba?\(\s*-?\d+\s*,\s*-?\d+\s*,\s*-?\d+\s*(,\s*[\d.]+\s*)?\)$/i.test(trimmed)) return true;

  // Check hsl/hsla format
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/i.test(trimmed)) return true;

  return false;
}

/**
 * Converts 3-digit hex to 6-digit hex
 * @param {string} hex - 3-digit hex color (e.g., "#fff")
 * @returns {string} - 6-digit hex color (e.g., "#ffffff")
 */
function expandHex(hex) {
  const chars = hex.substring(1); // Remove #
  if (chars.length === 3) {
    return '#' + chars.split('').map(c => c + c).join('');
  }
  return hex;
}

/**
 * Converts RGB values to hex
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} - Hex color
 */
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Converts HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {object} - {r, g, b} values (0-255)
 */
function hslToRgb(h, s, l) {
  h = h % 360;
  s = s / 100;
  l = l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Converts any valid color format to 6-digit lowercase hex
 * @param {string} color - Color in any supported format
 * @returns {string} - 6-digit hex color (e.g., "#ff0000")
 * @throws {Error} - If color format is invalid
 */
export function toHex(color) {
  if (!color || typeof color !== 'string') {
    throw new Error('Invalid color: must be a non-empty string');
  }

  const trimmed = color.trim().toLowerCase();

  // Handle hex format
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return expandHex(trimmed).toLowerCase();
  }

  // Handle CSS keyword
  if (CSS_COLOR_KEYWORDS[trimmed]) {
    return CSS_COLOR_KEYWORDS[trimmed];
  }

  // Handle rgb/rgba format (allow negative and large numbers)
  const rgbMatch = trimmed.match(/^rgba?\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (rgbMatch) {
    const [, r, g, b, a] = rgbMatch;
    
    // Reject if alpha is present and not 1
    if (a !== undefined && parseFloat(a) !== 1) {
      throw new Error('Colors with alpha transparency (rgba) are not supported. Use opaque colors only.');
    }
    
    return rgbToHex(parseInt(r), parseInt(g), parseInt(b));
  }

  // Handle hsl/hsla format
  const hslMatch = trimmed.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (hslMatch) {
    const [, h, s, l, a] = hslMatch;
    
    // Reject if alpha is present and not 1
    if (a !== undefined && parseFloat(a) !== 1) {
      throw new Error('Colors with alpha transparency (hsla) are not supported. Use opaque colors only.');
    }
    
    const rgb = hslToRgb(parseInt(h), parseInt(s), parseInt(l));
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  throw new Error(`Invalid color format: "${color}". Supported formats: hex (#fff, #ffffff), CSS keywords (red, blue, etc.), rgb(r, g, b), hsl(h, s%, l%)`);
}

/**
 * Normalizes a color to a standard hex format
 * @param {string} color - Color in any supported format
 * @returns {object} - { ok: true, hex: string } or throws error
 * @throws {Error} - If color is invalid
 */
export function normalizeColor(color) {
  try {
    const hex = toHex(color);
    return { ok: true, hex };
  } catch (error) {
    throw error;
  }
}

/**
 * Safely normalizes a color, returning an error object instead of throwing
 * @param {string} color - Color in any supported format
 * @returns {object} - { ok: true, hex: string } or { ok: false, error: string }
 */
export function normalizeColorSafe(color) {
  try {
    const hex = toHex(color);
    return { ok: true, hex };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

