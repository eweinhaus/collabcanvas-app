/**
 * Linear interpolation between two positions
 * @param {Object} prev - Previous position {x, y}
 * @param {Object} next - Next position {x, y}
 * @param {number} alpha - Interpolation factor (0-1)
 * @returns {Object} Interpolated position {x, y}
 */
export function interpolatePosition(prev, next, alpha) {
  if (!prev || !next) return next || prev || { x: 0, y: 0 };
  
  // Clamp alpha between 0 and 1
  const t = Math.max(0, Math.min(1, alpha));
  
  return {
    x: prev.x + (next.x - prev.x) * t,
    y: prev.y + (next.y - prev.y) * t,
  };
}

/**
 * Check if two positions are far apart (teleport detection)
 * @param {Object} pos1 - First position {x, y}
 * @param {Object} pos2 - Second position {x, y}
 * @param {number} threshold - Distance threshold in pixels (default 500)
 * @returns {boolean} True if positions are far apart
 */
export function isTeleport(pos1, pos2, threshold = 500) {
  if (!pos1 || !pos2) return false;
  
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance > threshold;
}

