/**
 * Grid Generation Utility
 * 
 * Generates arrays of shape configurations for creating grids on the canvas.
 * Pure functions with no side effects for easy testing.
 */

import { SHAPE_TYPES } from './shapes';

/**
 * Default grid configuration
 */
export const DEFAULT_GRID_CONFIG = {
  rows: 3,
  cols: 3,
  spacing: 120, // pixels between shape centers
  shapeSize: 50, // default size (radius for circles, width/height for rectangles)
};

/**
 * Validate grid parameters
 * @param {Object} params - Grid parameters
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateGridParams = (params) => {
  const errors = [];

  // Validate rows
  if (typeof params.rows !== 'number' || !Number.isInteger(params.rows)) {
    errors.push('Rows must be an integer');
  } else if (params.rows < 1 || params.rows > 20) {
    errors.push('Rows must be between 1 and 20');
  }

  // Validate cols
  if (typeof params.cols !== 'number' || !Number.isInteger(params.cols)) {
    errors.push('Cols must be an integer');
  } else if (params.cols < 1 || params.cols > 20) {
    errors.push('Cols must be between 1 and 20');
  }

  // Validate spacing
  if (typeof params.spacing !== 'number') {
    errors.push('Spacing must be a number');
  } else if (params.spacing < 10 || params.spacing > 500) {
    errors.push('Spacing must be between 10 and 500 pixels');
  }

  // Validate origin (negative coordinates now allowed)
  if (typeof params.originX !== 'number') {
    errors.push('Origin X must be a number');
  }
  if (typeof params.originY !== 'number') {
    errors.push('Origin Y must be a number');
  }

  // Validate total shape count
  const totalShapes = params.rows * params.cols;
  if (totalShapes > 100) {
    errors.push('Grid cannot exceed 100 shapes (rows × cols ≤ 100)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Generate grid positions for shapes
 * @param {Object} config - Grid configuration
 * @param {number} config.rows - Number of rows
 * @param {number} config.cols - Number of columns
 * @param {number} config.spacing - Spacing between shape centers in pixels
 * @param {number} config.originX - Starting X coordinate (top-left)
 * @param {number} config.originY - Starting Y coordinate (top-left)
 * @returns {Array<{x: number, y: number, row: number, col: number}>} Array of positions
 */
export const generateGridPositions = (config) => {
  const { rows, cols, spacing, originX, originY } = config;
  const positions = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({
        x: originX + (col * spacing),
        y: originY + (row * spacing),
        row,
        col,
      });
    }
  }

  return positions;
};

/**
 * Generate shape configuration objects for a grid
 * Does NOT create actual shape objects (no IDs), just returns config data
 * @param {Object} params - Grid parameters
 * @param {number} params.rows - Number of rows
 * @param {number} params.cols - Number of columns
 * @param {number} params.spacing - Spacing between shapes
 * @param {number} params.originX - Starting X coordinate
 * @param {number} params.originY - Starting Y coordinate
 * @param {string} params.shapeType - Type of shape (circle, rectangle, triangle, text)
 * @param {string} params.color - Color for all shapes in grid
 * @param {Object} params.shapeProps - Additional shape properties (width, height, radius, text)
 * @returns {Array<Object>} Array of shape configuration objects
 */
export const generateGrid = (params) => {
  const {
    rows,
    cols,
    spacing,
    originX,
    originY,
    shapeType,
    color,
    shapeProps = {},
  } = params;

  // Validate parameters
  const validation = validateGridParams({
    rows,
    cols,
    spacing,
    originX,
    originY,
  });

  if (!validation.valid) {
    throw new Error(`Invalid grid parameters: ${validation.errors.join(', ')}`);
  }

  // Validate shape type
  const validTypes = Object.values(SHAPE_TYPES);
  if (!validTypes.includes(shapeType)) {
    throw new Error(`Invalid shape type: ${shapeType}. Must be one of: ${validTypes.join(', ')}`);
  }

  // Generate positions
  const positions = generateGridPositions({
    rows,
    cols,
    spacing,
    originX,
    originY,
  });

  // Generate shape configs (without IDs - those will be added by createShape)
  const shapeConfigs = positions.map((pos) => {
    // Base configuration
    const config = {
      type: shapeType,
      x: pos.x,
      y: pos.y,
      color,
      gridPosition: { row: pos.row, col: pos.col }, // Track grid position for debugging
    };

    // Add shape-specific properties
    if (shapeType === SHAPE_TYPES.CIRCLE) {
      config.radius = shapeProps.radius || DEFAULT_GRID_CONFIG.shapeSize;
    } else if (shapeType === SHAPE_TYPES.RECT || shapeType === SHAPE_TYPES.TRIANGLE) {
      config.width = shapeProps.width || DEFAULT_GRID_CONFIG.shapeSize * 2;
      config.height = shapeProps.height || DEFAULT_GRID_CONFIG.shapeSize * 2;
    } else if (shapeType === SHAPE_TYPES.TEXT) {
      config.text = shapeProps.text || `(${pos.row},${pos.col})`;
      config.width = shapeProps.width || 100;
      config.height = shapeProps.height || 30;
      config.fontSize = shapeProps.fontSize || 16;
    }

    // Include any additional custom properties
    return { ...config, ...shapeProps };
  });

  return shapeConfigs;
};

/**
 * Calculate grid dimensions (bounding box)
 * @param {Object} config - Grid configuration
 * @returns {Object} { width: number, height: number, totalShapes: number }
 */
export const calculateGridDimensions = (config) => {
  const { rows, cols, spacing, shapeSize = DEFAULT_GRID_CONFIG.shapeSize } = config;
  
  return {
    width: (cols - 1) * spacing + shapeSize * 2,
    height: (rows - 1) * spacing + shapeSize * 2,
    totalShapes: rows * cols,
  };
};

export default {
  generateGrid,
  generateGridPositions,
  validateGridParams,
  calculateGridDimensions,
  DEFAULT_GRID_CONFIG,
};

