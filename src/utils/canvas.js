/**
 * Canvas utility functions for zoom and pan calculations
 */

// Zoom constraints
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 3.0;
export const ZOOM_SPEED = 0.1;

/**
 * Constrain scale value within min and max bounds
 * @param {number} scale - Scale value to constrain
 * @returns {number} Constrained scale
 */
export const constrainScale = (scale) => {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
};

/**
 * Calculate new scale based on wheel delta
 * @param {number} currentScale - Current scale value
 * @param {number} deltaY - Wheel delta Y value
 * @returns {number} New constrained scale
 */
export const calculateNewScale = (currentScale, deltaY) => {
  const scaleBy = deltaY > 0 ? 1 - ZOOM_SPEED : 1 + ZOOM_SPEED;
  const newScale = currentScale * scaleBy;
  return constrainScale(newScale);
};

/**
 * Calculate zoom position to zoom towards cursor
 * This ensures the zoom is centered on the mouse position
 * @param {Object} stage - Konva stage object
 * @param {number} oldScale - Previous scale
 * @param {number} newScale - New scale
 * @param {Object} pointerPosition - {x, y} cursor position
 * @returns {Object} New position {x, y} for the stage
 */
export const calculateZoomPosition = (stage, oldScale, newScale, pointerPosition) => {
  const mousePointTo = {
    x: (pointerPosition.x - stage.x()) / oldScale,
    y: (pointerPosition.y - stage.y()) / oldScale,
  };

  return {
    x: pointerPosition.x - mousePointTo.x * newScale,
    y: pointerPosition.y - mousePointTo.y * newScale,
  };
};

