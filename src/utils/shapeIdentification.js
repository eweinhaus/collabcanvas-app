/**
 * Shape Identification Utility
 * 
 * Finds shapes on the canvas based on natural language descriptors
 * like color, type, position, or recency.
 */

import { normalizeColor } from './colorNormalizer';

/**
 * Check if a hex color matches a color family/name
 * @param {string} hexColor - Hex color code (e.g., '#ff0000')
 * @param {string} colorName - Color name (e.g., 'red', 'blue')
 * @returns {boolean} True if hex color is in the color family
 */
export const matchesColorFamily = (hexColor, colorName) => {
  if (!hexColor || !colorName) return false;

  const hex = hexColor.toLowerCase();
  const name = colorName.toLowerCase();

  // Try to normalize the color name to hex for exact comparison
  let normalizedTarget;
  try {
    normalizedTarget = normalizeColor(name);
    // If we can normalize both, do a direct comparison
    if (hex === normalizedTarget) return true;
  } catch {
    // If normalization fails, continue with pattern matching
  }

  // Extract RGB components from hex
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  // Pattern matching for color families
  switch (name) {
    case 'red':
      return r > 150 && g < 100 && b < 100;
    
    case 'blue':
      return r < 100 && g < 200 && b > 150;
    
    case 'green':
      return r < 100 && g > 150 && b < 100;
    
    case 'yellow':
      return r > 200 && g > 200 && b < 100;
    
    case 'orange':
      return r > 200 && g > 100 && g < 200 && b < 100;
    
    case 'purple':
    case 'violet':
      return r > 100 && g < 150 && b > 150;
    
    case 'pink':
      return r > 200 && g < 150 && b > 150;
    
    case 'brown':
      return r > 100 && r < 200 && g > 30 && g < 150 && b > 10 && b < 100;
    
    case 'gray':
    case 'grey':
      const avg = (r + g + b) / 3;
      const variance = Math.abs(r - avg) + Math.abs(g - avg) + Math.abs(b - avg);
      return variance < 30 && avg > 50 && avg < 200;
    
    case 'black':
      return r < 50 && g < 50 && b < 50;
    
    case 'white':
      return r > 200 && g > 200 && b > 200;
    
    case 'cyan':
    case 'aqua':
      return r < 100 && g > 150 && b > 150;
    
    case 'magenta':
    case 'fuchsia':
      return r > 150 && g < 100 && b > 150;
    
    default:
      return false;
  }
};

/**
 * Find shapes by color
 * @param {Array} shapes - Array of shape objects
 * @param {string} color - Color name or hex code
 * @returns {Array} Matching shapes
 */
export const findByColor = (shapes, color) => {
  if (!shapes || !color) return [];

  return shapes.filter((shape) => {
    const shapeColor = shape.fill || shape.color;
    if (!shapeColor) return false;

    // Try exact match first (for hex codes)
    if (shapeColor.toLowerCase() === color.toLowerCase()) return true;

    // Try color family matching
    return matchesColorFamily(shapeColor, color);
  });
};

/**
 * Find shapes by type
 * @param {Array} shapes - Array of shape objects
 * @param {string} type - Shape type (circle, rectangle, text, triangle)
 * @returns {Array} Matching shapes
 */
export const findByType = (shapes, type) => {
  if (!shapes || !type) return [];

  const normalizedType = type.toLowerCase();
  
  // Handle aliases
  const typeAliases = {
    'rect': 'rectangle',
    'square': 'rectangle',
    'box': 'rectangle',
  };

  const targetType = typeAliases[normalizedType] || normalizedType;

  return shapes.filter((shape) => {
    return shape.type && shape.type.toLowerCase() === targetType;
  });
};

/**
 * Find shapes by both color and type
 * @param {Array} shapes - Array of shape objects
 * @param {string} color - Color name or hex code
 * @param {string} type - Shape type
 * @returns {Array} Matching shapes
 */
export const findByColorAndType = (shapes, color, type) => {
  if (!shapes) return [];
  
  const colorMatches = color ? findByColor(shapes, color) : shapes;
  const typeMatches = type ? findByType(shapes, type) : shapes;
  
  // Return intersection
  return colorMatches.filter((shape) => typeMatches.includes(shape));
};

/**
 * Calculate distance between two points
 * @param {number} x1 - First point x
 * @param {number} y1 - First point y
 * @param {number} x2 - Second point x
 * @param {number} y2 - Second point y
 * @returns {number} Distance
 */
const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Find shape closest to a position
 * @param {Array} shapes - Array of shape objects
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Object|null} Closest shape or null
 */
export const findNearestToPosition = (shapes, x, y) => {
  if (!shapes || shapes.length === 0) return null;

  let nearest = null;
  let minDistance = Infinity;

  for (const shape of shapes) {
    const dist = distance(shape.x, shape.y, x, y);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = shape;
    }
  }

  return nearest;
};

/**
 * Find shape by ID
 * @param {Array} shapes - Array of shape objects
 * @param {string} id - Shape ID
 * @returns {Object|null} Shape or null
 */
