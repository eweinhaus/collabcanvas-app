/**
 * Color Normalizer Utility
 * 
 * Converts various color formats (hex, rgb, hsl, CSS color names) to
 * a canonical hex format (#RRGGBB) for consistent storage and rendering.
 */

/**
 * Map of common CSS color names to hex values
 * Includes all basic CSS color keywords
 */
const CSS_COLOR_NAMES = {
  // Reds
  red: '#ff0000',
  darkred: '#8b0000',
  crimson: '#dc143c',
  indianred: '#cd5c5c',
  lightcoral: '#f08080',
  salmon: '#fa8072',
  darksalmon: '#e9967a',
  lightsalmon: '#ffa07a',
  
  // Oranges
  orange: '#ffa500',
  darkorange: '#ff8c00',
  coral: '#ff7f50',
  tomato: '#ff6347',
  orangered: '#ff4500',
  
  // Yellows
  yellow: '#ffff00',
  gold: '#ffd700',
  lightyellow: '#ffffe0',
  lemonchiffon: '#fffacd',
  khaki: '#f0e68c',
  
  // Greens
  green: '#008000',
  darkgreen: '#006400',
  lime: '#00ff00',
  limegreen: '#32cd32',
  lightgreen: '#90ee90',
  springgreen: '#00ff7f',
  mediumspringgreen: '#00fa9a',
  seagreen: '#2e8b57',
  forestgreen: '#228b22',
  olive: '#808000',
  olivedrab: '#6b8e23',
  
  // Blues
  blue: '#0000ff',
  darkblue: '#00008b',
  mediumblue: '#0000cd',
  navy: '#000080',
  lightblue: '#add8e6',
  skyblue: '#87ceeb',
  deepskyblue: '#00bfff',
  steelblue: '#4682b4',
  dodgerblue: '#1e90ff',
  cornflowerblue: '#6495ed',
  cadetblue: '#5f9ea0',
  
  // Purples
  purple: '#800080',
  indigo: '#4b0082',
  darkviolet: '#9400d3',
  violet: '#ee82ee',
  plum: '#dda0dd',
  magenta: '#ff00ff',
  fuchsia: '#ff00ff',
  orchid: '#da70d6',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  
  // Pinks
  pink: '#ffc0cb',
  lightpink: '#ffb6c1',
  hotpink: '#ff69b4',
  deeppink: '#ff1493',
  
  // Browns
  brown: '#a52a2a',
  saddlebrown: '#8b4513',
  sienna: '#a0522d',
  chocolate: '#d2691e',
  peru: '#cd853f',
  tan: '#d2b48c',
  
  // Grays
  black: '#000000',
  gray: '#808080',
  grey: '#808080',
  silver: '#c0c0c0',
  white: '#ffffff',
  darkgray: '#a9a9a9',
  darkgrey: '#a9a9a9',
  lightgray: '#d3d3d3',
  lightgrey: '#d3d3d3',
  dimgray: '#696969',
  dimgrey: '#696969',
  
  // Cyans
  cyan: '#00ffff',
  aqua: '#00ffff',
  turquoise: '#40e0d0',
  aquamarine: '#7fffd4',
  teal: '#008080'
};

/**
 * Normalize a 3-character hex code to 6 characters
 * @param {string} hex - 3-character hex code (e.g., '#abc')
 * @returns {string} 6-character hex code (e.g., '#aabbcc')
 */
const expandShortHex = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  return hex.replace(shorthandRegex, (m, r, g, b) => {
    return '#' + r + r + g + g + b + b;
  });
};

/**
 * Parse RGB/RGBA color string
 * @param {string} rgb - RGB/RGBA string (e.g., 'rgb(255, 0, 0)' or 'rgba(255, 0, 0, 0.5)')
 * @returns {string} Hex color code
 */
const parseRgb = (rgb) => {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (!match) {
    throw new Error(`Invalid RGB format: ${rgb}`);
  }

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  // Validate RGB values
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error(`Invalid RGB values: (${r}, ${g}, ${b}). Values must be 0-255.`);
  }

  // Convert to hex
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Parse HSL/HSLA color string
 * @param {string} hsl - HSL/HSLA string (e.g., 'hsl(0, 100%, 50%)')
 * @returns {string} Hex color code
 */
const parseHsl = (hsl) => {
  const match = hsl.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/);
  if (!match) {
    throw new Error(`Invalid HSL format: ${hsl}`);
  }

  let h = parseInt(match[1], 10);
  let s = parseInt(match[2], 10);
  let l = parseInt(match[3], 10);

  // Normalize values
  h = h % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  // Convert HSL to RGB
  const hslToRgb = (h, s, l) => {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h / 360 + 1 / 3);
      g = hue2rgb(p, q, h / 360);
      b = hue2rgb(p, q, h / 360 - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  const [r, g, b] = hslToRgb(h, s, l);
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Validate hex color format
 * @param {string} hex - Hex color code
 * @returns {boolean}
 */
const isValidHex = (hex) => {
  return /^#[0-9A-F]{6}$/i.test(hex);
};

/**
 * Normalize any color format to canonical hex (#RRGGBB)
 * @param {string} color - Color in any supported format
 * @returns {string} Normalized hex color (#RRGGBB)
 * @throws {Error} If color format is invalid
 */
export const normalizeColor = (color) => {
  if (!color || typeof color !== 'string') {
    throw new Error('Color must be a non-empty string');
  }

  // Trim and lowercase for comparison
  const trimmed = color.trim();
  const lower = trimmed.toLowerCase();

  // Check if it's a CSS color name
  if (CSS_COLOR_NAMES[lower]) {
    return CSS_COLOR_NAMES[lower];
  }

  // Check if it's already a valid 6-digit hex
  if (isValidHex(trimmed)) {
    return trimmed.toLowerCase();
  }

  // Check if it's a 3-digit hex and expand it
  if (/^#[0-9A-F]{3}$/i.test(trimmed)) {
    return expandShortHex(trimmed).toLowerCase();
  }

  // Check if it's hex without # prefix
  if (/^[0-9A-F]{6}$/i.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }

  if (/^[0-9A-F]{3}$/i.test(trimmed)) {
    return expandShortHex(`#${trimmed}`).toLowerCase();
  }

  // Check if it's RGB/RGBA
  if (lower.startsWith('rgb')) {
    return parseRgb(lower);
  }

  // Check if it's HSL/HSLA
  if (lower.startsWith('hsl')) {
    return parseHsl(lower);
  }

  throw new Error(`Unsupported color format: ${color}`);
};

/**
 * Check if a color string is valid
 * @param {string} color - Color to validate
 * @returns {boolean}
 */
export const isValidColor = (color) => {
  try {
    normalizeColor(color);
    return true;
  } catch {
    return false;
  }
};

export default normalizeColor;

