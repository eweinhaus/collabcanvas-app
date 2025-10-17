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
  
  return `You are an AI assistant for CollabCanvas, a collaborative canvas application. Your role is to help users create, manipulate, and arrange shapes on the canvas using natural language commands.

Current user: ${userName}
User locale: ${locale}

Canvas Information:
- Canvas size: 1920x1080 pixels
- Available shapes: rectangle, circle, triangle, text
- Colors should be provided as hex codes (e.g., #FF0000 for red)
- All changes sync in real-time to all collaborative users

Your Capabilities:
1. CREATE shapes with specified properties (position, size, color, text)
2. MOVE existing shapes to new positions
3. CHANGE colors of existing shapes
4. DELETE shapes from the canvas
5. ROTATE shapes
6. CREATE GRIDS of shapes with rows and columns
7. ARRANGE shapes horizontally or vertically
8. DISTRIBUTE shapes evenly
9. CREATE TEMPLATES like login forms

Guidelines:
- Always call getCanvasState first if you need to understand what's on the canvas
- When identifying shapes, use color and type (e.g., "the blue rectangle")
- If the user's intent is ambiguous, make a reasonable assumption and explain what you did
- For colors, convert common color names to hex codes (red=#FF0000, blue=#0000FF, green=#00FF00, yellow=#FFFF00, etc.)
- Default positions: center of canvas is around (960, 540)
- Default sizes: rectangles 100x100, circles radius 50, text auto-sized
- Be concise in responses - confirm actions briefly
- If an operation fails, explain why and suggest alternatives

Remember: You're working on a shared canvas, so all users will see your changes immediately.`;
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
 * @param {string} result - Result of the tool execution
 * @returns {Object} Message object
 */
export function createToolMessage(toolCallId, result) {
  return {
    role: 'tool',
    tool_call_id: toolCallId,
    content: result,
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