export const findById = (shapes, id) => {
  if (!shapes || !id) return null;
  return shapes.find((shape) => shape.id === id) || null;
};

/**
 * Find the most recently created shape
 * @param {Array} shapes - Array of shape objects (assumed sorted by recency)
 * @returns {Object|null} Most recent shape or null
 */
export const findMostRecent = (shapes) => {
  if (!shapes || shapes.length === 0) return null;
  
  // If shapes have isRecent flag, use it
  const recentShape = shapes.find((s) => s.isRecent);
  if (recentShape) return recentShape;
  
  // Otherwise, return first shape (assuming sorted)
  return shapes[0];
};

/**
 * Identify shape(s) from a natural language descriptor
 * 
 * @param {Array} shapes - Array of shape objects from canvas state
 * @param {Object} descriptor - Descriptor object with optional properties:
 *   - id: Specific shape ID
 *   - color: Color name or hex
 *   - type: Shape type (circle, rectangle, text, triangle)
 *   - position: {x, y} coordinates
 *   - index: Which shape to select if multiple matches (0 = first/most recent)
 *   - all: Boolean - return all matches instead of just first
 * 
 * @returns {Object} Result object:
 *   - success: Boolean
 *   - shape: Matched shape (if single match or all=false)
 *   - shapes: Array of matched shapes (if all=true)
 *   - count: Number of matches
 *   - error: Error message (if failed)
 */
export const identifyShape = (shapes, descriptor = {}) => {
  // Input validation
  if (!shapes || !Array.isArray(shapes)) {
    return {
      success: false,
      error: 'Invalid shapes array',
      count: 0,
    };
  }

  if (shapes.length === 0) {
    return {
      success: false,
      error: 'No shapes on canvas',
      count: 0,
    };
  }

  // If ID is provided, use it directly
  if (descriptor.id) {
    const shape = findById(shapes, descriptor.id);
    if (shape) {
      return {
        success: true,
        shape,
        shapes: [shape],
        count: 1,
      };
    } else {
      return {
        success: false,
        error: `Shape with ID "${descriptor.id}" not found`,
        count: 0,
      };
    }
  }

  let candidates = [...shapes];

  // Filter by color if specified
  if (descriptor.color) {
    candidates = findByColor(candidates, descriptor.color);
    if (candidates.length === 0) {
      return {
        success: false,
        error: `No ${descriptor.color} shapes found`,
        count: 0,
      };
    }
  }

  // Filter by type if specified
  if (descriptor.type) {
    candidates = findByType(candidates, descriptor.type);
    if (candidates.length === 0) {
      const colorMsg = descriptor.color ? ` ${descriptor.color}` : '';
      return {
        success: false,
        error: `No${colorMsg} ${descriptor.type} shapes found`,
        count: 0,
      };
    }
  }

  // Filter by position if specified
  if (descriptor.position && typeof descriptor.position.x === 'number' && typeof descriptor.position.y === 'number') {
    const nearest = findNearestToPosition(candidates, descriptor.position.x, descriptor.position.y);
    if (nearest) {
      return {
        success: true,
        shape: nearest,
        shapes: [nearest],
        count: 1,
      };
    } else {
      return {
        success: false,
        error: 'No shapes near specified position',
        count: 0,
      };
    }
  }

  // If 'all' flag is set, return all matches
  if (descriptor.all) {
    return {
      success: true,
      shapes: candidates,
      count: candidates.length,
    };
  }

  // Select shape by index (default 0 = most recent)
  const index = descriptor.index || 0;
  
  if (index >= candidates.length) {
    return {
      success: false,
      error: `Index ${index} out of range (${candidates.length} matches found)`,
      count: candidates.length,
      shapes: candidates,
    };
  }

  // Return the indexed shape
  return {
    success: true,
    shape: candidates[index],
    shapes: candidates,
    count: candidates.length,
  };
};

/**
 * Build a descriptor from natural language query
 * This is a helper that could be enhanced in the future with NLP
 * 
 * @param {string} query - Natural language query (e.g., "the blue rectangle", "all circles")
 * @returns {Object} Descriptor object
 */
export const parseQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return {};
  }

  const lower = query.toLowerCase().trim();
  const descriptor = {};

  // Check for "all" keyword
  if (lower.includes('all ')) {
    descriptor.all = true;
  }

  // Common color names
  const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey', 'black', 'white', 'cyan', 'magenta'];
  for (const color of colors) {
    if (lower.includes(color)) {
      descriptor.color = color;
      break;
    }
  }

  // Common shape types
  const types = ['circle', 'rectangle', 'rect', 'square', 'triangle', 'text'];
  for (const type of types) {
    if (lower.includes(type)) {
      descriptor.type = type;
      break;
    }
  }

  return descriptor;
};

export default {
  identifyShape,
  findByColor,
  findByType,
  findByColorAndType,
  findNearestToPosition,
  findById,
  findMostRecent,
  matchesColorFamily,
  parseQuery,
};

