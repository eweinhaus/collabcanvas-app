/**
 * AI System Prompts for CollabCanvas
 * 
 * This file contains system prompts and helper functions for building
 * conversation contexts for the OpenAI API.
 */

/**
 * Base system prompt that defines the AI assistant's role and capabilities
 */
export const BASE_SYSTEM_PROMPT = `You are an AI assistant integrated into CollabCanvas, a collaborative whiteboard application. Your role is to help users create and manipulate shapes on the canvas using natural language commands.

**Your Capabilities:**
- Create shapes (circles, rectangles, triangles, text) at specific positions
- Query the current canvas state to see what shapes exist
- Understand natural language descriptions like "create a blue circle" or "add text that says Hello"

**Shape Types:**
1. **Circle**: Requires x, y, radius, and color
2. **Rectangle**: Requires x, y, width, height, and color
3. **Triangle**: Requires x, y, radius (for size), and color
4. **Text**: Requires x, y, width, height, text content, and color

**Color Guidelines:**
- Accept color names (red, blue, green) or hex codes (#FF0000, #00FF00)
- Default colors: circle=#3498db (blue), rectangle=#e74c3c (red), text=#2c3e50 (dark gray), triangle=#9b59b6 (purple)

**Position Guidelines:**
- Canvas coordinates start at (0, 0) in the top-left
- If no position specified, use reasonable defaults: x=200, y=200
- Typical canvas size is 2000x2000 pixels
- Keep shapes within visible area (0-1000 for most displays)

**Size Guidelines:**
- Default circle/triangle radius: 50
- Default rectangle: 150x100 (width x height)
- Default text: 200x50 (width x height)

**Response Style:**
- Be concise and friendly
- Confirm actions: "I've created a blue circle at (100, 200)"
- If ambiguous, make reasonable assumptions
- Use the tools provided to execute commands`;

/**
 * Build a complete messages array for OpenAI chat completion
 * @param {string} userMessage - The user's command
 * @param {Array} previousMessages - Optional array of previous conversation messages
 * @returns {Array} Messages array formatted for OpenAI API
 */
export const buildMessages = (userMessage, previousMessages = []) => {
  const messages = [
    {
      role: 'system',
      content: BASE_SYSTEM_PROMPT
    }
  ];

  // Add previous conversation history if provided
  if (previousMessages && previousMessages.length > 0) {
    messages.push(...previousMessages);
  }

  // Add the current user message
  messages.push({
    role: 'user',
    content: userMessage
  });

  return messages;
};

/**
 * Create a system message with custom content
 * @param {string} content - Custom system message content
 * @returns {object} System message object
 */
export const createSystemMessage = (content) => {
  return {
    role: 'system',
    content
  };
};

/**
 * Create a user message
 * @param {string} content - User message content
 * @returns {object} User message object
 */
export const createUserMessage = (content) => {
  return {
    role: 'user',
    content
  };
};

/**
 * Create an assistant message
 * @param {string} content - Assistant message content
 * @returns {object} Assistant message object
 */
export const createAssistantMessage = (content) => {
  return {
    role: 'assistant',
    content
  };
};

/**
 * Build context-aware prompt with canvas state
 * @param {string} userMessage - The user's command
 * @param {Array} shapes - Current shapes on the canvas
 * @returns {Array} Messages array with canvas context
 */
export const buildContextAwareMessages = (userMessage, shapes = []) => {
  const messages = [
    {
      role: 'system',
      content: BASE_SYSTEM_PROMPT
    }
  ];

  // Add canvas state context if shapes exist
  if (shapes.length > 0) {
    const canvasContext = `\n\n**Current Canvas State:**\n${shapes.length} shape(s) on canvas:\n${shapes
      .map(
        (s, i) =>
          `${i + 1}. ${s.type} at (${Math.round(s.x)}, ${Math.round(s.y)}) - color: ${s.color || s.fill}`
      )
      .join('\n')}`;

    messages.push({
      role: 'system',
      content: canvasContext
    });
  }

  messages.push({
    role: 'user',
    content: userMessage
  });

  return messages;
};

export default {
  BASE_SYSTEM_PROMPT,
  buildMessages,
  buildContextAwareMessages,
  createSystemMessage,
  createUserMessage,
  createAssistantMessage
};

