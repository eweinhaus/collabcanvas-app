/**
 * AI Tool Executor
 * Executes tool calls from the AI agent
 * Bridges AI commands with Canvas actions
 */

import { v4 as uuidv4 } from 'uuid';
import { normalizeColor } from '../utils/colorNormalizer';
import { SHAPE_TYPES } from '../utils/shapes';
import { identifyShape } from '../utils/shapeIdentification';
import { generateGrid, validateGridConfig } from '../utils/gridGenerator';
import { 
  normalizeShapeSpec, 
  calcVerticalPositions, 
  calcHorizontalPositions,
  convertToShapeObjects,
  validateShapeBatch,
} from '../utils/batchCreate';
import {
  buildCreativeObjectPlanningPrompt,
  parseCreativeObjectPlan,
  validateCreativeObjectPlan,
  createFallbackPlan,
  CREATIVE_OBJECT_CONSTRAINTS,
} from '../utils/creativeObjectPlanner';
import { postChat } from './openaiService';

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
 * @param {Function} deps.updateShape - Function to update a shape on the canvas
 * @param {Function} deps.getShapes - Function to get current canvas shapes
 * @param {Function} deps.getViewportCenter - Function to get the center of the user's viewport in canvas coordinates
 * @returns {Object} Tool executor functions
 */
