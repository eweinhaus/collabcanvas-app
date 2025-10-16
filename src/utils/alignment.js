/**
 * Alignment and distribution utilities for canvas shapes
 * Provides functions to align and distribute multiple shapes
 */

/**
 * Get the bounding box for a shape, accounting for its type and transformations
 * @param {Object} shape - Shape object with x, y, and dimensions
 * @returns {Object} - { x, y, width, height, centerX, centerY }
 */
export function getShapeBounds(shape) {
  let x = shape.x || 0;
  let y = shape.y || 0;
  let width, height;

  // Handle different shape types
  switch (shape.type) {
    case 'circle':
      width = height = (shape.radius || 0) * 2;
      x -= shape.radius || 0; // Circle x,y is center, convert to top-left
      y -= shape.radius || 0;
      break;
    
    case 'text':
      width = shape.width || 100; // Default text width
      height = shape.fontSize || 16; // Use fontSize as height approximation
      break;
    
    case 'triangle':
      // Triangle is drawn from a point, approximate bounds
      width = shape.width || 100;
      height = shape.height || 100;
      break;
    
    case 'rectangle':
    default:
      width = shape.width !== undefined ? shape.width : 100;
      height = shape.height !== undefined ? shape.height : 100;
      break;
  }

  // Account for rotation if present
  // For rotated shapes, we need the axis-aligned bounding box
  if (shape.rotation && shape.rotation !== 0) {
    const rad = (shape.rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    
    const rotatedWidth = width * cos + height * sin;
    const rotatedHeight = width * sin + height * cos;
    
    // Center remains the same, but we need to adjust x, y for the new bounds
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    return {
      x: centerX - rotatedWidth / 2,
      y: centerY - rotatedHeight / 2,
      width: rotatedWidth,
      height: rotatedHeight,
      centerX,
      centerY,
      originalX: x,
      originalY: y,
      originalWidth: width,
      originalHeight: height,
    };
  }

  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
    originalX: x,
    originalY: y,
    originalWidth: width,
    originalHeight: height,
  };
}

/**
 * Get the collective bounding box for multiple shapes
 * @param {Array} shapes - Array of shape objects
 * @returns {Object} - { x, y, width, height, centerX, centerY }
 */
