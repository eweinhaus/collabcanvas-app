/**
 * Batch Create Utilities
 * Helpers for creating multiple shapes in complex layouts
 * Used by createShapesVertically and createShapesHorizontally executors
 */

import { normalizeColor } from './colorNormalizer';
import { SHAPE_TYPES } from './shapes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default values for shape properties
 */
const DEFAULTS = {
  rectangle: { width: 150, height: 100 },
  circle: { radius: 50 },
  triangle: { width: 100, height: 100 },
  text: { fontSize: 16, width: 200, height: 30 },
  spacing: {
    vertical: 25,
    horizontal: 20,
  },
  minSpacing: 5,
  maxSpacing: 500,
  minSize: 10,
  maxSize: 500,
};

/**
 * Normalize a shape specification with defaults and validation
 * Fills missing properties, validates ranges, normalizes colors
 * @param {Object} shapeSpec - Raw shape specification from AI
 * @param {string} shapeSpec.type - Shape type (rectangle, circle, triangle, text)
 * @param {string} shapeSpec.color - Color (hex, CSS keyword, rgb, hsl)
 * @param {number} [shapeSpec.width] - Width for rectangles/text
 * @param {number} [shapeSpec.height] - Height for rectangles/text
 * @param {number} [shapeSpec.radius] - Radius for circles/triangles
 * @param {string} [shapeSpec.text] - Text content for text shapes
 * @param {number} [shapeSpec.fontSize] - Font size for text shapes
 * @param {string} [shapeSpec.stroke] - Border color (optional)
 * @param {number} [shapeSpec.strokeWidth] - Border width (optional)
 * @returns {Object} Normalized shape specification with all properties filled
 * @throws {Error} If required properties are missing or invalid
 */
export function normalizeShapeSpec(shapeSpec) {
  // Validate required fields
  if (!shapeSpec.type || typeof shapeSpec.type !== 'string') {
    throw new Error('Shape specification requires a type');
  }
  
  if (!shapeSpec.color || typeof shapeSpec.color !== 'string') {
    throw new Error('Shape specification requires a color');
  }

  // Normalize shape type
  const type = shapeSpec.type.toLowerCase();
  let normalizedType;
  
  if (type === 'rectangle' || type === 'rect' || type === 'square') {
    normalizedType = 'rectangle';
  } else if (type === 'circle') {
    normalizedType = 'circle';
  } else if (type === 'triangle') {
    normalizedType = 'triangle';
  } else if (type === 'text') {
    normalizedType = 'text';
  } else {
    throw new Error(`Invalid shape type: ${type}. Supported: rectangle, circle, triangle, text`);
  }

  // Normalize color
  let hexColor;
  try {
    const colorResult = normalizeColor(shapeSpec.color);
    hexColor = colorResult.hex;
  } catch (error) {
    throw new Error(`Invalid color: ${error.message}`);
  }

  // Build normalized shape with defaults and clamping
  const normalized = {
    type: normalizedType,
    fill: hexColor,
  };

  // Add type-specific properties with defaults
  switch (normalizedType) {
    case 'rectangle': {
      const width = typeof shapeSpec.width === 'number' 
        ? Math.max(DEFAULTS.minSize, Math.min(DEFAULTS.maxSize, shapeSpec.width))
        : DEFAULTS.rectangle.width;
      
      const height = typeof shapeSpec.height === 'number'
        ? Math.max(DEFAULTS.minSize, Math.min(DEFAULTS.maxSize, shapeSpec.height))
        : DEFAULTS.rectangle.height;
      
      // For squares, ensure equal sides
      if (type === 'square') {
        const size = Math.max(width, height);
        normalized.width = size;
        normalized.height = size;
      } else {
        normalized.width = width;
        normalized.height = height;
      }
      break;
    }

    case 'circle': {
      const radius = typeof shapeSpec.radius === 'number'
        ? Math.max(DEFAULTS.minSize, Math.min(DEFAULTS.maxSize, shapeSpec.radius))
        : DEFAULTS.circle.radius;
      normalized.radius = radius;
      break;
    }

    case 'triangle': {
      const width = typeof shapeSpec.width === 'number'
        ? Math.max(DEFAULTS.minSize, Math.min(DEFAULTS.maxSize, shapeSpec.width))
        : DEFAULTS.triangle.width;
      
      const height = typeof shapeSpec.height === 'number'
        ? Math.max(DEFAULTS.minSize, Math.min(DEFAULTS.maxSize, shapeSpec.height))
        : DEFAULTS.triangle.height;
      
      normalized.width = width;
      normalized.height = height;
      break;
    }

    case 'text': {
      if (!shapeSpec.text || typeof shapeSpec.text !== 'string') {
        throw new Error('Text shape requires text content');
      }
      
      normalized.text = shapeSpec.text;
      normalized.fontSize = typeof shapeSpec.fontSize === 'number'
        ? Math.max(8, Math.min(72, shapeSpec.fontSize))
        : DEFAULTS.text.fontSize;
      
      // Width/height optional for text (auto-sized based on content)
      if (typeof shapeSpec.width === 'number') {
        normalized.width = Math.max(DEFAULTS.minSize, Math.min(DEFAULTS.maxSize, shapeSpec.width));
      } else {
        normalized.width = DEFAULTS.text.width;
      }
      
      if (typeof shapeSpec.height === 'number') {
        normalized.height = Math.max(DEFAULTS.minSize, Math.min(DEFAULTS.maxSize, shapeSpec.height));
      } else {
        normalized.height = DEFAULTS.text.height;
      }
      break;
    }
  }

  // Add optional stroke properties if provided
  if (shapeSpec.stroke && typeof shapeSpec.stroke === 'string') {
    try {
      const strokeResult = normalizeColor(shapeSpec.stroke);
      normalized.stroke = strokeResult.hex;
    } catch (error) {
      // If stroke color is invalid, use default black
      normalized.stroke = '#000000';
    }
  } else {
    normalized.stroke = '#000000';
  }

  if (typeof shapeSpec.strokeWidth === 'number') {
    normalized.strokeWidth = Math.max(0, Math.min(10, shapeSpec.strokeWidth));
  } else {
    normalized.strokeWidth = 2;
  }

  return normalized;
}

