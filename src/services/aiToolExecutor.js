/**
 * AI Tool Executor
 * Executes tool calls from the AI agent
 * Bridges AI commands with Canvas actions
 */

import { v4 as uuidv4 } from 'uuid';
import { normalizeColor } from '../utils/colorNormalizer';
import { SHAPE_TYPES } from '../utils/shapes';

// Canvas bounds for validation
const CANVAS_BOUNDS = {
  minX: 0,
  minY: 0,
  maxX: 1920,
  maxY: 1080,
};

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validates and clamps coordinates to canvas bounds
 */
function validateCoordinates(x, y) {
  return {
    x: clamp(x, CANVAS_BOUNDS.minX, CANVAS_BOUNDS.maxX),
    y: clamp(y, CANVAS_BOUNDS.minY, CANVAS_BOUNDS.maxY),
  };
}

/**
 * Creates the tool executor with injected dependencies
 * @param {Object} deps - Dependencies
 * @param {Function} deps.addShape - Function to add a shape to the canvas
 * @param {Function} deps.addShapesBatch - Function to add multiple shapes at once
 * @param {Function} deps.getShapes - Function to get current canvas shapes
 * @param {Function} deps.getViewportCenter - Function to get the center of the user's viewport in canvas coordinates
 * @returns {Object} Tool executor functions
 */
