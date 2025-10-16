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
  TRIANGLE: 'triangle',
};

// Default dimensions
export const DEFAULT_RECT_SIZE = { width: 100, height: 100 };
export const DEFAULT_CIRCLE_RADIUS = 50;
export const DEFAULT_TEXT_SIZE = 16;
export const DEFAULT_TRIANGLE_SIZE = { width: 100, height: 100 };

/**
 * Create a new rectangle shape
 * @param {number} x - X position (center of rectangle)
 * @param {number} y - Y position (center of rectangle)
 * @param {Object} overrides - Additional properties to override defaults
 * @returns {Object} Rectangle shape object
 */
export const createRectangle = (x, y, overrides = {}) => {
  const width = overrides.width || DEFAULT_RECT_SIZE.width;
  const height = overrides.height || DEFAULT_RECT_SIZE.height;
  
  return {
    id: uuidv4(),
    type: SHAPE_TYPES.RECT,
    x: x - width / 2,  // Center the rectangle at cursor position
    y: y - height / 2,
    width,
    height,
    fill: getRandomColor(),
    stroke: '#000000',
    strokeWidth: 2,
    draggable: true,
    zIndex: Date.now(), // Default to timestamp for creation order
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
    zIndex: Date.now(), // Default to timestamp for creation order
    ...overrides,
  };
};

/**
 * Create a new triangle shape (isosceles, centered at x,y)
 * Uses width/height similar to rect for consistency
 */
export const createTriangle = (x, y, overrides = {}) => {
  const width = overrides.width || DEFAULT_TRIANGLE_SIZE.width;
  const height = overrides.height || DEFAULT_TRIANGLE_SIZE.height;
  // Centered at (x,y): we store x,y as top-left like rect for consistency with existing shapes
  // Keep same convention as rectangle: x,y represent top-left; Shape component will render accordingly
  return {
    id: uuidv4(),
    type: SHAPE_TYPES.TRIANGLE,
    x: x - width / 2,
    y: y - height / 2,
    width,
    height,
    rotation: 0,
    fill: getRandomColor(),
    stroke: '#000000',
    strokeWidth: 2,
    draggable: true,
    zIndex: Date.now(), // Default to timestamp for creation order
    ...overrides,
  };
};

/**
 * Create a new text shape
 * @param {number} x - X position (approximately centered)
 * @param {number} y - Y position (vertically centered)
 * @param {string} text - Text content
 * @param {Object} overrides - Additional properties to override defaults
 * @returns {Object} Text shape object
 */
export const createText = (x, y, text = 'Double-click to edit', overrides = {}) => {
  const fontSize = overrides.fontSize || DEFAULT_TEXT_SIZE;
  // Estimate text width (rough approximation: 0.6 * fontSize per character)
  const estimatedWidth = text.length * fontSize * 0.6;
  
  return {
    id: uuidv4(),
    type: SHAPE_TYPES.TEXT,
    x: x - estimatedWidth / 2,  // Center horizontally at cursor
    y: y - fontSize / 2,         // Center vertically at cursor
    text,
    fontSize,
    fill: '#000000',
    draggable: true,
    zIndex: Date.now(), // Default to timestamp for creation order
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
    case SHAPE_TYPES.TRIANGLE:
      return createTriangle(x, y, overrides);
    default:
      throw new Error(`Unknown shape type: ${type}`);
  }
};

