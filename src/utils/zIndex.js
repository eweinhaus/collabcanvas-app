/**
 * Z-Index utilities for shape layering
 * Handles layer ordering, bring to front/back operations
 */

/**
 * Get maximum zIndex from array of shapes
 * @param {Array} shapes - Array of shape objects
 * @returns {number} Maximum zIndex value (or 0 if no shapes)
 */
export const getMaxZIndex = (shapes) => {
  if (!shapes || shapes.length === 0) return 0;
  return Math.max(...shapes.map(s => s.zIndex ?? 0));
};

/**
 * Get minimum zIndex from array of shapes
 * @param {Array} shapes - Array of shape objects
 * @returns {number} Minimum zIndex value (or 0 if no shapes)
 */
export const getMinZIndex = (shapes) => {
  if (!shapes || shapes.length === 0) return 0;
  return Math.min(...shapes.map(s => s.zIndex ?? 0));
};

/**
 * Calculate new zIndex for bringing shape to front
 * @param {Array} shapes - All shapes on canvas
 * @returns {number} New zIndex value
 */
export const calculateBringToFront = (shapes) => {
  return getMaxZIndex(shapes) + 1;
};

/**
 * Calculate new zIndex for sending shape to back
 * @param {Array} shapes - All shapes on canvas
 * @returns {number} New zIndex value
 */
export const calculateSendToBack = (shapes) => {
  return getMinZIndex(shapes) - 1;
};

/**
 * Calculate new zIndex for bringing shape forward one step
 * Swaps zIndex with the next higher shape
 * @param {string} shapeId - ID of shape to move
 * @param {Array} shapes - All shapes on canvas (sorted by zIndex)
 * @returns {Object|null} { shapeId, newZIndex, swapShapeId, swapZIndex } or null if already at front
 */
export const calculateBringForward = (shapeId, shapes) => {
  // Sort by zIndex to find ordering
  const sorted = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  const currentIndex = sorted.findIndex(s => s.id === shapeId);
  
  if (currentIndex === -1 || currentIndex === sorted.length - 1) {
    // Shape not found or already at front
    return null;
  }
  
  const currentShape = sorted[currentIndex];
  const nextShape = sorted[currentIndex + 1];
  
  // Swap zIndex values
  return {
    shapeId: currentShape.id,
    newZIndex: nextShape.zIndex ?? 0,
    swapShapeId: nextShape.id,
    swapZIndex: currentShape.zIndex ?? 0,
  };
};

/**
 * Calculate new zIndex for sending shape backward one step
 * Swaps zIndex with the next lower shape
 * @param {string} shapeId - ID of shape to move
 * @param {Array} shapes - All shapes on canvas (sorted by zIndex)
 * @returns {Object|null} { shapeId, newZIndex, swapShapeId, swapZIndex } or null if already at back
 */
export const calculateSendBackward = (shapeId, shapes) => {
  // Sort by zIndex to find ordering
  const sorted = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  const currentIndex = sorted.findIndex(s => s.id === shapeId);
  
  if (currentIndex === -1 || currentIndex === 0) {
    // Shape not found or already at back
    return null;
  }
  
  const currentShape = sorted[currentIndex];
  const prevShape = sorted[currentIndex - 1];
  
  // Swap zIndex values
  return {
    shapeId: currentShape.id,
    newZIndex: prevShape.zIndex ?? 0,
    swapShapeId: prevShape.id,
    swapZIndex: currentShape.zIndex ?? 0,
  };
};

/**
 * Normalize zIndex values for all shapes
 * Useful when many shapes have same zIndex (legacy data)
 * Assigns sequential zIndex based on current order
 * @param {Array} shapes - Array of shapes to normalize
 * @returns {Array} Array of { id, zIndex } objects
 */
export const normalizeZIndexes = (shapes) => {
  // Sort by current zIndex, then by createdAt for tiebreaker
  const sorted = [...shapes].sort((a, b) => {
    const zDiff = (a.zIndex ?? 0) - (b.zIndex ?? 0);
    if (zDiff !== 0) return zDiff;
    // Tiebreaker: use createdAt
    return (a.createdAt ?? 0) - (b.createdAt ?? 0);
  });
  
  // Assign sequential zIndex starting from 0
  return sorted.map((shape, index) => ({
    id: shape.id,
    zIndex: index,
  }));
};

/**
 * Get shapes sorted by zIndex (ascending order - back to front)
 * @param {Array} shapes - Array of shapes
 * @returns {Array} Sorted array of shapes
 */
export const sortShapesByZIndex = (shapes) => {
  return [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
};