export function createAIToolExecutor({ addShape, addShapesBatch, updateShape, getShapes, getViewportCenter }) {
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

  /**
   * Execute moveShape tool
   * Moves a shape to a new position using descriptor-based identification
   * @param {Object} args - Tool arguments from AI
   * @param {string} args.descriptor - Natural language descriptor (e.g., "blue rectangle", "red circle")
   * @param {number} args.x - New X coordinate
   * @param {number} args.y - New Y coordinate
   * @returns {Promise<Object>} Result object { success: boolean, shapeId?: string, error?: string }
   */
  async function executeMoveShape(args) {
    try {
      // Validate required fields
      if (!args.descriptor || typeof args.descriptor !== 'string') {
        return { success: false, error: 'Missing required field: descriptor (string)' };
      }

      if (typeof args.x !== 'number' || typeof args.y !== 'number') {
        return { success: false, error: 'Missing required fields: x and y coordinates (numbers)' };
      }

      // Get current shapes
      const shapes = getShapes();

      if (!shapes || shapes.length === 0) {
        return { success: false, error: 'Canvas is empty - no shapes to move' };
      }

      // Identify the shape using natural language descriptor
      let targetShape;
      try {
        targetShape = identifyShape(shapes, args.descriptor, { allowPartial: false });
      } catch (error) {
        return { 
          success: false, 
          error: `Could not find shape: ${error.message}`,
        };
      }

      if (!targetShape) {
        return { 
          success: false, 
          error: `No shape found matching "${args.descriptor}"`,
        };
      }

      // Validate and clamp new coordinates
      const coords = validateCoordinates(args.x, args.y);

      // Update shape position
      await updateShape(targetShape.id, { x: coords.x, y: coords.y });

      return {
        success: true,
        shapeId: targetShape.id,
        message: `Moved ${targetShape.type} to (${coords.x}, ${coords.y})`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to move shape: ${error.message}`,
      };
    }
  }

  /**
   * Execute rotateShape tool
   * Rotates a shape by a specified angle using descriptor-based identification
   * @param {Object} args - Tool arguments from AI
   * @param {string} args.descriptor - Natural language descriptor (e.g., "blue rectangle", "red circle")
   * @param {number} args.rotation - Rotation angle in degrees (0-359)
   * @returns {Promise<Object>} Result object { success: boolean, shapeId?: string, error?: string }
   */
  async function executeRotateShape(args) {
    try {
      // Validate required fields
      if (!args.descriptor || typeof args.descriptor !== 'string') {
        return { success: false, error: 'Missing required field: descriptor (string)' };
      }

      if (typeof args.rotation !== 'number') {
        return { success: false, error: 'Missing required field: rotation (number in degrees)' };
      }

      // Validate rotation range (0-359 degrees)
      if (args.rotation < 0 || args.rotation >= 360) {
        return { 
          success: false, 
          error: 'Rotation must be between 0 and 359 degrees',
        };
      }

      // Get current shapes
      const shapes = getShapes();

      if (!shapes || shapes.length === 0) {
        return { success: false, error: 'Canvas is empty - no shapes to rotate' };
      }

      // Identify the shape using natural language descriptor
      let targetShape;
      try {
        targetShape = identifyShape(shapes, args.descriptor, { allowPartial: false });
      } catch (error) {
        return { 
          success: false, 
          error: `Could not find shape: ${error.message}`,
        };
      }

      if (!targetShape) {
        return { 
          success: false, 
          error: `No shape found matching "${args.descriptor}"`,
        };
      }

      // Check if shape type supports rotation
      // Note: Circles don't visually rotate, but we'll allow it for consistency
      const supportsRotation = [SHAPE_TYPES.RECT, SHAPE_TYPES.TRIANGLE, SHAPE_TYPES.TEXT, SHAPE_TYPES.CIRCLE];
      if (!supportsRotation.includes(targetShape.type)) {
        return {
          success: false,
          error: `Shape type ${targetShape.type} does not support rotation`,
        };
      }

      // Update shape rotation
      await updateShape(targetShape.id, { rotation: args.rotation });

      return {
        success: true,
        shapeId: targetShape.id,
        message: `Rotated ${targetShape.type} to ${args.rotation} degrees`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to rotate shape: ${error.message}`,
      };
    }
  }

  /**
   * Execute createGrid tool
   * Creates a grid of identical shapes using batch write
   * @param {Object} args - Tool arguments from AI
   * @param {string} args.shapeType - Shape type (circle, rectangle, triangle, text)
   * @param {number} args.rows - Number of rows (1-20)
   * @param {number} args.cols - Number of columns (1-20)
   * @param {string} args.color - Color for all shapes
   * @param {number} [args.originX=200] - Top-left X coordinate
   * @param {number} [args.originY=200] - Top-left Y coordinate
   * @param {number} [args.spacing=120] - Spacing between shape centers (10-500)
   * @param {number} [args.size=50] - Shape size (10-200)
   * @param {string} [args.text] - Text content (for text shapes)
   * @param {number} [args.fontSize=24] - Font size (for text shapes)
   * @returns {Promise<Object>} Result object { success: boolean, shapeIds?: string[], error?: string }
   */
  async function executeCreateGrid(args) {
    try {
      // Support both 'shapeType' and 'type' parameter names
      const shapeType = args.shapeType || args.type;
      const color = args.color || args.fill;

      // Validate required fields
      if (!shapeType) {
        return { success: false, error: 'Missing required field: shapeType' };
      }
      if (typeof args.rows !== 'number') {
        return { success: false, error: 'Missing required field: rows (number)' };
      }
      if (typeof args.cols !== 'number') {
        return { success: false, error: 'Missing required field: cols (number)' };
      }
      if (!color) {
        return { success: false, error: 'Missing required field: color' };
      }

      // Normalize shape type
      let normalizedType;
      const typeNormalized = shapeType.toLowerCase();
      if (typeNormalized === 'rectangle' || typeNormalized === 'rect') {
        normalizedType = 'rectangle';
      } else if (typeNormalized === 'circle') {
        normalizedType = 'circle';
      } else if (typeNormalized === 'text') {
        normalizedType = 'text';
      } else if (typeNormalized === 'triangle') {
        normalizedType = 'triangle';
      } else {
        return { 
          success: false, 
          error: `Invalid shape type: ${shapeType}. Supported types: rectangle, circle, text, triangle`,
        };
      }

      // Normalize color
      let hexColor;
      try {
        const colorResult = normalizeColor(color);
        hexColor = colorResult.hex;
      } catch (error) {
        return { success: false, error: `Invalid color: ${error.message}` };
      }

      // Build grid configuration with safety clamps (executor-level validation)
      const rawSpacing = args.spacing;
      const safeSpacing = (typeof rawSpacing === 'number' && rawSpacing >= 10 && rawSpacing <= 500)
        ? rawSpacing
        : 120;

      const rawSize = args.size;
      const safeSize = (typeof rawSize === 'number' && rawSize >= 10 && rawSize <= 200)
        ? rawSize
        : 50;

      const rawOriginX = (args.originX !== undefined ? args.originX : (args.x !== undefined ? args.x : 200));
      const rawOriginY = (args.originY !== undefined ? args.originY : (args.y !== undefined ? args.y : 200));
      const safeOriginX = Math.max(0, rawOriginX);
      const safeOriginY = Math.max(0, rawOriginY);

      // Build grid configuration
      const gridConfig = {
        shapeType: normalizedType,
        rows: args.rows,
        cols: args.cols,
        color: hexColor,
        spacing: safeSpacing,
        // Support both originX/originY (our utility) and x/y (tool schema)
        originX: safeOriginX,
        originY: safeOriginY,
        size: safeSize,
      };

      // Add text-specific fields if needed
      if (normalizedType === 'text') {
        if (!args.text || typeof args.text !== 'string') {
          return { success: false, error: 'Text grid requires text content' };
        }
        gridConfig.text = args.text;
        gridConfig.fontSize = args.fontSize !== undefined ? args.fontSize : 24;
      }

      // Validate grid configuration (task 16.13)
      const validation = validateGridConfig(gridConfig);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate grid layout
      let shapeConfigs;
      try {
        shapeConfigs = generateGrid(gridConfig);
      } catch (error) {
        return { 
          success: false, 
          error: `Failed to generate grid: ${error.message}`,
        };
      }

      // Convert grid configs to full shape objects with IDs and metadata
      const shapes = shapeConfigs.map((config) => {
        const shapeId = uuidv4();
        
        // Map to internal shape type constants
        let internalType;
        switch (config.type) {
          case 'rectangle':
            internalType = SHAPE_TYPES.RECT;
            break;
          case 'circle':
            internalType = SHAPE_TYPES.CIRCLE;
            break;
          case 'text':
            internalType = SHAPE_TYPES.TEXT;
            break;
          case 'triangle':
            internalType = SHAPE_TYPES.TRIANGLE;
            break;
          default:
            internalType = config.type;
        }

        return {
          id: shapeId,
          type: internalType,
          x: config.x,
          y: config.y,
          fill: config.fill,
          stroke: '#000000',
          strokeWidth: 2,
          draggable: true,
          zIndex: config.zIndex,
          createdBy: 'AI',
          ...(config.width !== undefined && { width: config.width }),
          ...(config.height !== undefined && { height: config.height }),
          ...(config.radius !== undefined && { radius: config.radius }),
          ...(config.text !== undefined && { text: config.text }),
          ...(config.fontSize !== undefined && { fontSize: config.fontSize }),
        };
      });

      // Batch create all shapes (task 16.14)
      await addShapesBatch(shapes);

      const totalShapes = shapes.length;
      return {
        success: true,
        shapeIds: shapes.map(s => s.id),
        message: `Created ${totalShapes} ${normalizedType}${totalShapes !== 1 ? 's' : ''} in ${args.rows}×${args.cols} grid at (${gridConfig.originX}, ${gridConfig.originY})`,
        totalShapes,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create grid: ${error.message}`,
      };
    }
  }

  /**
   * Execute createShapesVertically tool
   * Creates multiple shapes stacked vertically (forms, lists, vertical layouts)
   * @param {Object} args - Tool arguments from AI
   * @param {Array} args.shapes - Array of shape specifications
   * @param {number} args.originX - Starting X coordinate
   * @param {number} args.originY - Starting Y coordinate
   * @param {number} [args.spacing=25] - Vertical spacing between shapes (5-200)
   * @returns {Promise<Object>} Result object { success: boolean, shapeIds?: string[], error?: string }
   */
  async function executeCreateShapesVertically(args) {
    try {
      // Validate required fields
      if (!args.shapes || !Array.isArray(args.shapes)) {
        return { success: false, error: 'Missing required field: shapes (array)' };
      }
      
      if (typeof args.originX !== 'number') {
        return { success: false, error: 'Missing required field: originX (number)' };
      }
      
      if (typeof args.originY !== 'number') {
        return { success: false, error: 'Missing required field: originY (number)' };
      }

      if (args.shapes.length < 2) {
        return { success: false, error: 'createShapesVertically requires at least 2 shapes' };
      }

      if (args.shapes.length > 100) {
        return { 
          success: false, 
          error: `Too many shapes: ${args.shapes.length}. Maximum 100 shapes per batch.`,
        };
      }

      // Normalize each shape specification
      let normalizedShapes;
      try {
        normalizedShapes = args.shapes.map((spec, index) => {
          try {
            return normalizeShapeSpec(spec);
          } catch (error) {
            throw new Error(`Shape at index ${index}: ${error.message}`);
          }
        });
      } catch (error) {
        return { success: false, error: error.message };
      }

      // Calculate vertical positions
      const spacing = args.spacing !== undefined ? args.spacing : 25;
      const shapesWithPositions = calcVerticalPositions(normalizedShapes, {
        originX: args.originX,
        originY: args.originY,
        spacing,
      });

      // Convert to full shape objects
      const shapeObjects = convertToShapeObjects(shapesWithPositions);

      // Validate batch
      const validation = validateShapeBatch(shapeObjects);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Batch create all shapes
      await addShapesBatch(shapeObjects);

      const totalShapes = shapeObjects.length;
      return {
        success: true,
        shapeIds: shapeObjects.map(s => s.id),
        message: `Created ${totalShapes} shape${totalShapes !== 1 ? 's' : ''} vertically at (${args.originX}, ${args.originY})`,
        totalShapes,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create shapes vertically: ${error.message}`,
      };
    }
  }

  /**
   * Execute createShapesHorizontally tool
   * Creates multiple shapes arranged horizontally (nav bars, button groups, horizontal layouts)
   * @param {Object} args - Tool arguments from AI
   * @param {Array} args.shapes - Array of shape specifications
   * @param {number} args.originX - Starting X coordinate
   * @param {number} args.originY - Y coordinate (same for all shapes)
   * @param {number} [args.spacing=20] - Horizontal spacing between shapes (5-500)
   * @returns {Promise<Object>} Result object { success: boolean, shapeIds?: string[], error?: string }
   */
  async function executeCreateShapesHorizontally(args) {
    try {
      // Validate required fields
      if (!args.shapes || !Array.isArray(args.shapes)) {
        return { success: false, error: 'Missing required field: shapes (array)' };
      }
      
      if (typeof args.originX !== 'number') {
        return { success: false, error: 'Missing required field: originX (number)' };
      }
      
      if (typeof args.originY !== 'number') {
        return { success: false, error: 'Missing required field: originY (number)' };
      }

      if (args.shapes.length < 2) {
        return { success: false, error: 'createShapesHorizontally requires at least 2 shapes' };
      }

      if (args.shapes.length > 100) {
        return { 
          success: false, 
          error: `Too many shapes: ${args.shapes.length}. Maximum 100 shapes per batch.`,
        };
      }

      // Normalize each shape specification
      let normalizedShapes;
      try {
        normalizedShapes = args.shapes.map((spec, index) => {
          try {
            return normalizeShapeSpec(spec);
          } catch (error) {
            throw new Error(`Shape at index ${index}: ${error.message}`);
          }
        });
      } catch (error) {
        return { success: false, error: error.message };
      }

      // Calculate horizontal positions
      const spacing = args.spacing !== undefined ? args.spacing : 20;
      const shapesWithPositions = calcHorizontalPositions(normalizedShapes, {
        originX: args.originX,
        originY: args.originY,
        spacing,
      });

      // Convert to full shape objects
      const shapeObjects = convertToShapeObjects(shapesWithPositions);

      // Validate batch
      const validation = validateShapeBatch(shapeObjects);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Batch create all shapes
      await addShapesBatch(shapeObjects);

      const totalShapes = shapeObjects.length;
      return {
        success: true,
        shapeIds: shapeObjects.map(s => s.id),
        message: `Created ${totalShapes} shape${totalShapes !== 1 ? 's' : ''} horizontally at (${args.originX}, ${args.originY})`,
        totalShapes,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create shapes horizontally: ${error.message}`,
      };
    }
  }

  /**
   * Execute createCreativeObject tool
   * Creates a creative object (dinosaur, bus, etc.) using 10-20 shapes
   * Uses a two-step process: LLM planning → shape generation
   * @param {Object} args - Tool arguments from AI
   * @param {string} args.objectType - Type of object to create
   * @param {number} [args.x] - Center X coordinate (optional, defaults to viewport center)
   * @param {number} [args.y] - Center Y coordinate (optional, defaults to viewport center)
   * @param {number} [args.scale=1.0] - Size scale factor (0.5-2.0)
   * @returns {Promise<Object>} Result object { success: boolean, shapeIds?: string[], error?: string }
   */
  async function executeCreateCreativeObject(args) {
    try {
      const { objectType, x, y, scale = 1.0 } = args;

      if (!objectType || typeof objectType !== 'string') {
        return { success: false, error: 'Missing required field: objectType (string)' };
      }

      // Validate scale (use Number.isFinite to catch NaN)
      if (!Number.isFinite(scale) || 
          scale < CREATIVE_OBJECT_CONSTRAINTS.MIN_SCALE || 
          scale > CREATIVE_OBJECT_CONSTRAINTS.MAX_SCALE) {
        return { success: false, error: `Invalid scale: ${scale}. Scale must be between ${CREATIVE_OBJECT_CONSTRAINTS.MIN_SCALE} and ${CREATIVE_OBJECT_CONSTRAINTS.MAX_SCALE}` };
      }

      // Determine center position (use provided or viewport center)
      const viewportCenter = getViewportCenter ? getViewportCenter() : { x: 500, y: 400 };
      const centerX = typeof x === 'number' ? x : viewportCenter.x;
      const centerY = typeof y === 'number' ? y : viewportCenter.y;

      console.log(`🎨 [Creative Object] Planning "${objectType}" at (${centerX}, ${centerY}) with scale ${scale}`);

      // STEP 1: Call GPT-4o to plan the object
      const planningStartTime = performance.now();
      const planningPrompt = buildCreativeObjectPlanningPrompt(objectType, centerX, centerY, scale);

      let planResponse;
      try {
        planResponse = await postChat(
          [{ role: 'user', content: planningPrompt }],
          { 
            model: 'gpt-4o',
            temperature: 0.7, // Higher temperature for more creative designs
          }
        );
      } catch (error) {
        console.error('Planning API call failed:', error);
        // Use fallback instead of failing completely
        console.log('Planning API failed, using fallback plan...');
        const fallbackPlan = createFallbackPlan(objectType, centerX, centerY, scale);
        return await executePlan(fallbackPlan, objectType);
      }

      const planningEndTime = performance.now();
      console.log(`🎨 [Creative Object] Planning completed in ${Math.round(planningEndTime - planningStartTime)}ms`);

      // STEP 2: Parse and validate the plan
      if (!planResponse || !planResponse.choices || !planResponse.choices[0]) {
        console.error('Invalid plan response structure');
        console.log('Using fallback plan...');
        const fallbackPlan = createFallbackPlan(objectType, centerX, centerY, scale);
        return await executePlan(fallbackPlan, objectType);
      }

      const responseText = planResponse.choices[0].message?.content || '';
      
      let plan;
      try {
        plan = parseCreativeObjectPlan(responseText);
      } catch (parseError) {
        console.error('Failed to parse plan:', parseError.message);
        // Log truncated response (first 200 chars) to avoid console spam
        console.log('Response preview:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        console.log('Using fallback plan...');
        const fallbackPlan = createFallbackPlan(objectType, centerX, centerY, scale);
        return await executePlan(fallbackPlan, objectType);
      }

      // Validate the plan
      const validation = validateCreativeObjectPlan(plan);
      if (!validation.valid) {
        console.error('Plan validation failed:', validation.error);
        console.log('Using fallback plan...');
        const fallbackPlan = createFallbackPlan(objectType, centerX, centerY, scale);
        return await executePlan(fallbackPlan, objectType);
      }

      console.log(`🎨 [Creative Object] Plan validated: ${plan.shapes.length} shapes`);

      // STEP 3: Execute the plan
      return await executePlan(plan, objectType);

    } catch (error) {
      console.error('Creative object generation error:', error);
      return {
        success: false,
        error: `Failed to create ${args.objectType}: ${error.message}`,
      };
    }
  }

  /**
   * Execute a validated creative object plan
   * Normalizes colors and clamps coordinates before creating shapes
   * @param {Object} plan - Validated plan with shapes array
   * @param {string} objectType - Type of object (for logging)
   * @returns {Promise<Object>} Result object
   */
  async function executePlan(plan, objectType) {
    try {
      const baseZIndex = Date.now();
      const errors = [];

      // Convert plan shapes to canvas shape objects
      const shapes = [];
      
      for (let i = 0; i < plan.shapes.length; i++) {
        try {
          const spec = plan.shapes[i];
          const shapeId = uuidv4();

          // Map plan type to internal SHAPE_TYPES
          let internalType;
          switch (spec.type) {
            case 'rectangle':
              internalType = SHAPE_TYPES.RECT;
              break;
            case 'circle':
              internalType = SHAPE_TYPES.CIRCLE;
              break;
            case 'triangle':
              internalType = SHAPE_TYPES.TRIANGLE;
              break;
            default:
              throw new Error(`Unknown shape type: ${spec.type}`);
          }

          // Normalize color (handle CSS color names and hex codes)
          let hexColor;
          try {
            const colorResult = normalizeColor(spec.fill);
            hexColor = colorResult.hex;
          } catch (colorError) {
            console.warn(`Shape ${i}: Invalid color "${spec.fill}", using blue`);\n            hexColor = '#0000FF'; // Fallback to blue
            errors.push(`Shape ${i}: Color "${spec.fill}" normalized to blue`);\n          }

          // Clamp coordinates to canvas bounds (with margin for edge cases)
          const coords = validateCoordinates(spec.x, spec.y);
          
          // Build shape object
          const shape = {
            id: shapeId,
            type: internalType,
            x: coords.x,
            y: coords.y,
            fill: hexColor,
            stroke: spec.stroke || '#000000',
            strokeWidth: spec.strokeWidth || 2,
            draggable: true,
            zIndex: baseZIndex + i, // Layer shapes in order
            createdBy: 'AI',
          };

          // Add type-specific properties
          if (internalType === SHAPE_TYPES.CIRCLE) {
            shape.radius = Math.max(5, Math.min(500, spec.radius)); // Clamp radius
          } else {
            // Rectangle and triangle
            shape.width = Math.max(10, Math.min(1000, spec.width)); // Clamp width
            shape.height = Math.max(10, Math.min(1000, spec.height)); // Clamp height
          }

          // Add rotation if specified (ensure 0-359 range)
          if (spec.rotation !== undefined) {
            shape.rotation = spec.rotation % 360;
            if (shape.rotation < 0) shape.rotation += 360;
          }

          shapes.push(shape);

        } catch (shapeError) {
          console.error(`Failed to process shape ${i}:`, shapeError);
          errors.push(`Shape ${i} skipped: ${shapeError.message}`);\n        }
      }

      // Ensure we have at least some shapes
      if (shapes.length === 0) {
        return {
          success: false,
          error: 'No valid shapes could be created from plan',
        };
      }

      // STEP 4: Batch create all shapes
      const createStartTime = performance.now();
      await addShapesBatch(shapes);
      const createEndTime = performance.now();
      
      console.log(`🎨 [Creative Object] Created ${shapes.length} shapes in ${Math.round(createEndTime - createStartTime)}ms`);
      if (errors.length > 0) {
        console.warn(`🎨 [Creative Object] ${errors.length} warnings:`, errors);
      }

      return {
        success: true,
        shapeIds: shapes.map(s => s.id),
        message: `Created ${objectType} with ${shapes.length} shapes!`,
        totalShapes: shapes.length,
      };

    } catch (error) {
      console.error('Plan execution error:', error);
      return {
        success: false,
        error: `Failed to create ${objectType}. Please try again.`,
      };
    }
  }

  return {
    executeCreateShape,
    executeGetCanvasState,
    executeMoveShape,
    executeRotateShape,
    executeCreateGrid,
    executeCreateShapesVertically,
    executeCreateShapesHorizontally,
    executeCreateCreativeObject,
  };
}

/**
 * Default export for backward compatibility
 * Note: Requires initialization with dependencies before use
 */
export default createAIToolExecutor;

