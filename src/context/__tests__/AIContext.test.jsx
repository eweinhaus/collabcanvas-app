/**
 * AIContext Integration Tests
 * Tests for AI context state management, message handling, and integration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { AIProvider, useAI } from '../AIContext';
import toast from 'react-hot-toast';

// Mock openaiService before importing
jest.mock('../../services/openaiService', () => ({
  postChat: jest.fn(),
  getErrorMessage: jest.fn((error) => error.message || 'An error occurred'),
  isRateLimitError: jest.fn((error) => error.code === 'RATE_LIMIT'),
  isAuthError: jest.fn((error) => error.code === 'AUTH_FAILED' || error.code === 'AUTH_REQUIRED'),
  OpenAIError: class OpenAIError extends Error {
    constructor(message, code, statusCode) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
    }
  },
}));

// Mock dependencies
const { postChat } = require('../../services/openaiService');
jest.mock('react-hot-toast');
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-123',
      displayName: 'Test User',
      email: 'test@example.com',
    },
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('AIContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    toast.error = jest.fn();
    toast.success = jest.fn();
  });

  describe('Initialization', () => {
    it('should initialize with system prompt', () => {
      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('system');
      expect(result.current.messages[0].content).toContain('CollabCanvas');
    });

    it('should initialize with panel closed', () => {
      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      expect(result.current.panelOpen).toBe(false);
    });

    it('should load messages from localStorage on init', () => {
      const savedMessages = [
        { role: 'user', content: 'Hello', timestamp: Date.now() },
        { role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedMessages));

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      // System prompt + saved messages
      expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should load panel state from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'ai_panel_open') return 'true';
        return null;
      });

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      expect(result.current.panelOpen).toBe(true);
    });
  });

  describe('Panel Controls', () => {
    it('should toggle panel open and closed', () => {
      // Ensure localStorage returns false for panel state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'ai_panel_open') return 'false';
        return null;
      });

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      expect(result.current.panelOpen).toBe(false);

      act(() => {
        result.current.togglePanel();
      });

      expect(result.current.panelOpen).toBe(true);

      act(() => {
        result.current.togglePanel();
      });

      expect(result.current.panelOpen).toBe(false);
    });

    it('should open panel', () => {
      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      act(() => {
        result.current.openPanel();
      });

      expect(result.current.panelOpen).toBe(true);
    });

    it('should close panel', () => {
      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      act(() => {
        result.current.openPanel();
      });

      expect(result.current.panelOpen).toBe(true);

      act(() => {
        result.current.closePanel();
      });

      expect(result.current.panelOpen).toBe(false);
    });

    it('should persist panel state to localStorage', async () => {
      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      act(() => {
        result.current.togglePanel();
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('ai_panel_open', 'true');
      });
    });
  });

  describe('sendMessage', () => {
    it('should send message and receive response (task 13.30)', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?',
            },
          },
        ],
      };

      postChat.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      const initialMessageCount = result.current.messages.length;

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBe(initialMessageCount + 2); // user + assistant
      });

      const messages = result.current.messages;
      const userMessage = messages[messages.length - 2];
      const assistantMessage = messages[messages.length - 1];

      expect(userMessage.role).toBe('user');
      expect(userMessage.content).toBe('Hello');
      expect(assistantMessage.role).toBe('assistant');
      expect(assistantMessage.content).toBe('Hello! How can I help you?');
    });

    it('should handle authentication flow with ID token (task 13.31)', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      postChat.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      await waitFor(() => {
        expect(postChat).toHaveBeenCalled();
      });

      // Verify postChat was called with messages
      expect(postChat).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'Test message' }),
        ]),
        expect.any(Object) // AbortSignal
      );
    });

    it('should handle empty message', async () => {
      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      await act(async () => {
        await result.current.sendMessage('');
      });

      expect(toast.error).toHaveBeenCalledWith('Please enter a message');
      expect(postChat).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only message', async () => {
      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(toast.error).toHaveBeenCalledWith('Please enter a message');
      expect(postChat).not.toHaveBeenCalled();
    });

    it('should prevent concurrent messages', async () => {
      postChat.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      act(() => {
        result.current.sendMessage('First message');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await result.current.sendMessage('Second message');
      });

      expect(toast.error).toHaveBeenCalledWith('Please wait for the current response to complete');
    });

    it('should handle tool calls in response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Creating a shape...',
              tool_calls: [
                {
                  id: 'call-123',
                  type: 'function',
                  function: {
                    name: 'createShape',
                    arguments: '{"shapeType":"circle","x":100,"y":100,"fill":"#FF0000"}',
                  },
                },
              ],
            },
          },
        ],
      };

      postChat.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      await act(async () => {
        await result.current.sendMessage('Create a red circle');
      });

      await waitFor(() => {
        const lastMessage = result.current.messages[result.current.messages.length - 1];
        expect(lastMessage.tool_calls).toBeDefined();
        expect(lastMessage.tool_calls).toHaveLength(1);
      });
    });
  });

  describe('Error Handling (task 13.33)', () => {
    it('should handle rate limit errors (task 13.32)', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.code = 'RATE_LIMIT';
      rateLimitError.statusCode = 429;

      postChat.mockRejectedValueOnce(rateLimitError);

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Rate limit reached. Please wait a minute and try again.',
          expect.any(Object)
        );
      });
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      authError.code = 'AUTH_FAILED';
      authError.statusCode = 401;

      postChat.mockRejectedValueOnce(authError);

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Authentication failed. Please sign in again.',
          expect.any(Object)
        );
      });
    });

    it('should handle network errors', async () => {
      postChat.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle abort/cancellation', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      abortError.code = 'ABORTED';

      postChat.mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      // Should NOT show error toast for abort
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });
      
      // Should not have shown error toast for abort
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should add error message to conversation', async () => {
      postChat.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      const initialCount = result.current.messages.length;

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      await waitFor(() => {
        // User message + error message from assistant
        expect(result.current.messages.length).toBe(initialCount + 2);
      });

      const lastMessage = result.current.messages[result.current.messages.length - 1];
      expect(lastMessage.role).toBe('assistant');
      expect(lastMessage.content).toContain('error');
    });
  });

  describe('Message Persistence', () => {
    it('should persist messages to localStorage (task 13.36)', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      postChat.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'ai_messages',
          expect.any(String)
        );
      });

      // Verify only user and assistant messages are saved (not system)
      const savedData = localStorageMock.setItem.mock.calls.find(
        call => call[0] === 'ai_messages'
      )[1];
      const savedMessages = JSON.parse(savedData);
      
      expect(savedMessages.every(m => m.role !== 'system')).toBe(true);
    });

    it('should limit saved messages to 50', async () => {
      // Create many messages
      const manyMessages = Array.from({ length: 60 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: Date.now(),
      }));

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(manyMessages));

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      // Should load only last 50 (plus system prompt)
      expect(result.current.messages.length).toBeLessThanOrEqual(51);
    });
  });

  describe('clearMessages', () => {
    it('should clear conversation history', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      postChat.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      // Send a message
      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(1);
      });

      // Clear messages
      act(() => {
        result.current.clearMessages();
      });

      // Should only have system prompt left
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('system');
      expect(toast.success).toHaveBeenCalledWith('Conversation cleared');
    });
  });

  describe('cancelRequest', () => {
    it('should cancel ongoing request', async () => {
      let resolveFn;
      const pendingPromise = new Promise(resolve => {
        resolveFn = resolve;
      });

      postChat.mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => useAI(), {
        wrapper: AIProvider,
      });

      // Start a request
      act(() => {
        result.current.sendMessage('Test');
      });

      expect(result.current.loading).toBe(true);

      // Cancel it
      act(() => {
        result.current.cancelRequest();
      });

      expect(result.current.loading).toBe(false);

      // Clean up
      resolveFn({ choices: [{ message: { content: 'test' } }] });
    });
  });
});

