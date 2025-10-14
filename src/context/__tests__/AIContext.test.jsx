/**
 * Integration Tests for AIContext
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { AIProvider, useAI } from '../AIContext';
import { CanvasProvider } from '../CanvasContext';
import { getOpenAIService } from '../../services/openaiService';

// Mock uuid to avoid ESM issues in Jest
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

// Mock OpenAI service
jest.mock('../../services/openaiService', () => ({
  getOpenAIService: jest.fn(),
}));

// Mock Firestore services
jest.mock('../../services/firestoreService', () => ({
  getAllShapes: jest.fn().mockResolvedValue([]),
  subscribeToShapes: jest.fn(() => jest.fn()),
  createShape: jest.fn().mockResolvedValue(undefined),
  updateShape: jest.fn().mockResolvedValue(undefined),
  deleteShape: jest.fn().mockResolvedValue(undefined),
  updateShapeText: jest.fn().mockResolvedValue(undefined),
}));

// Mock auth
jest.mock('../../services/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn((callback) => {
      callback({ uid: 'test-user' });
      return jest.fn();
    }),
  },
}));

// Mock realtime cursor service
jest.mock('../../services/realtimeCursorService', () => ({
  setCursorPosition: jest.fn().mockResolvedValue(undefined),
  subscribeToCursors: jest.fn(() => jest.fn()),
  removeCursor: jest.fn().mockResolvedValue(undefined),
  registerDisconnectCleanup: jest.fn(() => jest.fn()),
}));

// Mock presence service
jest.mock('../../services/presenceService', () => ({
  subscribeToPresence: jest.fn(() => jest.fn()),
}));

// Mock beforeUnloadFlush
jest.mock('../../utils/beforeUnloadFlush', () => ({
  registerBeforeUnloadFlush: jest.fn(() => jest.fn()),
}));

describe('AIContext', () => {
  let mockOpenAIService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock OpenAI service
    mockOpenAIService = {
      isConfigured: jest.fn().mockReturnValue(true),
      chat: jest.fn(),
    };

    getOpenAIService.mockReturnValue(mockOpenAIService);
  });

  const wrapper = ({ children }) => (
    <CanvasProvider>
      <AIProvider>{children}</AIProvider>
    </CanvasProvider>
  );

  it('should provide AI context', () => {
    const { result } = renderHook(() => useAI(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.submitCommand).toBeDefined();
    expect(result.current.clearHistory).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.history).toEqual([]);
  });

  it('should check if AI is available', () => {
    const { result } = renderHook(() => useAI(), { wrapper });

    expect(result.current.isAvailable).toBe(true);
    expect(mockOpenAIService.isConfigured).toHaveBeenCalled();
  });

  it('should handle unavailable AI service', () => {
    getOpenAIService.mockImplementation(() => {
      throw new Error('API key not configured');
    });

    const { result } = renderHook(() => useAI(), { wrapper });

    expect(result.current.isAvailable).toBe(false);
  });

  it('should reject empty command', async () => {
    const { result } = renderHook(() => useAI(), { wrapper });

    let commandResult;
    await act(async () => {
      commandResult = await result.current.submitCommand('');
    });

    expect(commandResult.success).toBe(false);
    expect(mockOpenAIService.chat).not.toHaveBeenCalled();
  });

  it('should submit command and execute createShape tool', async () => {
    mockOpenAIService.chat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            function: {
              name: 'createShape',
              arguments: JSON.stringify({
                type: 'circle',
                x: 100,
                y: 200,
                color: 'red',
              }),
            },
          },
        ],
      },
    });

    const { result } = renderHook(() => useAI(), { wrapper });

    let commandResult;
    await act(async () => {
      commandResult = await result.current.submitCommand('Create a red circle');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockOpenAIService.chat).toHaveBeenCalled();
    expect(commandResult.success).toBe(true);
    expect(commandResult.toolResults).toHaveLength(1);
    expect(commandResult.toolResults[0].toolName).toBe('createShape');
  });

  it('should handle AI text response without tool calls', async () => {
    mockOpenAIService.chat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: 'I can help you create shapes!',
        tool_calls: null,
      },
    });

    const { result } = renderHook(() => useAI(), { wrapper });

    let commandResult;
    await act(async () => {
      commandResult = await result.current.submitCommand('What can you do?');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(commandResult.success).toBe(true);
    expect(commandResult.message).toBe('I can help you create shapes!');
  });

  it('should handle API errors gracefully', async () => {
    mockOpenAIService.chat.mockRejectedValue(new Error('API rate limit exceeded'));

    const { result } = renderHook(() => useAI(), { wrapper });

    await act(async () => {
      await result.current.submitCommand('Create a shape');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('API rate limit exceeded');
  });

  it('should track command history', async () => {
    mockOpenAIService.chat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: 'Shape created',
        tool_calls: null,
      },
    });

    const { result } = renderHook(() => useAI(), { wrapper });

    await act(async () => {
      await result.current.submitCommand('Create a circle');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].role).toBe('user');
    expect(result.current.history[0].content).toBe('Create a circle');
    expect(result.current.history[1].role).toBe('assistant');
  });

  it('should clear history', async () => {
    mockOpenAIService.chat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: 'Done',
      },
    });

    const { result } = renderHook(() => useAI(), { wrapper });

    await act(async () => {
      await result.current.submitCommand('Test command');
    });

    await waitFor(() => {
      expect(result.current.history.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toEqual([]);
  });

  it('should handle multiple tool calls in one command', async () => {
    mockOpenAIService.chat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            function: {
              name: 'createShape',
              arguments: JSON.stringify({
                type: 'circle',
                x: 100,
                y: 200,
                color: 'red',
              }),
            },
          },
          {
            function: {
              name: 'createShape',
              arguments: JSON.stringify({
                type: 'rectangle',
                x: 300,
                y: 400,
                width: 100,
                height: 100,
                color: 'blue',
              }),
            },
          },
        ],
      },
    });

    const { result } = renderHook(() => useAI(), { wrapper });

    let commandResult;
    await act(async () => {
      commandResult = await result.current.submitCommand('Create a circle and rectangle');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(commandResult.toolResults).toHaveLength(2);
    expect(commandResult.toolResults[0].toolName).toBe('createShape');
    expect(commandResult.toolResults[1].toolName).toBe('createShape');
  });

  it('should track latency for commands', async () => {
    mockOpenAIService.chat.mockResolvedValue({
      message: {
        role: 'assistant',
        content: 'Done',
      },
    });

    const { result } = renderHook(() => useAI(), { wrapper });

    let commandResult;
    await act(async () => {
      commandResult = await result.current.submitCommand('Test');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(commandResult.latency).toBeDefined();
    expect(typeof commandResult.latency).toBe('number');
    expect(commandResult.latency).toBeGreaterThanOrEqual(0);
  });

  it('should set loading state during command execution', async () => {
    let resolveChat;
    const chatPromise = new Promise((resolve) => {
      resolveChat = resolve;
    });
    mockOpenAIService.chat.mockReturnValue(chatPromise);

    const { result } = renderHook(() => useAI(), { wrapper });

    // Start command
    act(() => {
      result.current.submitCommand('Test');
    });

    // Should be loading
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Resolve the chat
    await act(async () => {
      resolveChat({
        message: {
          role: 'assistant',
          content: 'Done',
        },
      });
    });

    // Should no longer be loading
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