export function createAIToolExecutor({ addShape, addShapesBatch, getShapes, getViewportCenter }) {
  /**
   * Execute createShape tool
   * @param {Object} args - Tool arguments from AI
   * @param {string} args.shapeType - Shape type (rectangle, circle, text, triangle)
   * @param {number} args.x - X coordinate
   * @param {number} args.y - Y coordinate
   * @param {string} args.fill - Color (hex, CSS keyword, rgb, hsl)
   * @param {number} [args.width] - Width (for rectangle/triangle)
   * @param {number} [args.height] - Height (for rectangle/triangle)
   * @param {number} [args.radius] - Radius (for circle)
   * @param {string} [args.text] - Text content (for text shape)
   * @param {number} [args.fontSize] - Font size (for text shape)
   * @returns {Promise<Object>} Result object { success: boolean, shapeId?: string, error?: string }
   */
  async function executeCreateShape(args) {
    try {
      // Support both 'shapeType' (from schema) and 'type' (legacy)
      const type = args.shapeType || args.type;
      const color = args.fill || args.color;

      // Validate required fields (x, y, and color are optional - will use defaults)
      if (!type) {
        return { success: false, error: 'Missing required field: shapeType' };
      }

      // Normalize shape type to internal format
      let shapeType;
      let isSquare = false;
      const typeNormalized = type.toLowerCase();
      if (typeNormalized === 'rectangle' || typeNormalized === 'rect') {
        shapeType = SHAPE_TYPES.RECT;
      } else if (typeNormalized === 'square') {
        shapeType = SHAPE_TYPES.RECT;
        isSquare = true; // Flag to ensure equal sides
      } else if (typeNormalized === 'circle') {
        shapeType = SHAPE_TYPES.CIRCLE;
      } else if (typeNormalized === 'text') {
        shapeType = SHAPE_TYPES.TEXT;
      } else if (typeNormalized === 'triangle') {
        shapeType = SHAPE_TYPES.TRIANGLE;
      } else {
        return { success: false, error: `Invalid shape type: ${type}. Supported types: rectangle, circle, text, triangle, square` };
      }

      // Normalize color (default to blue if not provided)
      const colorToUse = color || '#0000FF';
      let hexColor;
      try {
        const colorResult = normalizeColor(colorToUse);
        hexColor = colorResult.hex;
      } catch (error) {
        return { success: false, error: `Invalid color: ${error.message}` };
      }

      // Get coordinates: use provided x,y or viewport center
      let x = args.x;
      let y = args.y;
      
      // If position not provided, use viewport center
      if (typeof x !== 'number' || typeof y !== 'number') {
        const viewportCenter = getViewportCenter ? getViewportCenter() : { x: 500, y: 400 };
        x = typeof x === 'number' ? x : viewportCenter.x;
        y = typeof y === 'number' ? y : viewportCenter.y;
      }

      // Validate and clamp coordinates
      const coords = validateCoordinates(x, y);

      // Build shape object based on type
      const shapeId = uuidv4();
      const baseShape = {
        id: shapeId,
        type: shapeType,
        x: coords.x,
        y: coords.y,
        fill: hexColor,
        stroke: '#000000',
        strokeWidth: 2,
        draggable: true,
        zIndex: Date.now(),
        createdBy: 'AI',
      };

      let shape;

      switch (shapeType) {
        case SHAPE_TYPES.RECT:
          // Use provided dimensions or defaults
          let rectWidth = typeof args.width === 'number' ? args.width : 100;
          let rectHeight = typeof args.height === 'number' ? args.height : 100;
          
          // For squares, ensure equal sides
          if (isSquare) {
            // If user specified a size, use it for both dimensions
            if (typeof args.width === 'number' && typeof args.height !== 'number') {
              rectHeight = rectWidth;
            } else if (typeof args.height === 'number' && typeof args.width !== 'number') {
              rectWidth = rectHeight;
            } else if (typeof args.width === 'number' && typeof args.height === 'number') {
              // Both specified - use the larger one to ensure it's a proper square
              const size = Math.max(rectWidth, rectHeight);
              rectWidth = size;
              rectHeight = size;
            }
            // If neither specified, defaults (100x100) already make a square
          }
          
          shape = {
            ...baseShape,
            width: Math.max(10, rectWidth), // Min size 10px
            height: Math.max(10, rectHeight),
          };
          break;

        case SHAPE_TYPES.CIRCLE:
          // Use provided radius or default
          const circleRadius = typeof args.radius === 'number' ? args.radius : 50;
          
          shape = {
            ...baseShape,
            radius: Math.max(5, circleRadius), // Min radius 5px
          };
          break;

        case SHAPE_TYPES.TEXT:
          if (!args.text || typeof args.text !== 'string') {
            return { success: false, error: 'Text shape requires text content' };
          }
          shape = {
            ...baseShape,
            text: args.text,
            fontSize: args.fontSize && typeof args.fontSize === 'number' ? args.fontSize : 16,
          };
          break;

        case SHAPE_TYPES.TRIANGLE:
          // Use provided dimensions or defaults
          const triangleWidth = typeof args.width === 'number' ? args.width : 100;
          const triangleHeight = typeof args.height === 'number' ? args.height : 100;
          
          shape = {
            ...baseShape,
            width: Math.max(10, triangleWidth),
            height: Math.max(10, triangleHeight),
            rotation: 0,
          };
          break;

        default:
          return { success: false, error: `Unsupported shape type: ${shapeType}` };
      }

      // Add shape to canvas via injected action
      await addShape(shape);

      return {
        success: true,
        shapeId: shape.id,
        message: `Created ${type} at (${coords.x}, ${coords.y})`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create shape: ${error.message}`,
      };
    }
  }

  /**
   * Execute getCanvasState tool
   * Returns current shapes sorted by creation time (newest first)
   * Marks the most recent shape with isRecent flag
   * @returns {Object} Canvas state with shapes array
   */
  function executeGetCanvasState() {
    try {
      const shapes = getShapes();

      // Sort shapes by creation time (newest first)
      // Use zIndex as proxy for creation time (it's set to Date.now() on creation)
      const sortedShapes = [...shapes].sort((a, b) => {
        const aTime = a.createdAt || a.zIndex || 0;
        const bTime = b.createdAt || b.zIndex || 0;
        return bTime - aTime; // Descending (newest first)
      });

      // Map to simplified format for AI
      const simplifiedShapes = sortedShapes.map((shape, index) => ({
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        fill: shape.fill,
        ...(shape.width !== undefined && { width: shape.width }),
        ...(shape.height !== undefined && { height: shape.height }),
        ...(shape.radius !== undefined && { radius: shape.radius }),
        ...(shape.text !== undefined && { text: shape.text }),
        ...(shape.fontSize !== undefined && { fontSize: shape.fontSize }),
        isRecent: index === 0, // Mark the newest shape
      }));

      return {
        success: true,
        shapes: simplifiedShapes,
        totalShapes: simplifiedShapes.length,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get canvas state: ${error.message}`,
        shapes: [],
      };
    }
  }

  return {
    executeCreateShape,
    executeGetCanvasState,
  };
}

/**
 * Default export for backward compatibility
 * Note: Requires initialization with dependencies before use
 */
export default createAIToolExecutor;

