/**
 * Shape Identification Utility
 * Identifies shapes on canvas using natural language descriptors
 * Supports: color names, type keywords, color+type combos, recency bias, "all X" queries
 */

import { toHex, isValidColor } from './colorNormalizer';

// Shape type aliases (support both internal and user-friendly names)
const TYPE_ALIASES = {
  rectangle: 'rect',
  rect: 'rect',
  square: 'rect', // Treat square as rectangle (can check width === height later)
  circle: 'circle',
  text: 'text',
  triangle: 'triangle',
};

/**
 * Color families map - groups similar colors together
 * Each family contains CSS color keywords and hex values that belong to that family
 */
const COLOR_FAMILIES = {
  red: [
    '#ff0000', '#ff0000', '#8b0000', '#b22222', '#dc143c', '#ff1493', '#ff6347', 
    '#ff4500', '#cd5c5c', '#f08080', '#e9967a', '#fa8072', '#ffa07a', '#ff7f50',
    '#bc8f8f', '#db7093', '#c71585', '#ff69b4', '#ffb6c1', '#ffc0cb', '#ffe4e1',
  ],
  blue: [
    '#0000ff', '#00008b', '#0000cd', '#4169e1', '#1e90ff', '#00bfff', '#87ceeb',
    '#87cefa', '#4682b4', '#5f9ea0', '#b0c4de', '#add8e6', '#b0e0e6', '#afeeee',
    '#00ced1', '#48d1cc', '#40e0d0', '#00ffff', '#e0ffff', '#6495ed', '#7b68ee',
    '#6a5acd', '#483d8b', '#191970', '#000080', '#00008b',
  ],
  green: [
    '#008000', '#006400', '#228b22', '#2e8b57', '#3cb371', '#90ee90', '#98fb98',
    '#8fbc8f', '#00ff00', '#32cd32', '#00fa9a', '#00ff7f', '#7fff00', '#7cfc00',
    '#adff2f', '#9acd32', '#556b2f', '#6b8e23', '#808000', '#20b2aa',
  ],
  yellow: [
    '#ffff00', '#ffd700', '#daa520', '#f0e68c', '#eee8aa', '#bdb76b', '#fafad2',
    '#fffacd', '#ffffe0', '#ffff00', '#ffefd5', '#ffe4b5', '#ffdab9', '#f5deb3',
  ],
  orange: [
    '#ffa500', '#ff8c00', '#ff7f50', '#ff6347', '#ff4500', '#d2691e', '#cd853f',
    '#deb887', '#f4a460', '#d2b48c', '#ffdab9', '#ffe4c4',
  ],
  purple: [
    '#800080', '#9400d3', '#9932cc', '#ba55d3', '#8a2be2', '#9370db', '#663399',
    '#8b008b', '#4b0082', '#da70d6', '#ee82ee', '#dda0dd', '#d8bfd8', '#e6e6fa',
    '#ff00ff', '#c71585',
  ],
  pink: [
    '#ffc0cb', '#ffb6c1', '#ff69b4', '#ff1493', '#db7093', '#c71585', '#ff00ff',
    '#da70d6', '#dda0dd', '#ffe4e1', '#fff0f5',
  ],
  brown: [
    '#a52a2a', '#8b4513', '#d2691e', '#cd853f', '#f4a460', '#deb887', '#d2b48c',
    '#bc8f8f', '#a0522d',
  ],
  gray: [
    '#808080', '#a9a9a9', '#c0c0c0', '#d3d3d3', '#dcdcdc', '#696969', '#778899',
    '#708090', '#2f4f4f', '#000000', '#ffffff',
  ],
  grey: [ // Support both spellings
    '#808080', '#a9a9a9', '#c0c0c0', '#d3d3d3', '#dcdcdc', '#696969', '#778899',
    '#708090', '#2f4f4f', '#000000', '#ffffff',
  ],
  black: ['#000000', '#2f4f4f', '#696969'],
  white: ['#ffffff', '#fffafa', '#f5f5f5', '#fffff0', '#fafafa', '#f8f8ff'],
  cyan: ['#00ffff', '#00ced1', '#48d1cc', '#40e0d0', '#7fffd4', '#66cdaa'],
  teal: ['#008080', '#20b2aa', '#48d1cc', '#5f9ea0'],
  lime: ['#00ff00', '#32cd32', '#7fff00', '#7cfc00', '#adff2f'],
  indigo: ['#4b0082', '#483d8b', '#191970'],
};

