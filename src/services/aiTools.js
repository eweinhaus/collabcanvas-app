/**
 * AI Tool Schemas
 * OpenAI function calling tool definitions for canvas operations
 * Tool executors will be implemented in PR 14+
 */

/**
 * All available tools for OpenAI function calling
 * These define the interface that OpenAI can use to manipulate the canvas
 */
export const AI_TOOLS = [
  // Creation Tools (PR 14)
  {
    type: 'function',
    function: {
      name: 'createShape',
      description: 'Create a new shape on the canvas. Shapes will be visible to all users immediately.',
      parameters: {
        type: 'object',
        properties: {
          shapeType: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text', 'triangle'],
            description: 'Type of shape to create',
          },
          x: {
            type: 'number',
            description: 'X coordinate (0-1920, canvas width)',
          },
          y: {
            type: 'number',
            description: 'Y coordinate (0-1080, canvas height)',
          },
          fill: {
            type: 'string',
            description: 'Fill color as hex code (e.g., #FF0000 for red)',
          },
          width: {
            type: 'number',
            description: 'Width in pixels (for rectangle and text)',
          },
          height: {
            type: 'number',
            description: 'Height in pixels (for rectangle)',
          },
          radius: {
            type: 'number',
            description: 'Radius in pixels (for circle)',
          },
          text: {
            type: 'string',
            description: 'Text content (for text shapes)',
          },
        },
        required: ['shapeType', 'x', 'y', 'fill'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'getCanvasState',
      description: 'Get current state of all shapes on the canvas. Use this to understand what exists before making changes.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },

  // Manipulation Tools (PR 15)
  {
    type: 'function',
    function: {
      name: 'moveShape',
      description: 'Move a shape to a new position. Identify shape by color, type, or recency.',
      parameters: {
        type: 'object',
        properties: {
          descriptor: {
            type: 'string',
            description: 'Description to identify shape (e.g., "blue circle", "the rectangle", "red square")',
          },
          x: {
            type: 'number',
            description: 'New X coordinate',
          },
          y: {
            type: 'number',
            description: 'New Y coordinate',
          },
        },
        required: ['descriptor', 'x', 'y'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'updateShapeColor',
      description: 'Change the color of an existing shape.',
      parameters: {
        type: 'object',
        properties: {
          descriptor: {
            type: 'string',
            description: 'Description to identify shape',
          },
          fill: {
            type: 'string',
            description: 'New fill color as hex code',
          },
        },
        required: ['descriptor', 'fill'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'deleteShape',
      description: 'Delete a shape from the canvas.',
      parameters: {
        type: 'object',
        properties: {
          descriptor: {
            type: 'string',
            description: 'Description to identify shape to delete',
          },
        },
        required: ['descriptor'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'rotateShape',
      description: 'Rotate a shape by the specified degrees.',
      parameters: {
        type: 'object',
        properties: {
          descriptor: {
            type: 'string',
            description: 'Description to identify shape',
          },
          rotation: {
            type: 'number',
            description: 'Rotation in degrees (0-359)',
          },
        },
        required: ['descriptor', 'rotation'],
      },
    },
  },

  // Layout Tools (PR 16)
  {
    type: 'function',
    function: {
      name: 'createGrid',
      description: 'Create a grid of shapes with specified rows, columns, and spacing.',
      parameters: {
        type: 'object',
        properties: {
          shapeType: {
            type: 'string',
            enum: ['rectangle', 'circle', 'triangle'],
            description: 'Type of shapes in the grid',
          },
          rows: {
            type: 'number',
            description: 'Number of rows (max 20)',
          },
          cols: {
            type: 'number',
            description: 'Number of columns (max 20)',
          },
          spacing: {
            type: 'number',
            description: 'Spacing between shapes in pixels',
          },
          x: {
            type: 'number',
            description: 'Starting X coordinate',
          },
          y: {
            type: 'number',
            description: 'Starting Y coordinate',
          },
          fill: {
            type: 'string',
            description: 'Fill color as hex code',
          },
        },
        required: ['shapeType', 'rows', 'cols', 'x', 'y', 'fill'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'arrangeHorizontally',
      description: 'Arrange multiple shapes in a horizontal row.',
      parameters: {
        type: 'object',
        properties: {
          descriptors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape descriptions to arrange',
          },
          spacing: {
            type: 'number',
            description: 'Spacing between shapes in pixels',
          },
        },
        required: ['descriptors'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'distributeEvenly',
      description: 'Distribute multiple shapes evenly along an axis.',
      parameters: {
        type: 'object',
        properties: {
          descriptors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape descriptions to distribute',
          },
          axis: {
            type: 'string',
            enum: ['horizontal', 'vertical'],
            description: 'Axis to distribute along',
          },
        },
        required: ['descriptors', 'axis'],
      },
    },
  },

  // Complex Template Tool (PR 17)
  {
    type: 'function',
    function: {
      name: 'createLoginForm',
      description: 'Create a complete login form template with username, password fields and submit button.',
      parameters: {
        type: 'object',
        properties: {
          x: {
            type: 'number',
            description: 'Starting X coordinate for the form',
          },
          y: {
            type: 'number',
            description: 'Starting Y coordinate for the form',
          },
        },
        required: ['x', 'y'],
      },
    },
  },
];

/**
 * Get tool definitions for OpenAI API
 * @returns {Array} Array of tool definitions
 */
export function getToolDefinitions() {
  return AI_TOOLS;
}

/**
 * Get tool by name
 * @param {string} name - Tool function name
 * @returns {Object|null} Tool definition or null if not found
 */
export function getToolByName(name) {
  return AI_TOOLS.find(tool => tool.function.name === name) || null;
}

