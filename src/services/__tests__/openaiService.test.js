/**
 * OpenAI Service Tests
 */

// Mock import.meta.env before importing the module
const mockEnv = {
  VITE_FIREBASE_PROJECT_ID: 'test-project-id',
  DEV: false,
  VITE_USE_EMULATOR: 'false',
};

// Mock import.meta
jest.mock('import.meta', () => ({
  env: mockEnv,
}), { virtual: true });

// Replace import.meta.env in the module
const originalEnv = import.meta;
Object.defineProperty(import.meta, 'env', {
  get: () => mockEnv,
  configurable: true,
});

import { postChat, OpenAIError, isRateLimitError, isAuthError, getErrorMessage } from '../openaiService';
import { auth } from '../firebase';

// Mock Firebase
jest.mock('../firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('openaiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock current user
    auth.currentUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
    };
  });

  describe('postChat', () => {
    it('should successfully post messages and return response', async () => {
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

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const messages = [
        { role: 'user', content: 'Hello' },
      ];

      const result = await postChat(messages);

      expect(result).toEqual(mockResponse);
      expect(auth.currentUser.getIdToken).toHaveBeenCalledWith(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-id-token',
          },
          body: expect.any(String),
        })
      );
    });

    it('should throw error if user is not authenticated', async () => {
      auth.currentUser = null;

      await expect(postChat([{ role: 'user', content: 'test' }]))
        .rejects
        .toThrow(OpenAIError);

      await expect(postChat([{ role: 'user', content: 'test' }]))
        .rejects
        .toThrow('User not authenticated');
    });

    it('should throw error if messages array is empty', async () => {
      await expect(postChat([]))
        .rejects
        .toThrow(OpenAIError);
      
      await expect(postChat([]))
        .rejects
        .toThrow('Messages array is required');
    });

    it('should throw error if messages is not an array', async () => {
      await expect(postChat(null))
        .rejects
        .toThrow(OpenAIError);

      await expect(postChat('invalid'))
        .rejects
        .toThrow(OpenAIError);
    });

    it('should handle 401 authentication errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(postChat([{ role: 'user', content: 'test' }]))
        .rejects
        .toThrow('Unauthorized');
    });

    it('should handle 429 rate limit errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      const error = await postChat([{ role: 'user', content: 'test' }])
        .catch(e => e);

      expect(error).toBeInstanceOf(OpenAIError);
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
    });

    it('should handle 400 bad request errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request' }),
      });

      const error = await postChat([{ role: 'user', content: 'test' }])
        .catch(e => e);

      expect(error).toBeInstanceOf(OpenAIError);
      expect(error.code).toBe('INVALID_REQUEST');
    });

    it('should handle 500 server errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const error = await postChat([{ role: 'user', content: 'test' }])
        .catch(e => e);

      expect(error).toBeInstanceOf(OpenAIError);
      expect(error.code).toBe('SERVER_ERROR');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const error = await postChat([{ role: 'user', content: 'test' }])
        .catch(e => e);

      expect(error).toBeInstanceOf(OpenAIError);
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should handle abort signal', async () => {
      const abortController = new AbortController();
      
      global.fetch.mockImplementationOnce(() => {
        abortController.abort();
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
      });

      const error = await postChat(
        [{ role: 'user', content: 'test' }],
        abortController.signal
      ).catch(e => e);

      expect(error).toBeInstanceOf(OpenAIError);
      expect(error.code).toBe('ABORTED');
    });

    it('should include tool_calls in message if present', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'test' } }] }),
      });

      const messages = [
        {
          role: 'assistant',
          content: 'test',
          tool_calls: [{ id: '1', type: 'function', function: { name: 'test' } }],
        },
      ];

      await postChat(messages);

      const callArgs = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callArgs.messages[0].tool_calls).toBeDefined();
    });
  });

  describe('isRateLimitError', () => {
    it('should return true for rate limit errors', () => {
      const error = new OpenAIError('Rate limit', 'RATE_LIMIT', 429);
      expect(isRateLimitError(error)).toBe(true);
    });

    it('should return false for non-rate-limit errors', () => {
      const error = new OpenAIError('Auth error', 'AUTH_FAILED', 401);
      expect(isRateLimitError(error)).toBe(false);
    });

    it('should return false for non-OpenAIError', () => {
      const error = new Error('Regular error');
      expect(isRateLimitError(error)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should return true for AUTH_REQUIRED', () => {
      const error = new OpenAIError('Not authenticated', 'AUTH_REQUIRED', 401);
      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for AUTH_FAILED', () => {
      const error = new OpenAIError('Auth failed', 'AUTH_FAILED', 401);
      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for AUTH_TOKEN_ERROR', () => {
      const error = new OpenAIError('Token error', 'AUTH_TOKEN_ERROR', 401);
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for non-auth errors', () => {
      const error = new OpenAIError('Rate limit', 'RATE_LIMIT', 429);
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return message from OpenAIError', () => {
      const error = new OpenAIError('Custom error message', 'TEST', 500);
      expect(getErrorMessage(error)).toBe('Custom error message');
    });

    it('should return default message for non-OpenAIError', () => {
      const error = new Error('Some error');
      expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });
  });
});

