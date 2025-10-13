/**
 * Shape utilities for creating and managing canvas shapes
 */

import { v4 as uuidv4 } from 'uuid';
import { getRandomColor } from './colors';

// Shape type constants
export const SHAPE_TYPES = {
  RECT: 'rect',
  CIRCLE: 'circle',
  TEXT: 'text',
};

// Default dimensions
export const DEFAULT_RECT_SIZE = { width: 100, height: 100 };
export const DEFAULT_CIRCLE_RADIUS = 50;
export const DEFAULT_TEXT_SIZE = 16;

/**
 * Create a new rectangle shape
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} overrides - Additional properties to override defaults
 * @returns {Object} Rectangle shape object
 */
export const createRectangle = (x, y, overrides = {}) => {
  return {
    id: uuidv4(),
    type: SHAPE_TYPES.RECT,
    x,
    y,
    width: DEFAULT_RECT_SIZE.width,
    height: DEFAULT_RECT_SIZE.height,
    fill: getRandomColor(),
    stroke: '#000000',
    strokeWidth: 2,
    draggable: true,
    ...overrides,
  };
};

/**
 * Create a new circle shape
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} overrides - Additional properties to override defaults
 * @returns {Object} Circle shape object
 */
export const createCircle = (x, y, overrides = {}) => {
  return {
    id: uuidv4(),
    type: SHAPE_TYPES.CIRCLE,
    x,
    y,
    radius: DEFAULT_CIRCLE_RADIUS,
    fill: getRandomColor(),
    stroke: '#000000',
    strokeWidth: 2,
    draggable: true,
    ...overrides,
  };
};

/**
 * Create a new text shape
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} text - Text content
 * @param {Object} overrides - Additional properties to override defaults
 * @returns {Object} Text shape object
 */
export const createText = (x, y, text = 'Double-click to edit', overrides = {}) => {
  return {
    id: uuidv4(),
    type: SHAPE_TYPES.TEXT,
    x,
    y,
    text,
    fontSize: DEFAULT_TEXT_SIZE,
    fill: '#000000',
    draggable: true,
    ...overrides,
  };
};

/**
 * Helper to create shape by type
 * @param {string} type - Shape type (rect, circle, text)
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} overrides - Additional properties
 * @returns {Object} Shape object
 */
export const createShape = (type, x, y, overrides = {}) => {
  switch (type) {
    case SHAPE_TYPES.RECT:
      return createRectangle(x, y, overrides);
    case SHAPE_TYPES.CIRCLE:
      return createCircle(x, y, overrides);
    case SHAPE_TYPES.TEXT:
      return createText(x, y, 'Double-click to edit', overrides);
    default:
      throw new Error(`Unknown shape type: ${type}`);
  }
};