/**
 * Convert hex to HSL for more sophisticated color matching
 * @param {string} hex - 6-digit hex color
 * @returns {object} - { h, s, l } values
 */
function hexToHSL(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Check if a color matches a color family
 * @param {string} shapeColor - Shape's fill color (hex)
 * @param {string} queryColor - Query color (name or hex)
 * @param {number} tolerance - HSL hue tolerance in degrees
 * @returns {boolean}
 */
function isColorMatch(shapeColor, queryColor, tolerance = 30) {
  try {
    // Normalize both colors to hex
    const shapeHex = toHex(shapeColor).toLowerCase();
    const queryHex = toHex(queryColor).toLowerCase();
    
    // Exact match
    if (shapeHex === queryHex) return true;
    
    // Check color families
    const queryLower = queryColor.toLowerCase().trim();
    if (COLOR_FAMILIES[queryLower]) {
      const family = COLOR_FAMILIES[queryLower];
      if (family.includes(shapeHex)) return true;
    }
    
    // HSL-based matching for colors not in families
    const shapeHSL = hexToHSL(shapeHex);
    const queryHSL = hexToHSL(queryHex);
    
    // Calculate hue difference (circular distance)
    let hueDiff = Math.abs(shapeHSL.h - queryHSL.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;
    
    // Match if hue is within tolerance and saturation/lightness are reasonable
    const satDiff = Math.abs(shapeHSL.s - queryHSL.s);
    const lightDiff = Math.abs(shapeHSL.l - queryHSL.l);
    
    return hueDiff <= tolerance && satDiff <= 40 && lightDiff <= 40;
  } catch (error) {
    // If color parsing fails, no match
    return false;
  }
}

/**
 * Check if a shape type matches the query type
 * @param {string} shapeType - Shape's type ('rect', 'circle', etc.)
 * @param {string} queryType - Query type (may include aliases like 'rectangle', 'square')
 * @returns {boolean}
 */
function isTypeMatch(shapeType, queryType) {
  const normalizedQuery = queryType.toLowerCase().trim();
  const mappedType = TYPE_ALIASES[normalizedQuery];
  
  if (!mappedType) return false;
  return shapeType === mappedType;
}

/**
 * Parse natural language descriptor into filter criteria
 * @param {string} descriptor - Natural language description
 * @returns {object} - { color, type, returnAll, tokens }
 */
function parseDescriptor(descriptor) {
  if (!descriptor || typeof descriptor !== 'string') {
    return { color: null, type: null, returnAll: false, tokens: [] };
  }
  
  // Tokenize: lowercase, split by spaces, filter empty
  const tokens = descriptor
    .toLowerCase()
    .trim()
    .replace(/[,;.!?]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(t => t.length > 0);
  
  let color = null;
  let type = null;
  let returnAll = false;
  
  // Check for "all" keyword
  if (tokens.includes('all')) {
    returnAll = true;
  }
  
  // Check for type keywords
  for (const token of tokens) {
    if (TYPE_ALIASES[token]) {
      type = token;
      break;
    }
    // Also check plurals (circles -> circle)
    const singular = token.endsWith('s') ? token.slice(0, -1) : token;
    if (TYPE_ALIASES[singular]) {
      type = singular;
      break;
    }
  }
  
  // Check for color keywords or hex
  for (const token of tokens) {
    // Check if it's a hex color
    if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(token)) {
      const hex = token.startsWith('#') ? token : '#' + token;
      try {
        color = toHex(hex);
        break;
      } catch (e) {
        // Invalid hex, continue
      }
    }
    
    // Check if it's a color family or CSS keyword
    if (COLOR_FAMILIES[token] || isValidColor(token)) {
      color = token;
      break;
    }
  }
  
  return { color, type, returnAll, tokens };
}

/**
 * Calculate score for a shape match
 * Higher score = better match
 * @param {object} shape - Shape object
 * @param {object} criteria - { color, type }
 * @param {number} currentTime - Current timestamp for recency bias
 * @returns {number} - Match score
 */
function calculateScore(shape, criteria, currentTime) {
  let score = 0;
  
  // Color match (weight: 2)
  if (criteria.color) {
    if (isColorMatch(shape.fill, criteria.color)) {
      score += 2;
    } else {
      return -1; // No match
    }
  }
  
  // Type match (weight: 1)
  if (criteria.type) {
    if (isTypeMatch(shape.type, criteria.type)) {
      score += 1;
    } else {
      return -1; // No match
    }
  }
  
  // Recency bias (weight: 0-1, newer shapes get higher scores)
  // Use zIndex as a proxy for creation time (higher zIndex = more recent)
  const zIndex = shape.zIndex || 0;
  const recencyWeight = zIndex / 1000000000000; // Normalize to 0-1 range
  score += recencyWeight;
  
  return score;
}

/**
 * Custom error for shape not found scenarios
 */
export class ShapeNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ShapeNotFoundError';
  }
}

