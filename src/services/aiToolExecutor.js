/**
 * AI Tool Executor
 * 
 * Executes tool calls from OpenAI API and translates them into canvas actions.
 * This service bridges the AI layer with the canvas context.
 */

import { createShape, SHAPE_TYPES } from '../utils/shapes';
import { normalizeColor } from '../utils/colorNormalizer';

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
 * @returns {Promise<Object>} Result with canvas state
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

    // Return simplified shape data with timestamps
    const simplifiedShapes = sortedShapes.map((shape, index) => ({
      id: shape.id,
      type: shape.type,
      x: Math.round(shape.x),
      y: Math.round(shape.y),
      color: shape.fill || shape.color,
      isRecent: index === 0, // Mark the most recent shape
      ...(shape.radius && { radius: Math.round(shape.radius) }),
      ...(shape.width && { width: Math.round(shape.width) }),
      ...(shape.height && { height: Math.round(shape.height) }),
      ...(shape.text && { text: shape.text }),
      ...(shape.createdAt && { createdAt: shape.createdAt }),
    }));

    return {
      success: true,
      canvasState: {
        shapeCount: shapes.length,
        shapes: simplifiedShapes,
        mostRecentId: simplifiedShapes[0]?.id,
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
 * @param {Object} args - Tool call arguments { id, x, y }
 * @param {Object} canvasActions - Canvas context actions
 * @param {Object} canvasState - Canvas state to verify shape exists
 * @returns {Promise<Object>} Result with success status
 */
export const executeMoveShape = async (args, canvasActions, canvasState) => {
  try {
    // Validate required parameters
    if (!args.id) {
      throw new Error('Shape ID is required');
    }
    if (typeof args.x !== 'number' || typeof args.y !== 'number') {
      throw new Error('Valid x and y coordinates are required');
    }
    if (args.x < 0 || args.y < 0) {
      throw new Error('Coordinates must be non-negative (>= 0)');
    }

    // Verify shape exists
    const shape = canvasState.shapes.find((s) => s.id === args.id);
    if (!shape) {
      throw new Error(`Shape with ID "${args.id}" not found`);
    }

    // Update shape position
    await canvasActions.updateShape(args.id, {
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
 * @param {Object} args - Tool call arguments { id, color }
 * @param {Object} canvasActions - Canvas context actions
 * @param {Object} canvasState - Canvas state to verify shape exists
 * @returns {Promise<Object>} Result with success status
 */
export const executeUpdateShapeColor = async (args, canvasActions, canvasState) => {
  try {
    // Validate required parameters
    if (!args.id) {
      throw new Error('Shape ID is required');
    }
    if (!args.color) {
      throw new Error('Color is required');
    }

    // Verify shape exists
    const shape = canvasState.shapes.find((s) => s.id === args.id);
    if (!shape) {
      throw new Error(`Shape with ID "${args.id}" not found`);
    }

    // Normalize color
    let normalizedColor;
    try {
      normalizedColor = normalizeColor(args.color);
    } catch (error) {
      throw new Error(`Invalid color: ${args.color}. ${error.message}`);
    }

    // Update shape color
    await canvasActions.updateShape(args.id, {
      fill: normalizedColor,
    });

    return {
      success: true,
      message: `Changed ${shape.type} color to ${args.color}`,
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
 * @param {Object} args - Tool call arguments { id }
 * @param {Object} canvasActions - Canvas context actions
 * @param {Object} canvasState - Canvas state to verify shape exists
 * @returns {Promise<Object>} Result with success status
 */
export const executeDeleteShape = async (args, canvasActions, canvasState) => {
  try {
    // Validate required parameters
    if (!args.id) {
      throw new Error('Shape ID is required');
    }

    // Verify shape exists
    const shape = canvasState.shapes.find((s) => s.id === args.id);
    if (!shape) {
      throw new Error(`Shape with ID "${args.id}" not found`);
    }

    // Delete the shape
    await canvasActions.deleteShape(args.id);

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
 * @param {Object} args - Tool call arguments { id, rotation }
 * @param {Object} canvasActions - Canvas context actions
 * @param {Object} canvasState - Canvas state to verify shape exists
 * @returns {Promise<Object>} Result with success status
 */
export const executeRotateShape = async (args, canvasActions, canvasState) => {
  try {
    // Validate required parameters
    if (!args.id) {
      throw new Error('Shape ID is required');
    }
    if (typeof args.rotation !== 'number') {
      throw new Error('Valid rotation angle is required');
    }
    if (args.rotation < 0 || args.rotation > 359) {
      throw new Error('Rotation must be between 0 and 359 degrees');
    }

    // Verify shape exists
    const shape = canvasState.shapes.find((s) => s.id === args.id);
    if (!shape) {
      throw new Error(`Shape with ID "${args.id}" not found`);
    }

    // Update shape rotation
    await canvasActions.updateShape(args.id, {
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
  executeToolCall,
};