/**
 * Get the bounding box size for a normalized shape
 * Used to calculate spacing and prevent overlaps
 * @param {Object} shape - Normalized shape specification
 * @returns {Object} { width, height } in pixels
 */
export function getShapeSize(shape) {
  switch (shape.type) {
    case 'rectangle':
    case 'triangle':
    case 'text':
      return { width: shape.width, height: shape.height };
    case 'circle':
      return { width: shape.radius * 2, height: shape.radius * 2 };
    default:
      return { width: 100, height: 100 };
  }
}

/**
 * Calculate vertical positions for shapes
 * Stacks shapes vertically with consistent spacing
 * @param {Array} shapes - Array of normalized shape specs
 * @param {Object} options - Positioning options
 * @param {number} options.originX - Starting X coordinate
 * @param {number} options.originY - Starting Y coordinate  
 * @param {number} [options.spacing=25] - Vertical spacing between shapes (5-200)
 * @returns {Array} Array of shape configs with x, y positions
 */
export function calcVerticalPositions(shapes, { originX, originY, spacing = DEFAULTS.spacing.vertical }) {
  // Validate and clamp spacing
  const safeSpacing = Math.max(DEFAULTS.minSpacing, Math.min(DEFAULTS.maxSpacing, spacing));
  
  let currentY = originY;
  
  return shapes.map((shape, index) => {
    const size = getShapeSize(shape);
    
    // Center shape horizontally at originX
    const x = originX;
    const y = currentY;
    
    // Move to next position (add shape height + spacing)
    currentY += size.height + safeSpacing;
    
    return {
      ...shape,
      x,
      y,
    };
  });
}

/**
 * Calculate horizontal positions for shapes
 * Arranges shapes horizontally with consistent spacing
 * @param {Array} shapes - Array of normalized shape specs
 * @param {Object} options - Positioning options
 * @param {number} options.originX - Starting X coordinate
 * @param {number} options.originY - Y coordinate (same for all shapes)
 * @param {number} [options.spacing=20] - Horizontal spacing between shapes (5-500)
 * @returns {Array} Array of shape configs with x, y positions
 */
export function calcHorizontalPositions(shapes, { originX, originY, spacing = DEFAULTS.spacing.horizontal }) {
  // Validate and clamp spacing
  const safeSpacing = Math.max(DEFAULTS.minSpacing, Math.min(DEFAULTS.maxSpacing, spacing));
  
  let currentX = originX;
  
  return shapes.map((shape, index) => {
    const size = getShapeSize(shape);
    
    const x = currentX;
    const y = originY;
    
    // Move to next position (add shape width + spacing)
    currentX += size.width + safeSpacing;
    
    return {
      ...shape,
      x,
      y,
    };
  });
}

/**
 * Convert normalized shape configs to full shape objects ready for Firestore
 * Adds IDs, internal type constants, timestamps, and metadata
 * @param {Array} shapeConfigs - Array of normalized shape configs with positions
 * @returns {Array} Array of complete shape objects ready for Firestore
 */
export function convertToShapeObjects(shapeConfigs) {
  const baseTime = Date.now();
  
  return shapeConfigs.map((config, index) => {
    const shapeId = uuidv4();
    
    // Map to internal shape type constants
    let internalType;
    switch (config.type) {
      case 'rectangle':
        internalType = SHAPE_TYPES.RECT;
        break;
      case 'circle':
        internalType = SHAPE_TYPES.CIRCLE;
        break;
      case 'text':
        internalType = SHAPE_TYPES.TEXT;
        break;
      case 'triangle':
        internalType = SHAPE_TYPES.TRIANGLE;
        break;
      default:
        internalType = config.type;
    }

    return {
      id: shapeId,
      type: internalType,
      x: config.x,
      y: config.y,
      fill: config.fill,
      stroke: config.stroke,
      strokeWidth: config.strokeWidth,
      draggable: true,
      zIndex: baseTime + index, // Ensure proper stacking order
      createdBy: 'AI',
      ...(config.width !== undefined && { width: config.width }),
      ...(config.height !== undefined && { height: config.height }),
      ...(config.radius !== undefined && { radius: config.radius }),
      ...(config.text !== undefined && { text: config.text }),
      ...(config.fontSize !== undefined && { fontSize: config.fontSize }),
    };
  });
}

/**
 * Validate a batch of shapes before creation
 * Checks for reasonable limits and constraints
 * @param {Array} shapes - Array of shape objects
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateShapeBatch(shapes) {
  if (!Array.isArray(shapes) || shapes.length === 0) {
    return { valid: false, error: 'No shapes provided' };
  }
  
  if (shapes.length > 100) {
    return { 
      valid: false, 
      error: `Too many shapes: ${shapes.length}. Maximum 100 shapes per batch.`,
    };
  }
  
  // Check each shape has required properties
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    if (!shape.type || !shape.x || !shape.y || !shape.fill) {
      return {
        valid: false,
        error: `Shape at index ${i} is missing required properties (type, x, y, fill)`,
      };
    }
  }
  
  return { valid: true };
}