/**
 * Identify shapes on canvas using natural language descriptors
 * 
 * @param {Array} shapes - Array of shape objects from canvas
 * @param {string} descriptor - Natural language description (e.g., "blue rectangle", "all circles", "red")
 * @param {object} options - Configuration options
 * @param {boolean} options.allowPartial - If false, throw error when no match found
 * @param {number} options.colorTolerance - HSL hue tolerance for color matching (default: 30)
 * @param {boolean} options.returnMany - Force return array (overrides descriptor "all" keyword)
 * @returns {object|Array|null} - Single shape object, array of shapes, or null
 * @throws {ShapeNotFoundError} - If no match found and allowPartial is false
 * 
 * @example
 * // Find single shape
 * identifyShape(shapes, "blue rectangle") // => { id: '123', type: 'rect', fill: '#0000ff', ... }
 * 
 * // Find all matching shapes
 * identifyShape(shapes, "all blue circles") // => [{ ... }, { ... }]
 * 
 * // Use options
 * identifyShape(shapes, "green", { returnMany: true }) // => [{ ... }, { ... }]
 */
export function identifyShape(shapes, descriptor, options = {}) {
  const {
    allowPartial = true,
    colorTolerance = 30,
    returnMany = undefined,
  } = options;
  
  // Validate inputs
  if (!Array.isArray(shapes)) {
    throw new TypeError('shapes must be an array');
  }
  
  if (!descriptor || typeof descriptor !== 'string') {
    throw new TypeError('descriptor must be a non-empty string');
  }
  
  // Parse descriptor
  const criteria = parseDescriptor(descriptor);
  const shouldReturnMany = returnMany !== undefined ? returnMany : criteria.returnAll;
  
  // If no criteria extracted, return error or empty
  if (!criteria.color && !criteria.type) {
    if (!allowPartial) {
      throw new ShapeNotFoundError(
        `Could not parse descriptor: "${descriptor}". Please specify a color, type, or both.`
      );
    }
    return shouldReturnMany ? [] : null;
  }
  
  // Score all shapes
  const currentTime = Date.now();
  const scoredShapes = shapes
    .map(shape => ({
      shape,
      score: calculateScore(shape, criteria, currentTime),
    }))
    .filter(item => item.score >= 0) // Remove non-matches
    .sort((a, b) => b.score - a.score); // Sort by score descending
  
  // No matches found
  if (scoredShapes.length === 0) {
    if (!allowPartial) {
      const colorStr = criteria.color ? `color "${criteria.color}"` : '';
      const typeStr = criteria.type ? `type "${criteria.type}"` : '';
      const and = criteria.color && criteria.type ? ' and ' : '';
      throw new ShapeNotFoundError(
        `No shapes found matching ${colorStr}${and}${typeStr}`
      );
    }
    return shouldReturnMany ? [] : null;
  }
  
  // Return results
  if (shouldReturnMany) {
    return scoredShapes.map(item => item.shape);
  } else {
    // Return highest scoring shape (most recent if tied)
    return scoredShapes[0].shape;
  }
}

/**
 * Helper: Identify shape by ID (pass-through for consistency)
 * @param {Array} shapes - Array of shape objects
 * @param {string} id - Shape ID
 * @returns {object|null} - Shape object or null
 */
export function identifyShapeById(shapes, id) {
  return shapes.find(s => s.id === id) || null;
}

/**
 * Helper: Get all shapes of a specific type
 * @param {Array} shapes - Array of shape objects
 * @param {string} type - Shape type
 * @returns {Array} - Array of matching shapes
 */
export function identifyShapesByType(shapes, type) {
  const normalizedType = TYPE_ALIASES[type.toLowerCase()] || type;
  return shapes.filter(s => s.type === normalizedType);
}

/**
 * Helper: Get all shapes of a specific color
 * @param {Array} shapes - Array of shape objects
 * @param {string} color - Color name or hex
 * @param {number} tolerance - Color matching tolerance
 * @returns {Array} - Array of matching shapes
 */
export function identifyShapesByColor(shapes, color, tolerance = 30) {
  return shapes.filter(s => isColorMatch(s.fill, color, tolerance));
}

