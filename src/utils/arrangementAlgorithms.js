/**
 * Arrangement Algorithms for CollabCanvas
 * 
 * This file contains algorithms for arranging and distributing shapes
 * on the canvas in various patterns.
 */

/**
 * Default spacing between shapes (in pixels)
 */
export const DEFAULT_SPACING = 20;

/**
 * Calculate the bounding box center for a shape
 * @param {Object} shape - Shape with x, y, and size properties
 * @returns {Object} Center point { x, y }
 */
const getShapeCenter = (shape) => {
  return {
    x: shape.x,
    y: shape.y
  };
};

/**
 * Arrange shapes horizontally in a line
 * Aligns shapes along the x-axis with specified spacing
 * 
 * @param {Array} shapes - Array of shape objects with id, x, y, and size properties
 * @param {number} spacing - Horizontal spacing between shape centers (default: 20)
 * @returns {Array} Array of updates { id, x, y } for each shape
 */
export const arrangeHorizontally = (shapes, spacing = DEFAULT_SPACING) => {
  if (!shapes || shapes.length === 0) {
    return [];
  }

  // For single shape, no change needed
  if (shapes.length === 1) {
    return [];
  }

  // Sort shapes by current x position (left to right)
  const sortedShapes = [...shapes].sort((a, b) => a.x - b.x);

  // Calculate the leftmost position (from first shape)
  const startX = sortedShapes[0].x;

  // Calculate average y position for alignment
  const avgY = Math.round(
    sortedShapes.reduce((sum, shape) => sum + shape.y, 0) / sortedShapes.length
  );

  // Generate updates for each shape
  const updates = sortedShapes.map((shape, index) => {
    const newX = Math.round(startX + (index * spacing));
    return {
      id: shape.id,
      x: Math.max(0, newX), // Clamp to >= 0
      y: Math.max(0, avgY)  // Clamp to >= 0
    };
  });

  return updates;
};

/**
 * Arrange shapes vertically in a column
 * Aligns shapes along the y-axis with specified spacing
 * 
 * @param {Array} shapes - Array of shape objects with id, x, y, and size properties
 * @param {number} spacing - Vertical spacing between shape centers (default: 20)
 * @returns {Array} Array of updates { id, x, y } for each shape
 */
export const arrangeVertically = (shapes, spacing = DEFAULT_SPACING) => {
  if (!shapes || shapes.length === 0) {
    return [];
  }

  // For single shape, no change needed
  if (shapes.length === 1) {
    return [];
  }

  // Sort shapes by current y position (top to bottom)
  const sortedShapes = [...shapes].sort((a, b) => a.y - b.y);

  // Calculate the topmost position (from first shape)
  const startY = sortedShapes[0].y;

  // Calculate average x position for alignment
  const avgX = Math.round(
    sortedShapes.reduce((sum, shape) => sum + shape.x, 0) / sortedShapes.length
  );

  // Generate updates for each shape
  const updates = sortedShapes.map((shape, index) => {
    const newY = Math.round(startY + (index * spacing));
    return {
      id: shape.id,
      x: Math.max(0, avgX),  // Clamp to >= 0
      y: Math.max(0, newY)   // Clamp to >= 0
    };
  });

  return updates;
};

/**
 * Distribute shapes evenly along an axis
 * Keeps first and last shapes in place, spaces others uniformly between them
 * 
 * @param {Array} shapes - Array of shape objects with id, x, y properties (min 3 shapes)
 * @param {string} axis - Axis to distribute along: 'x' or 'y'
 * @returns {Array} Array of updates { id, x, y } for each shape
 */
export const distributeEvenly = (shapes, axis = 'x') => {
  if (!shapes || shapes.length < 2) {
    return [];
  }

  // For 2 shapes or less, no distribution needed
  if (shapes.length === 2) {
    return [];
  }

  // Validate axis
  if (axis !== 'x' && axis !== 'y') {
    throw new Error('Axis must be "x" or "y"');
  }

  // Sort shapes by position on the specified axis
  const sortedShapes = [...shapes].sort((a, b) => {
    return axis === 'x' ? a.x - b.x : a.y - b.y;
  });

  // Get start and end positions
  const firstShape = sortedShapes[0];
  const lastShape = sortedShapes[sortedShapes.length - 1];
  const startPos = axis === 'x' ? firstShape.x : firstShape.y;
  const endPos = axis === 'x' ? lastShape.x : lastShape.y;

  // Calculate uniform spacing
  const totalDistance = endPos - startPos;
  const gaps = sortedShapes.length - 1; // Number of gaps between shapes
  const uniformSpacing = gaps > 0 ? totalDistance / gaps : 0;

  // Generate updates for each shape
  const updates = sortedShapes.map((shape, index) => {
    if (index === 0) {
      // Keep first shape in place
      return {
        id: shape.id,
        x: Math.max(0, Math.round(shape.x)),
        y: Math.max(0, Math.round(shape.y))
      };
    } else if (index === sortedShapes.length - 1) {
      // Keep last shape in place
      return {
        id: shape.id,
        x: Math.max(0, Math.round(shape.x)),
        y: Math.max(0, Math.round(shape.y))
      };
    } else {
      // Distribute middle shapes evenly
      const newPos = Math.round(startPos + (index * uniformSpacing));
      
      if (axis === 'x') {
        return {
          id: shape.id,
          x: Math.max(0, newPos),
          y: Math.max(0, Math.round(shape.y))
        };
      } else {
        return {
          id: shape.id,
          x: Math.max(0, Math.round(shape.x)),
          y: Math.max(0, newPos)
        };
      }
    }
  });

  return updates;
};

/**
 * Validate arrangement parameters
 * @param {Array} shapes - Shapes to arrange
 * @param {number} minCount - Minimum number of shapes required
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateArrangement = (shapes, minCount = 2) => {
  if (!shapes || !Array.isArray(shapes)) {
    return { valid: false, error: 'Shapes must be an array' };
  }

  if (shapes.length < minCount) {
    return { 
      valid: false, 
      error: `At least ${minCount} shape${minCount > 1 ? 's' : ''} required for arrangement` 
    };
  }

  // Validate each shape has required properties
  for (const shape of shapes) {
    if (!shape.id || typeof shape.x !== 'number' || typeof shape.y !== 'number') {
      return { 
        valid: false, 
        error: 'Each shape must have id, x, and y properties' 
      };
    }
  }

  return { valid: true };
};

export default {
  arrangeHorizontally,
  arrangeVertically,
  distributeEvenly,
  validateArrangement,
  DEFAULT_SPACING
};

