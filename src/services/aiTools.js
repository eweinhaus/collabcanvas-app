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
      description: 'Create a new shape on the canvas. Shapes will be visible to all users immediately. IMPORTANT: If user does not specify position, OMIT x and y parameters - the shape will be created at the center of the user\'s current viewport (what they see on screen).',
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
            description: 'X coordinate (0-1920, canvas width). OPTIONAL: Omit if user does not specify position - shape will be created at viewport center.',
          },
          y: {
            type: 'number',
            description: 'Y coordinate (0-1080, canvas height). OPTIONAL: Omit if user does not specify position - shape will be created at viewport center.',
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
        required: ['shapeType', 'fill'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'getCanvasState',
      description: 'Get current state of all shapes on the canvas. ONLY use this for informational queries like "what shapes are on the canvas?" or "list all shapes". For manipulation commands (move/rotate/delete), use the descriptor directly WITHOUT calling getCanvasState first.',
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
      description: 'Create a grid of shapes with specified rows, columns, and spacing. For "squares", use shapeType="rectangle" (will create equal-sided rectangles).',
      parameters: {
        type: 'object',
        properties: {
          shapeType: {
            type: 'string',
            enum: ['rectangle', 'circle', 'triangle'],
            description: 'Type of shapes in the grid. Use "rectangle" for squares (will be equal-sided).',
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

  // Complex Layout Tools (PR 17) - Flexible multi-tool approach
  {
    type: 'function',
    function: {
      name: 'createShapesVertically',
      description: 'Create multiple shapes stacked vertically with consistent spacing. Use for forms, lists, vertical layouts. The LLM should decompose complex commands (login forms, signup forms, etc.) into individual shape specifications.',
      parameters: {
        type: 'object',
        properties: {
          shapes: {
            type: 'array',
            description: 'Array of shape specifications to create vertically',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['circle', 'rectangle', 'text', 'triangle'],
                  description: 'Shape type',
                },
                color: {
                  type: 'string',
                  description: 'CSS color name or hex code (e.g., "#FFFFFF", "blue")',
                },
                text: {
                  type: 'string',
                  description: 'Text content (required for text shapes)',
                },
                width: {
                  type: 'number',
                  description: 'Width in pixels (rectangles/text). Default: rectangle=150, text=200',
                },
                height: {
                  type: 'number',
                  description: 'Height in pixels (rectangles/text). Default: rectangle=100, text=30',
                },
                radius: {
                  type: 'number',
                  description: 'Radius in pixels (circles). Default: 50',
                },
                fontSize: {
                  type: 'number',
                  description: 'Font size for text shapes. Default: 16',
                },
                stroke: {
                  type: 'string',
                  description: 'Border color (optional, hex or color name)',
                },
                strokeWidth: {
                  type: 'number',
                  description: 'Border width in pixels (optional). Default: 2',
                },
              },
              required: ['type', 'color'],
            },
            minItems: 2,
          },
          originX: {
            type: 'number',
            description: 'Starting X position for the vertical stack',
          },
          originY: {
            type: 'number',
            description: 'Starting Y position for the vertical stack',
          },
          spacing: {
            type: 'number',
            description: 'Vertical spacing between shapes in pixels. Default: 25 (for forms), range: 5-200',
            default: 25,
          },
        },
        required: ['shapes', 'originX', 'originY'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'createShapesHorizontally',
      description: 'Create multiple shapes arranged horizontally in a row. Use for navigation bars, button groups, horizontal layouts. The LLM should decompose complex commands into individual shape specifications.',
      parameters: {
        type: 'object',
        properties: {
          shapes: {
            type: 'array',
            description: 'Array of shape specifications to create horizontally',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['circle', 'rectangle', 'text', 'triangle'],
                  description: 'Shape type',
                },
                color: {
                  type: 'string',
                  description: 'CSS color name or hex code (e.g., "#FFFFFF", "blue")',
                },
                text: {
                  type: 'string',
                  description: 'Text content (required for text shapes)',
                },
                width: {
                  type: 'number',
                  description: 'Width in pixels (rectangles/text). Default: rectangle=150, text=200',
                },
                height: {
                  type: 'number',
                  description: 'Height in pixels (rectangles/text). Default: rectangle=100, text=30',
                },
                radius: {
                  type: 'number',
                  description: 'Radius in pixels (circles). Default: 50',
                },
                fontSize: {
                  type: 'number',
                  description: 'Font size for text shapes. Default: 16',
                },
                stroke: {
                  type: 'string',
                  description: 'Border color (optional, hex or color name)',
                },
                strokeWidth: {
                  type: 'number',
                  description: 'Border width in pixels (optional). Default: 2',
                },
              },
              required: ['type', 'color'],
            },
            minItems: 2,
          },
          originX: {
            type: 'number',
            description: 'Starting X position for the horizontal row',
          },
          originY: {
            type: 'number',
            description: 'Y position (same for all shapes in the row)',
          },
          spacing: {
            type: 'number',
            description: 'Horizontal spacing between shapes in pixels. Default: 20, range: 5-500',
            default: 20,
          },
        },
        required: ['shapes', 'originX', 'originY'],
      },
    },
  },

  // Creative Object Generation Tool (NEW)
  {
    type: 'function',
    function: {
      name: 'createCreativeObject',
      description: 'Create a creative/fun object (dinosaur, bus, pirate ship, robot, house, car, animal, etc.) by decomposing it into 10-20 primitive shapes. Uses advanced spatial reasoning to design recognizable objects. Use this for ANY creative or complex object request that would benefit from thoughtful composition.',
      parameters: {
        type: 'object',
        properties: {
          objectType: {
            type: 'string',
            description: 'Type of object to create (e.g., "dinosaur", "bus", "pirate ship", "house", "robot", "tree", "car", "cat"). Be specific about the object.',
          },
          x: {
            type: 'number',
            description: 'Center X coordinate for the object (0-1920). OPTIONAL: Omit if user does not specify position - object will be created at viewport center.',
          },
          y: {
            type: 'number',
            description: 'Center Y coordinate for the object (0-1080). OPTIONAL: Omit if user does not specify position - object will be created at viewport center.',
          },
          scale: {
            type: 'number',
            description: 'Size scale factor (0.5-2.0). Default: 1.0. Use 0.5 for small, 1.5-2.0 for large objects.',
            default: 1.0,
          },
        },
        required: ['objectType'],
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

