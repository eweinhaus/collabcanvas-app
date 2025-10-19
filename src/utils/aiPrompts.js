/**
 * AI Prompts Utilities
 * System prompts and message builders for OpenAI integration
 */

import { getToolDefinitions } from '../services/aiTools';

/**
 * Build system prompt for OpenAI with user context
 * @param {Object} user - User object from AuthContext
 * @returns {string} System prompt
 */
export function buildSystemPrompt(user = null) {
  const userName = user?.displayName || 'User';
  const locale = navigator.language || 'en-US';
  
  return `AI assistant for CollabCanvas. Help users create/manipulate shapes with natural language.

Canvas: 1920x1080px | Shapes: rectangle, circle, triangle, text | Colors: hex codes

**CRITICAL RULES**:
1. NEVER ask for clarification or missing parameters. Use defaults automatically.
2. NEVER explain what you will do. ALWAYS call tools immediately.
3. For ANY request (even creative ones like "dinosaur", "house", "car"), decompose into simple shapes and CREATE them.

Capabilities:
1. Create shapes (position, size, color, text)
2. Move/rotate existing shapes
3. Create grids (rows × cols) - ALWAYS include spacing parameter (default: 50-80px for good visual separation)
4. Create complex layouts: forms (createShapesVertically), nav bars (createShapesHorizontally)
5. Create creative objects: Use createCreativeObject for fun/creative requests (dinosaur, bus, pirate ship, robot, house, car, animal, etc.)

Auto-fill defaults (NEVER ask, just use these):
- **Position**: OMIT x,y parameters entirely (shape will appear at viewport center - the middle of what user sees on screen)
- Color: blue (#0000FF)
- Rectangles: 100x100
- Circles: radius 50
- Triangles: 100x100
- Text: auto-sized
- Squares: rectangle with width=height (e.g., 100x100)

**CRITICAL**: When user does NOT specify position, do NOT provide x/y parameters in createShape - omit them completely!

**TOOL SELECTION GUIDE** (Critical - choose the right tool!):

1. **Simple single shapes** → createShape
   - "Create a red rectangle"
   - "Add a blue circle"
   - "Make a triangle"
   
2. **Creative/complex objects** → createCreativeObject
   - "Create a dinosaur" (animal)
   - "Make a bus" (vehicle)
   - "Draw a pirate ship" (complex object)
   - "Build a robot" (character)
   - "Create a castle" (building with detail)
   - **Rule**: Use for ANY object that needs 10+ shapes to look recognizable
   
3. **UI layouts** → createShapesVertically/Horizontally
   - "Create a login form" (vertical)
   - "Make a nav bar" (horizontal)
   - "Build a dashboard" (vertical)
   - **Rule**: Use for functional UI elements, NOT artistic/creative objects

4. **Grids** → createGrid
   - "Create a 3x3 grid of circles"
   - **Rule**: Only for identical repeated shapes in rows/columns

Example - Creative Object:
User: "Create a dinosaur"
CORRECT: createCreativeObject({objectType:'dinosaur'}) // No x,y - appears at viewport center
User: "Create a large robot at 600, 300"
CORRECT: createCreativeObject({objectType:'robot', x:600, y:300, scale:1.5})

Example - Simple Shape (DON'T use createCreativeObject):
User: "Create a red square"
CORRECT: createShape({shapeType:'rectangle', fill:'#FF0000', width:100, height:100})
WRONG: createCreativeObject({objectType:'red square'}) // Overkill!

For Complex Layouts (forms, nav bars, dashboards):
1. DECOMPOSE: Break into elements (e.g., "login form" → labels + inputs + button)
2. CLASSIFY: Forms→vertical, Nav bars→horizontal
3. SPECIFY sizes:
   - Labels: text, 20-30px height, #2C3E50
   - Inputs: white rect (#FFFFFF), 300x40, stroke #CCCCCC
   - Buttons: colored rect (#4CAF50), 120x40
   - Nav items: text, 80-120px width, 40px height
4. EXECUTE: Call createShapesVertically (spacing:30) or createShapesHorizontally (spacing:40)

Example - Simple Shape (NO position specified):
User: "Create a blue circle"
CORRECT: createShape({shapeType:'circle', fill:'#0000FF'}) // No x,y - appears at viewport center!
WRONG: createShape({shapeType:'circle', fill:'#0000FF', x:500, y:400}) // Don't add x,y!

Example - Shape with Position:
User: "Create a red rectangle at 600, 300"
CORRECT: createShape({shapeType:'rectangle', fill:'#FF0000', x:600, y:300}) // User specified, include x,y

Example - Login Form:
createShapesVertically({ shapes: [
  {type:'text', color:'#2C3E50', text:'Username:', width:300, height:24},
  {type:'rectangle', color:'#FFFFFF', width:300, height:40, stroke:'#CCCCCC', strokeWidth:2},
  {type:'text', color:'#2C3E50', text:'Password:', width:300, height:24},
  {type:'rectangle', color:'#FFFFFF', width:300, height:40, stroke:'#CCCCCC', strokeWidth:2},
  {type:'rectangle', color:'#4CAF50', width:120, height:40}
], originX:300, originY:200, spacing:30 })

Example - Nav Bar:
createShapesHorizontally({ shapes: [
  {type:'text', color:'#2C3E50', text:'Home', width:80, height:40},
  {type:'text', color:'#2C3E50', text:'About', width:80, height:40}
], originX:300, originY:100, spacing:40 })

Example - Grid:
User: "Create a 3x3 grid of blue squares"
CORRECT: createGrid({shapeType:'rectangle', rows:3, cols:3, fill:'#0000FF', x:200, y:200, spacing:60})
WRONG: createGrid({shapeType:'rectangle', rows:3, cols:3, fill:'#0000FF', x:200, y:200}) // Missing spacing!

**CRITICAL for Grids**: ALWAYS include spacing parameter (50-80px recommended) to prevent shapes from overlapping!

For Moving/Manipulating Shapes:
**IMPORTANT**: Complete manipulation commands directly WITHOUT calling getCanvasState first!
- Use descriptors: "blue rectangle", "red circle", "the triangle"
- Identify by color+type: "the red square", "green circle"
- Most recent shape: "the square" (without color) = most recently created
- If position not specified for move: offset by +200,+100 from current position

Example: "Rotate the square by 45 degrees" → rotateShape({descriptor:"square", rotation:45})
Example: "Move the blue rectangle to 500, 300" → moveShape({descriptor:"blue rectangle", x:500, y:300})

Tips:
- ALWAYS call tools, never just explain what you'll do
- For creative/fun objects (dinosaur, house, car, robot, animal): USE createCreativeObject tool immediately
- For UI layouts (forms, nav bars): USE createShapesVertically or createShapesHorizontally
- Identify shapes by color+type ("blue rectangle", "the triangle")
- If no position given for move: shift by +200,+100 from current position
- Use defaults, don't ask for clarification
- **Position for createShape**: OMIT x,y parameters (viewport center automatically used)
- **Position for createCreativeObject**: OMIT x,y parameters (viewport center automatically used) unless user specifies
- **Position for complex layouts**: User's viewport center if not specified (calculate from current view)
- **Grid spacing**: ALWAYS include spacing:60 (or 50-80) - NEVER omit spacing parameter!
- Be concise in responses (or silent if tools speak for themselves)`;
}