export function getSelectionBounds(shapes) {
  if (!shapes || shapes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  const bounds = shapes.map(getShapeBounds);
  
  const minX = Math.min(...bounds.map(b => b.x));
  const minY = Math.min(...bounds.map(b => b.y));
  const maxX = Math.max(...bounds.map(b => b.x + b.width));
  const maxY = Math.max(...bounds.map(b => b.y + b.height));
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  return {
    x: minX,
    y: minY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}

/**
 * Align shapes to the left edge (leftmost shape's left edge)
 * @param {Array} shapes - Array of shape objects
 * @returns {Array} - Array of { id, x, y } updates
 */
export function alignLeft(shapes) {
  if (!shapes || shapes.length < 2) return [];
  
  const bounds = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  const minX = Math.min(...bounds.map(b => b.bounds.x));
  
  return bounds.map(({ shape, bounds }) => {
    const offsetX = minX - bounds.x;
    return {
      id: shape.id,
      x: shape.x + offsetX,
      y: shape.y,
    };
  });
}

/**
 * Align shapes to horizontal center (center of selection bounds)
 * @param {Array} shapes - Array of shape objects
 * @returns {Array} - Array of { id, x, y } updates
 */
export function alignCenter(shapes) {
  if (!shapes || shapes.length < 2) return [];
  
  const selectionBounds = getSelectionBounds(shapes);
  const targetCenterX = selectionBounds.centerX;
  
  return shapes.map(shape => {
    const bounds = getShapeBounds(shape);
    const offsetX = targetCenterX - bounds.centerX;
    return {
      id: shape.id,
      x: shape.x + offsetX,
      y: shape.y,
    };
  });
}

/**
 * Align shapes to the right edge (rightmost shape's right edge)
 * @param {Array} shapes - Array of shape objects
 * @returns {Array} - Array of { id, x, y } updates
 */
export function alignRight(shapes) {
  if (!shapes || shapes.length < 2) return [];
  
  const bounds = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  const maxX = Math.max(...bounds.map(b => b.bounds.x + b.bounds.width));
  
  return bounds.map(({ shape, bounds }) => {
    const offsetX = (maxX - bounds.width) - bounds.x;
    return {
      id: shape.id,
      x: shape.x + offsetX,
      y: shape.y,
    };
  });
}

/**
 * Align shapes to the top edge (topmost shape's top edge)
 * @param {Array} shapes - Array of shape objects
 * @returns {Array} - Array of { id, x, y } updates
 */
export function alignTop(shapes) {
  if (!shapes || shapes.length < 2) return [];
  
  const bounds = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  const minY = Math.min(...bounds.map(b => b.bounds.y));
  
  return bounds.map(({ shape, bounds }) => {
    const offsetY = minY - bounds.y;
    return {
      id: shape.id,
      x: shape.x,
      y: shape.y + offsetY,
    };
  });
}

/**
 * Align shapes to vertical middle (center of selection bounds)
 * @param {Array} shapes - Array of shape objects
 * @returns {Array} - Array of { id, x, y } updates
 */
export function alignMiddle(shapes) {
  if (!shapes || shapes.length < 2) return [];
  
  const selectionBounds = getSelectionBounds(shapes);
  const targetCenterY = selectionBounds.centerY;
  
  return shapes.map(shape => {
    const bounds = getShapeBounds(shape);
    const offsetY = targetCenterY - bounds.centerY;
    return {
      id: shape.id,
      x: shape.x,
      y: shape.y + offsetY,
    };
  });
}

/**
 * Align shapes to the bottom edge (bottommost shape's bottom edge)
 * @param {Array} shapes - Array of shape objects
 * @returns {Array} - Array of { id, x, y } updates
 */
export function alignBottom(shapes) {
  if (!shapes || shapes.length < 2) return [];
  
  const bounds = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  const maxY = Math.max(...bounds.map(b => b.bounds.y + b.bounds.height));
  
  return bounds.map(({ shape, bounds }) => {
    const offsetY = (maxY - bounds.height) - bounds.y;
    return {
      id: shape.id,
      x: shape.x,
      y: shape.y + offsetY,
    };
  });
}

/**
 * Distribute shapes horizontally with even spacing
 * @param {Array} shapes - Array of shape objects
 * @returns {Array} - Array of { id, x, y } updates
 */
export function distributeHorizontally(shapes) {
  if (!shapes || shapes.length < 3) return [];
  
  // Get bounds for all shapes
  const shapeBounds = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  
  // Sort by current x position (left to right)
  shapeBounds.sort((a, b) => a.bounds.x - b.bounds.x);
  
  // Calculate total space and gap
  const leftmost = shapeBounds[0];
  const rightmost = shapeBounds[shapeBounds.length - 1];
  
  const totalSpace = (rightmost.bounds.x + rightmost.bounds.width) - leftmost.bounds.x;
  const totalShapeWidth = shapeBounds.reduce((sum, sb) => sum + sb.bounds.width, 0);
  const availableSpace = totalSpace - totalShapeWidth;
  const gap = availableSpace / (shapeBounds.length - 1);
  
  // Calculate new positions
  let currentX = leftmost.bounds.x;
  
  return shapeBounds.map(({ shape, bounds }, index) => {
    if (index === 0) {
      // Keep leftmost shape in place
      return { id: shape.id, x: shape.x, y: shape.y };
    }
    
    currentX += shapeBounds[index - 1].bounds.width + gap;
    const offsetX = currentX - bounds.x;
    
    return {
      id: shape.id,
      x: shape.x + offsetX,
      y: shape.y,
    };
  });
}

/**
 * Distribute shapes vertically with even spacing
 * @param {Array} shapes - Array of shape objects
 * @returns {Array} - Array of { id, x, y } updates
 */
export function distributeVertically(shapes) {
  if (!shapes || shapes.length < 3) return [];
  
  // Get bounds for all shapes
  const shapeBounds = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  
  // Sort by current y position (top to bottom)
  shapeBounds.sort((a, b) => a.bounds.y - b.bounds.y);
  
  // Calculate total space and gap
  const topmost = shapeBounds[0];
  const bottommost = shapeBounds[shapeBounds.length - 1];
  
  const totalSpace = (bottommost.bounds.y + bottommost.bounds.height) - topmost.bounds.y;
  const totalShapeHeight = shapeBounds.reduce((sum, sb) => sum + sb.bounds.height, 0);
  const availableSpace = totalSpace - totalShapeHeight;
  const gap = availableSpace / (shapeBounds.length - 1);
  
  // Calculate new positions
  let currentY = topmost.bounds.y;
  
  return shapeBounds.map(({ shape, bounds }, index) => {
    if (index === 0) {
      // Keep topmost shape in place
      return { id: shape.id, x: shape.x, y: shape.y };
    }
    
    currentY += shapeBounds[index - 1].bounds.height + gap;
    const offsetY = currentY - bounds.y;
    
    return {
      id: shape.id,
      x: shape.x,
      y: shape.y + offsetY,
    };
  });
}

/**
 * Check if shapes can be aligned (2+ shapes required)
 * @param {Array} shapes - Array of shape objects
 * @returns {boolean}
 */
export function canAlign(shapes) {
  return !!(shapes && shapes.length >= 2);
}

/**
 * Check if shapes can be distributed (3+ shapes required)
 * @param {Array} shapes - Array of shape objects
 * @returns {boolean}
 */
export function canDistribute(shapes) {
  return !!(shapes && shapes.length >= 3);
}

