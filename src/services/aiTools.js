/**
 * AI Tool Definitions for OpenAI Function Calling
 * 
 * This file contains JSON schema definitions for tools that the AI can use
 * to interact with the CollabCanvas application. Each tool follows the
 * OpenAI function calling specification.
 */

/**
 * Tool for creating shapes on the canvas
 */
export const createShapeTool = {
  type: 'function',
  function: {
    name: 'createShape',
    description: 'Creates a new shape on the canvas at the specified position with the given properties. IMPORTANT: Always extract and include the color from the user command.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['circle', 'rectangle', 'text', 'triangle'],
          description: 'The type of shape to create'
        },
        color: {
          type: 'string',
          description: 'REQUIRED: Color of the shape. Must be a CSS color name (red, blue, green, yellow, orange, purple, pink, etc.) or hex format (#RRGGBB). Extract this from the user command - if user says "blue rectangle" the color MUST be "blue".'
        },
        x: {
          type: 'number',
          description: 'The x-coordinate position on the canvas (must be >= 0). Default: 200',
          minimum: 0
        },
        y: {
          type: 'number',
          description: 'The y-coordinate position on the canvas (must be >= 0). Default: 200',
          minimum: 0
        },
        width: {
          type: 'number',
          description: 'Width of the shape (for rectangles and text, must be > 0). Default: 150 for rectangles',
          minimum: 1
        },
        height: {
          type: 'number',
          description: 'Height of the shape (for rectangles and text, must be > 0). Default: 100 for rectangles',
          minimum: 1
        },
        radius: {
          type: 'number',
          description: 'Radius of the shape (for circles and triangles, must be > 0). Default: 50',
          minimum: 1
        },
        text: {
          type: 'string',
          description: 'Text content (required only for text shapes)'
        }
      },
      required: ['type', 'x', 'y', 'color']
    }
  }
};

/**
 * Tool for getting the current state of the canvas
 */
export const getCanvasStateTool = {
  type: 'function',
  function: {
    name: 'getCanvasState',
    description: 'Retrieves the current state of the canvas including all shapes and their properties',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
};

/**
 * Registry of all available tools
 * Add new tools here as they are implemented
 */
export const TOOLS = {
  createShape: createShapeTool,
  getCanvasState: getCanvasStateTool
};

/**
 * Get an array of all tool definitions for OpenAI API
 * @returns {Array} Array of tool definitions
 */
export const getAllTools = () => {
  return Object.values(TOOLS);
};

/**
 * Get a specific tool by name
 * @param {string} name - Tool name
 * @returns {object|null} Tool definition or null if not found
 */
export const getToolByName = (name) => {
  return TOOLS[name] || null;
};

export default TOOLS;