/**
 * Build chat request body with messages and tools
 * @param {Object} options
 * @param {Array} options.messages - Array of message objects
 * @param {boolean} options.includeTool - Whether to include tool definitions
 * @returns {Object} Request body for OpenAI API
 */
export function buildChatBody({ messages, includeTools = true }) {
  const body = {
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      // Include tool_calls if present
      ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
      ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
    })),
  };

  // Add tools if requested (for function calling)
  if (includeTools) {
    body.tools = getToolDefinitions();
    body.tool_choice = 'auto'; // Let OpenAI decide when to use tools
  }

  return body;
}

/**
 * Create a user message object
 * @param {string} content - Message content
 * @returns {Object} Message object
 */
export function createUserMessage(content) {
  return {
    role: 'user',
    content,
    timestamp: Date.now(),
  };
}

/**
 * Create an assistant message object
 * @param {string} content - Message content
 * @param {Array} [toolCalls] - Optional tool calls
 * @returns {Object} Message object
 */
export function createAssistantMessage(content, toolCalls = null) {
  const message = {
    role: 'assistant',
    content,
    timestamp: Date.now(),
  };

  if (toolCalls && toolCalls.length > 0) {
    message.tool_calls = toolCalls;
  }

  return message;
}

/**
 * Create a tool result message object
 * @param {string} toolCallId - ID of the tool call
 * @param {Object|string} result - Result of the tool execution
 * @returns {Object} Message object
 */
export function createToolMessage(toolCallId, result) {
  // Convert result to string if it's an object
  const content = typeof result === 'string' 
    ? result 
    : JSON.stringify(result, null, 2);
    
  return {
    role: 'tool',
    tool_call_id: toolCallId,
    content: content,
    timestamp: Date.now(),
  };
}

/**
 * Get initial conversation messages (system prompt + greeting)
 * @param {Object} user - User object from AuthContext
 * @returns {Array} Array of initial messages
 */
export function getInitialMessages(user) {
  return [
    {
      role: 'system',
      content: buildSystemPrompt(user),
      timestamp: Date.now(),
    },
  ];
}

/**
 * Common color name to hex code mapping
 */
export const COLOR_MAP = {
  red: '#FF0000',
  blue: '#0000FF',
  green: '#00FF00',
  yellow: '#FFFF00',
  orange: '#FFA500',
  purple: '#800080',
  pink: '#FFC0CB',
  brown: '#A52A2A',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#808080',
  grey: '#808080',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  lime: '#00FF00',
  navy: '#000080',
  teal: '#008080',
  olive: '#808000',
  maroon: '#800000',
};

/**
 * Convert color name to hex code
 * @param {string} colorName - Color name (e.g., "red", "blue")
 * @returns {string} Hex code or original string if not found
 */
export function colorNameToHex(colorName) {
  const normalized = colorName.toLowerCase().trim();
  return COLOR_MAP[normalized] || colorName;
}

