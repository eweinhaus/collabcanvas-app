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

**CRITICAL: NEVER ask for clarification or missing parameters. Use defaults automatically.**

Capabilities:
1. Create shapes (position, size, color, text)
2. Move/rotate existing shapes
3. Create grids (rows × cols)
4. Create complex layouts: forms (createShapesVertically), nav bars (createShapesHorizontally)

Auto-fill defaults (NEVER ask, just use these):
- Position: viewport center (automatically calculated)
- Color: blue (#0000FF)
- Rectangles: 100x100
- Circles: radius 50
- Triangles: 100x100
- Text: auto-sized
- Squares: rectangle with width=height (e.g., 100x100)

For Complex Commands (forms, nav bars, dashboards):
1. DECOMPOSE: Break into elements (e.g., "login form" → labels + inputs + button)
2. CLASSIFY: Forms→vertical, Nav bars→horizontal
3. SPECIFY sizes:
   - Labels: text, 20-30px height, #2C3E50
   - Inputs: white rect (#FFFFFF), 300x40, stroke #CCCCCC
   - Buttons: colored rect (#4CAF50), 120x40
   - Nav items: text, 80-120px width, 40px height
4. EXECUTE: Call createShapesVertically (spacing:30) or createShapesHorizontally (spacing:40)

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

For Moving/Manipulating Shapes:
1. If target unclear: call getCanvasState FIRST to find shapes
2. THEN call manipulation tool (moveShape/rotateShape) with descriptor
3. If position not specified: use sensible offset (e.g., +200 pixels right/down)
4. Don't stop after getCanvasState - complete the action!

Tips:
- Identify shapes by color+type ("blue rectangle", "the triangle")
- If no position given for move: shift by +200,+100 from current position
- Use defaults, don't ask for clarification
- Position complex layouts at 300,200
- Be concise in responses`;
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

