/**
 * AI Tool Executor
 * 
 * Executes tool calls from OpenAI API and translates them into canvas actions.
 * This service bridges the AI layer with the canvas context.
 */

import { createShape, SHAPE_TYPES } from '../utils/shapes';
import { normalizeColor } from '../utils/colorNormalizer';
import { identifyShape } from '../utils/shapeIdentification';
import { generateGrid, DEFAULT_GRID_CONFIG } from '../utils/gridGenerator';
import { batchCreateShapes, validateBatchSize } from '../utils/batchCreateShapes';

/**
 * Map AI tool shape types to canvas shape types
 */
const TOOL_TYPE_TO_SHAPE_TYPE = {
  'circle': SHAPE_TYPES.CIRCLE,
  'rectangle': SHAPE_TYPES.RECT,
  'text': SHAPE_TYPES.TEXT,
  'triangle': SHAPE_TYPES.TRIANGLE,
};

/**
 * Resolve shape ID from args (either explicit ID or descriptor)
 * @param {Object} args - Tool arguments that may contain id, color, type, etc.
 * @param {Object} canvasState - Canvas state with shapes array
 * @returns {Object} { success, shapeId, shape, error }
 */
const resolveShapeId = (args, canvasState) => {
  // If ID is explicitly provided, use it directly
  if (args.id) {
    const shape = canvasState.shapes.find((s) => s.id === args.id);
    if (shape) {
      return { success: true, shapeId: args.id, shape };
    } else {
      return { success: false, error: `Shape with ID "${args.id}" not found` };
    }
  }

  // Otherwise, try to identify by descriptor
  const descriptor = {
    color: args.color,
    type: args.type,
    position: args.position,
    index: args.index,
  };

  const result = identifyShape(canvasState.shapes, descriptor);
  
  if (result.success && result.shape) {
    return {
      success: true,
      shapeId: result.shape.id,
      shape: result.shape,
    };
  } else {
    return {
      success: false,
      error: result.error || 'Could not identify shape',
    };
  }
};

/**
 * Resolve multiple shape IDs for bulk operations
 * @param {Object} args - Tool arguments
 * @param {Object} canvasState - Canvas state with shapes array
 * @returns {Object} { success, shapes, count, error }
 */
const resolveMultipleShapes = (args, canvasState) => {
  const descriptor = {
    color: args.color,
    type: args.type,
    all: true, // Always get all matches for bulk operations
  };

  const result = identifyShape(canvasState.shapes, descriptor);
  
  if (result.success && result.shapes && result.shapes.length > 0) {
    return {
      success: true,
      shapes: result.shapes,
      count: result.count,
    };
  } else {
    return {
      success: false,
      error: result.error || 'Could not identify shapes',
      count: 0,
    };
  }
};

/**
 * Execute createShape tool call
 * @param {Object} args - Tool call arguments from OpenAI
 * @param {Object} canvasActions - Canvas context actions (firestoreActions)
 * @returns {Promise<Object>} Result with success status and created shape
 */
