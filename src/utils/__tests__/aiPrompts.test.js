/**
 * AI Prompts Tests
 */

import {
  buildSystemPrompt,
  buildChatBody,
  createUserMessage,
  createAssistantMessage,
  createToolMessage,
  getInitialMessages,
  colorNameToHex,
  COLOR_MAP,
} from '../aiPrompts';

describe('aiPrompts', () => {
  describe('buildSystemPrompt', () => {
    it('should build system prompt with CollabCanvas branding', () => {
      const user = {
        displayName: 'John Doe',
        email: 'john@example.com',
      };

      const prompt = buildSystemPrompt(user);

      expect(prompt).toContain('CollabCanvas');
      expect(prompt).toContain('AI assistant');
    });

    it('should handle null user', () => {
      const prompt = buildSystemPrompt(null);

      expect(prompt).toContain('CollabCanvas');
      expect(prompt).toContain('AI assistant');
    });

    it('should include canvas information', () => {
      const prompt = buildSystemPrompt();

      expect(prompt).toContain('1920x1080');
      expect(prompt).toContain('rectangle');
      expect(prompt).toContain('circle');
      expect(prompt).toContain('triangle');
      expect(prompt).toContain('text');
    });

    it('should include critical instruction to use defaults', () => {
      const prompt = buildSystemPrompt();

      expect(prompt).toContain('CRITICAL');
      expect(prompt).toContain('NEVER ask for clarification');
      expect(prompt).toContain('Use defaults automatically');
    });

    it('should include manipulation workflow', () => {
      const prompt = buildSystemPrompt();

      expect(prompt).toContain('Moving/Manipulating');
      expect(prompt).toContain('getCanvasState');
      expect(prompt).toContain('moveShape');
    });
  });

  describe('buildChatBody', () => {
    it('should build chat body with messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const body = buildChatBody({ messages, includeTools: false });

      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('user');
      expect(body.messages[0].content).toBe('Hello');
    });

    it('should include tools when includeTools is true', () => {
      const messages = [{ role: 'user', content: 'test' }];

      const body = buildChatBody({ messages, includeTools: true });

      expect(body.tools).toBeDefined();
      expect(Array.isArray(body.tools)).toBe(true);
      expect(body.tool_choice).toBe('auto');
    });

    it('should not include tools when includeTools is false', () => {
      const messages = [{ role: 'user', content: 'test' }];

      const body = buildChatBody({ messages, includeTools: false });

      expect(body.tools).toBeUndefined();
      expect(body.tool_choice).toBeUndefined();
    });

    it('should include tool_calls if present in message', () => {
      const messages = [
        {
          role: 'assistant',
          content: 'test',
          tool_calls: [{ id: '1', function: { name: 'test' } }],
        },
      ];

      const body = buildChatBody({ messages });

      expect(body.messages[0].tool_calls).toBeDefined();
    });

    it('should include tool_call_id if present in message', () => {
      const messages = [
        {
          role: 'tool',
          content: 'result',
          tool_call_id: 'call-123',
        },
      ];

      const body = buildChatBody({ messages });

      expect(body.messages[0].tool_call_id).toBe('call-123');
    });
  });

  describe('createUserMessage', () => {
    it('should create user message with timestamp', () => {
      const message = createUserMessage('Hello');

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
      expect(message.timestamp).toBeDefined();
      expect(typeof message.timestamp).toBe('number');
    });
  });

  describe('createAssistantMessage', () => {
    it('should create assistant message without tool calls', () => {
      const message = createAssistantMessage('Hello!');

      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Hello!');
      expect(message.timestamp).toBeDefined();
      expect(message.tool_calls).toBeUndefined();
    });

    it('should create assistant message with tool calls', () => {
      const toolCalls = [
        { id: '1', function: { name: 'createShape' } },
      ];

      const message = createAssistantMessage('Creating shape...', toolCalls);

      expect(message.role).toBe('assistant');
      expect(message.tool_calls).toEqual(toolCalls);
    });
  });

  describe('createToolMessage', () => {
    it('should create tool result message', () => {
      const message = createToolMessage('call-123', 'Shape created successfully');

      expect(message.role).toBe('tool');
      expect(message.tool_call_id).toBe('call-123');
      expect(message.content).toBe('Shape created successfully');
      expect(message.timestamp).toBeDefined();
    });
  });

  describe('getInitialMessages', () => {
    it('should return array with system message', () => {
      const user = { displayName: 'John' };
      const messages = getInitialMessages(user);

      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('CollabCanvas');
      expect(messages[0].timestamp).toBeDefined();
    });
  });

  describe('colorNameToHex', () => {
    it('should convert common color names to hex', () => {
      expect(colorNameToHex('red')).toBe('#FF0000');
      expect(colorNameToHex('blue')).toBe('#0000FF');
      expect(colorNameToHex('green')).toBe('#00FF00');
      expect(colorNameToHex('yellow')).toBe('#FFFF00');
    });

    it('should be case insensitive', () => {
      expect(colorNameToHex('RED')).toBe('#FF0000');
      expect(colorNameToHex('Blue')).toBe('#0000FF');
      expect(colorNameToHex('GREEN')).toBe('#00FF00');
    });

    it('should trim whitespace', () => {
      expect(colorNameToHex('  red  ')).toBe('#FF0000');
      expect(colorNameToHex('blue ')).toBe('#0000FF');
    });

    it('should return original string if color not found', () => {
      expect(colorNameToHex('#FF0000')).toBe('#FF0000');
      expect(colorNameToHex('unknowncolor')).toBe('unknowncolor');
      expect(colorNameToHex('#abc')).toBe('#abc');
    });

    it('should handle gray and grey spelling', () => {
      expect(colorNameToHex('gray')).toBe('#808080');
      expect(colorNameToHex('grey')).toBe('#808080');
    });
  });

  describe('COLOR_MAP', () => {
    it('should include common colors', () => {
      expect(COLOR_MAP.red).toBe('#FF0000');
      expect(COLOR_MAP.blue).toBe('#0000FF');
      expect(COLOR_MAP.green).toBe('#00FF00');
      expect(COLOR_MAP.yellow).toBe('#FFFF00');
      expect(COLOR_MAP.black).toBe('#000000');
      expect(COLOR_MAP.white).toBe('#FFFFFF');
    });

    it('should have both gray and grey', () => {
      expect(COLOR_MAP.gray).toBe('#808080');
      expect(COLOR_MAP.grey).toBe('#808080');
      expect(COLOR_MAP.gray).toBe(COLOR_MAP.grey);
    });
  });
});

