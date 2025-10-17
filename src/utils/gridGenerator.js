/**
 * Grid Generator Utility
 * 
 * Generates grid layout configurations for shape creation.
 * Pure function - no side effects, no Firestore writes.
 * 
 * @module gridGenerator
 */

/**
 * Generates a grid of shape configurations
 * 
 * @param {Object} options - Grid configuration options
 * @param {string} options.shapeType - Shape type: 'circle', 'rectangle', 'triangle', 'text'
 * @param {number} options.rows - Number of rows (1-20)
 * @param {number} options.cols - Number of columns (1-20)
 * @param {string} options.color - CSS color name or hex code for all shapes
 * @param {number} [options.spacing=120] - Spacing between shape centers in pixels (10-500)
 * @param {number} [options.originX=200] - Top-left X coordinate
 * @param {number} [options.originY=200] - Top-left Y coordinate
 * @param {number} [options.size=50] - Shape size (radius for circles/triangles, width/height for rectangles)
 * @param {string} [options.text] - Text content (required for text shapes)
 * @param {number} [options.fontSize=24] - Font size for text shapes
 * 
 * @returns {Array<Object>} Array of shape configuration objects
 * @throws {TypeError} If required parameters are missing or invalid type
 * @throws {RangeError} If values are out of acceptable range
 * 
 * @example
 * const shapes = generateGrid({
 *   shapeType: 'circle',
 *   rows: 3,
 *   cols: 3,
 *   color: 'blue',
 *   spacing: 150,
 *   originX: 300,
 *   originY: 200
 * });
 */
export function generateGrid(options) {
  // Validate required parameters
  if (!options || typeof options !== 'object') {
    throw new TypeError('Options object is required');
  }

  const {
    shapeType,
    rows,
    cols,
    color,
    spacing = 120,
    originX = 200,
    originY = 200,
    size = 50,
    text,
    fontSize = 24
  } = options;

  // Validate required fields
  if (!shapeType) {
    throw new TypeError('shapeType is required');
  }
  if (!['circle', 'rectangle', 'triangle', 'text'].includes(shapeType)) {
    throw new TypeError(`Invalid shapeType: ${shapeType}. Must be one of: circle, rectangle, triangle, text`);
  }
  if (typeof rows !== 'number' || rows <= 0) {
    throw new RangeError('rows must be a positive number');
  }
  if (typeof cols !== 'number' || cols <= 0) {
    throw new RangeError('cols must be a positive number');
  }
  if (!color) {
    throw new TypeError('color is required');
  }

  // Validate ranges
  if (rows > 20) {
    throw new RangeError('rows cannot exceed 20');
  }
  if (cols > 20) {
    throw new RangeError('cols cannot exceed 20');
  }
  if (rows * cols > 100) {
    throw new RangeError(`Grid size ${rows}×${cols} (${rows * cols} shapes) exceeds limit of 100 shapes`);
  }
  if (spacing < 10 || spacing > 500) {
    throw new RangeError('spacing must be between 10 and 500 pixels');
  }
  if (size < 10 || size > 200) {
    throw new RangeError('size must be between 10 and 200');
  }
  if (originX < 0 || originY < 0) {
    throw new RangeError('origin coordinates cannot be negative');
  }

  // Text shapes require text content
  if (shapeType === 'text' && !text) {
    throw new TypeError('text content is required for text shapes');
  }

  // Generate grid of shapes
  const shapes = [];
  const baseZIndex = Date.now();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Calculate position for this cell
      const x = parseFloat((originX + col * spacing).toFixed(2));
      const y = parseFloat((originY + row * spacing).toFixed(2));

      // Build shape configuration based on type
      let shapeConfig = {
        x,
        y,
        fill: color, // Use 'fill' to match existing shape schema
        zIndex: baseZIndex + (row * cols + col),
        type: shapeType
      };

      // Add type-specific properties
      switch (shapeType) {
        case 'circle':
          shapeConfig.radius = size;
          break;

        case 'rectangle':
          shapeConfig.width = size; // Use size directly for width
          shapeConfig.height = size; // Use size directly for height (makes squares)
          break;

        case 'triangle':
          shapeConfig.radius = size; // Triangle uses radius like circle
          break;

        case 'text':
          shapeConfig.text = text;
          shapeConfig.fontSize = fontSize;
          shapeConfig.width = size * 4; // Text needs width for layout
          shapeConfig.height = fontSize * 1.5; // Height based on font size
          break;
      }

      shapes.push(shapeConfig);
    }
  }

  return shapes;
}

/**
 * Validates grid configuration without generating shapes
 * Useful for pre-validation in UI or executors
 * 
 * @param {Object} options - Grid configuration options (same as generateGrid)
 * @returns {Object} Validation result: { valid: boolean, error?: string }
 * 
 * @example
 * const result = validateGridConfig({ rows: 15, cols: 15, shapeType: 'circle', color: 'red' });
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 */
export function validateGridConfig(options) {
  try {
    // Try to generate grid (will throw on invalid config)
    generateGrid(options);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