export const executeCreateShape = async (args, canvasActions) => {
  try {
    // Validate required parameters
    if (!args.type) {
      throw new Error('Shape type is required');
    }
    if (typeof args.x !== 'number' || typeof args.y !== 'number') {
      throw new Error('Valid x and y coordinates are required');
    }
    if (!args.color) {
      throw new Error('Color is required');
    }

    // Map tool type to shape type
    const shapeType = TOOL_TYPE_TO_SHAPE_TYPE[args.type];
    if (!shapeType) {
      throw new Error(`Unknown shape type: ${args.type}`);
    }

    // Normalize color
    let normalizedColor;
    try {
      normalizedColor = normalizeColor(args.color);
    } catch (error) {
      throw new Error(`Invalid color: ${args.color}. ${error.message}`);
    }

    // Build shape overrides
    const overrides = {
      fill: normalizedColor,
    };

    // Handle shape-specific parameters
    if (shapeType === SHAPE_TYPES.CIRCLE) {
      if (args.radius !== undefined && args.radius > 0) {
        overrides.radius = args.radius;
      }
    } else if (shapeType === SHAPE_TYPES.RECT || shapeType === SHAPE_TYPES.TRIANGLE) {
      if (args.width !== undefined && args.width > 0) {
        overrides.width = args.width;
      }
      if (args.height !== undefined && args.height > 0) {
        overrides.height = args.height;
      }
    } else if (shapeType === SHAPE_TYPES.TEXT) {
      if (!args.text) {
        throw new Error('Text content is required for text shapes');
      }
      overrides.text = args.text;
      if (args.width !== undefined && args.width > 0) {
        overrides.width = args.width;
      }
      if (args.height !== undefined && args.height > 0) {
        overrides.height = args.height;
      }
      // For text shapes, use fill for text color
      overrides.fill = normalizedColor;
    }

    // Create the shape
    const shape = createShape(shapeType, args.x, args.y, overrides);

    // Add to canvas via Firestore
    await canvasActions.addShape(shape);

    return {
      success: true,
      shape,
      message: `Created ${args.type} at (${Math.round(args.x)}, ${Math.round(args.y)})`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to create shape: ${error.message}`,
    };
  }
};

/**
 * Execute getCanvasState tool call
 * @param {Object} args - Tool call arguments (unused)
 * @param {Object} canvasState - Canvas state from context
 * @returns {Promise<Object>} Result with canvas state (enhanced with full properties)
 */
export const executeGetCanvasState = async (args, canvasState) => {
  try {
    const { shapes } = canvasState;

    // Sort shapes by creation time (most recent first)
    const sortedShapes = [...shapes].sort((a, b) => {
      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return timeB - timeA; // Descending order (newest first)
    });

    // Return full shape data with all properties for context-aware identification
    const enhancedShapes = sortedShapes.map((shape, index) => ({
      id: shape.id,
      type: shape.type,
      x: Math.round(shape.x),
      y: Math.round(shape.y),
      fill: shape.fill,
      stroke: shape.stroke,
      color: shape.fill || shape.color, // Alias for easier access
      isRecent: index === 0, // Mark the most recent shape
      rotation: shape.rotation || 0,
      ...(shape.radius && { radius: Math.round(shape.radius) }),
      ...(shape.width && { width: Math.round(shape.width) }),
      ...(shape.height && { height: Math.round(shape.height) }),
      ...(shape.text && { text: shape.text }),
      ...(shape.fontSize && { fontSize: shape.fontSize }),
      ...(shape.createdBy && { createdBy: shape.createdBy }),
      ...(shape.updatedBy && { updatedBy: shape.updatedBy }),
      ...(shape.createdAt && { createdAt: shape.createdAt }),
      ...(shape.updatedAt && { updatedAt: shape.updatedAt }),
    }));

    return {
      success: true,
      canvasState: {
        shapeCount: shapes.length,
        shapes: enhancedShapes,
        mostRecentId: enhancedShapes[0]?.id,
      },
      message: `Canvas has ${shapes.length} shape(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to get canvas state: ${error.message}`,
    };
  }
};

/**
 * Execute moveShape tool call
 * @param {Object} args - Tool call arguments { id, x, y } or { color, type, x, y }
 * @param {Object} canvasActions - Canvas context actions
 * @param {Object} canvasState - Canvas state to verify shape exists
 * @returns {Promise<Object>} Result with success status
 */
export const executeMoveShape = async (args, canvasActions, canvasState) => {
  try {
    // Validate required parameters
    if (typeof args.x !== 'number' || typeof args.y !== 'number') {
      throw new Error('Valid x and y coordinates are required');
    }
    // Note: Negative coordinates are now allowed for positioning shapes off-canvas

    // Resolve shape ID (from explicit ID or descriptor)
    const resolution = resolveShapeId(args, canvasState);
    if (!resolution.success) {
      throw new Error(resolution.error);
    }

    const { shapeId, shape } = resolution;

    // Update shape position
    await canvasActions.updateShape(shapeId, {
      x: args.x,
      y: args.y,
    });

    return {
      success: true,
      message: `Moved ${shape.type} to (${Math.round(args.x)}, ${Math.round(args.y)})`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to move shape: ${error.message}`,
    };
  }
};

/**
 * Execute updateShapeColor tool call
 * @param {Object} args - Tool call arguments { id, color } or { color, type, newColor }
 * @param {Object} canvasActions - Canvas context actions
 * @param {Object} canvasState - Canvas state to verify shape exists
 * @returns {Promise<Object>} Result with success status
 */
export const executeUpdateShapeColor = async (args, canvasActions, canvasState) => {
  try {
    // Validate required parameters
    const targetColor = args.newColor || args.color;
    if (!targetColor) {
      throw new Error('Color is required');
    }

    // Resolve shape ID (from explicit ID or descriptor)
    const resolution = resolveShapeId(args, canvasState);
    if (!resolution.success) {
      throw new Error(resolution.error);
    }

    const { shapeId, shape } = resolution;

    // Normalize color
    let normalizedColor;
    try {
      normalizedColor = normalizeColor(targetColor);
    } catch (error) {
      throw new Error(`Invalid color: ${targetColor}. ${error.message}`);
    }

    // Update shape color
    await canvasActions.updateShape(shapeId, {
      fill: normalizedColor,
    });

    return {
      success: true,
      message: `Changed ${shape.type} color to ${targetColor}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to update color: ${error.message}`,
    };
  }
};

/**
 * Execute deleteShape tool call
 * @param {Object} args - Tool call arguments { id } or { color, type }
 * @param {Object} canvasActions - Canvas context actions
 * @param {Object} canvasState - Canvas state to verify shape exists
 * @returns {Promise<Object>} Result with success status
 */
export const executeDeleteShape = async (args, canvasActions, canvasState) => {
  try {
    // Resolve shape ID (from explicit ID or descriptor)
    const resolution = resolveShapeId(args, canvasState);
    if (!resolution.success) {
      throw new Error(resolution.error);
    }

    const { shapeId, shape } = resolution;

    // Delete the shape
    await canvasActions.deleteShape(shapeId);

    return {
      success: true,
      message: `Deleted ${shape.type}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to delete shape: ${error.message}`,
    };
  }
};

/**
 * Execute rotateShape tool call
 * @param {Object} args - Tool call arguments { id, rotation } or { color, type, rotation }
 * @param {Object} canvasActions - Canvas context actions
 * @param {Object} canvasState - Canvas state to verify shape exists
 * @returns {Promise<Object>} Result with success status
 */
export const executeRotateShape = async (args, canvasActions, canvasState) => {
  try {
    // Validate required parameters
    if (typeof args.rotation !== 'number') {
      throw new Error('Valid rotation angle is required');
    }
    if (args.rotation < 0 || args.rotation > 359) {
      throw new Error('Rotation must be between 0 and 359 degrees');
    }

    // Resolve shape ID (from explicit ID or descriptor)
    const resolution = resolveShapeId(args, canvasState);
    if (!resolution.success) {
      throw new Error(resolution.error);
    }

    const { shapeId, shape } = resolution;

    // Update shape rotation
    await canvasActions.updateShape(shapeId, {
      rotation: args.rotation,
    });

    return {
      success: true,
      message: `Rotated ${shape.type} to ${args.rotation}°`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to rotate shape: ${error.message}`,
    };
  }
};

/**
 * Execute createGrid tool call
 * @param {Object} args - Tool call arguments { rows, cols, shapeType, color, originX, originY, spacing, size }
 * @param {Object} canvasActions - Canvas context actions (not used for batch operations)
 * @returns {Promise<Object>} Result with success status and created shapes
 */
export const executeCreateGrid = async (args, canvasActions) => {
  try {
    // Set defaults for optional parameters
    const rows = args.rows;
    const cols = args.cols;
    const shapeType = args.shapeType;
    const color = args.color;
    const originX = args.originX ?? 200;
    const originY = args.originY ?? 200;
    const spacing = args.spacing ?? DEFAULT_GRID_CONFIG.spacing;
    const size = args.size ?? DEFAULT_GRID_CONFIG.shapeSize;

    // Validate required parameters
    if (!rows || !cols || !shapeType || !color) {
      throw new Error('rows, cols, shapeType, and color are required');
    }

    // Map tool shape type to canvas shape type
    const TOOL_TYPE_TO_SHAPE_TYPE = {
      'circle': SHAPE_TYPES.CIRCLE,
      'rectangle': SHAPE_TYPES.RECT,
      'text': SHAPE_TYPES.TEXT,
      'triangle': SHAPE_TYPES.TRIANGLE,
    };

    const mappedShapeType = TOOL_TYPE_TO_SHAPE_TYPE[shapeType];
    if (!mappedShapeType) {
      throw new Error(`Unknown shape type: ${shapeType}`);
    }

    // Normalize color
    let normalizedColor;
    try {
      normalizedColor = normalizeColor(color);
    } catch (error) {
      throw new Error(`Invalid color: ${color}. ${error.message}`);
    }

    // Calculate total shapes
    const totalShapes = rows * cols;

    // Validate batch size
    const validation = validateBatchSize(totalShapes);
    if (!validation.safe) {
      throw new Error(validation.reason);
    }

    // Generate grid configuration
    const shapeProps = {};
    if (mappedShapeType === SHAPE_TYPES.CIRCLE) {
      shapeProps.radius = size;
    } else if (mappedShapeType === SHAPE_TYPES.RECT || mappedShapeType === SHAPE_TYPES.TRIANGLE) {
      shapeProps.width = size * 2;
      shapeProps.height = size * 2;
    } else if (mappedShapeType === SHAPE_TYPES.TEXT) {
      shapeProps.width = 100;
      shapeProps.height = 30;
      shapeProps.fontSize = 16;
      // Text will be set by gridGenerator to show grid position
    }

    const gridConfigs = generateGrid({
      rows,
      cols,
      spacing,
      originX,
      originY,
      shapeType: mappedShapeType,
      color: normalizedColor,
      shapeProps,
    });

    // Batch create all shapes (uses Firestore batch writes internally)
    const createdShapes = await batchCreateShapes(gridConfigs);

    return {
      success: true,
      shapes: createdShapes,
      count: createdShapes.length,
      message: `Created ${rows}×${cols} grid of ${shapeType}s (${totalShapes} shapes)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to create grid: ${error.message}`,
    };
  }
};

/**
 * Execute a tool call from OpenAI
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} args - Tool arguments
 * @param {Object} context - Context object with canvasActions and canvasState
 * @returns {Promise<Object>} Execution result
 */
export const executeToolCall = async (toolName, args, context) => {
  const { canvasActions, canvasState } = context;

  switch (toolName) {
    case 'createShape':
      return await executeCreateShape(args, canvasActions);
    
    case 'getCanvasState':
      return await executeGetCanvasState(args, canvasState);
    
    case 'moveShape':
      return await executeMoveShape(args, canvasActions, canvasState);
    
    case 'updateShapeColor':
      return await executeUpdateShapeColor(args, canvasActions, canvasState);
    
    case 'deleteShape':
      return await executeDeleteShape(args, canvasActions, canvasState);
    
    case 'rotateShape':
      return await executeRotateShape(args, canvasActions, canvasState);
    
    case 'createGrid':
      return await executeCreateGrid(args, canvasActions);
    
    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
        message: `Tool "${toolName}" is not implemented`,
      };
  }
};

export default {
  executeCreateShape,
  executeGetCanvasState,
  executeMoveShape,
  executeUpdateShapeColor,
  executeDeleteShape,
  executeRotateShape,
  executeCreateGrid,
  executeToolCall,
};

