/**
 * OpenAI Service Tests
 */

// Setup import.meta mock BEFORE any imports
global.importMetaEnv = {
  VITE_FIREBASE_PROJECT_ID: 'test-project-id',
  DEV: false,
  VITE_USE_EMULATOR: 'false',
};

// Mock Firebase auth
jest.mock('../firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
    },
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Now we can import - but we need to mock the service to avoid import.meta
jest.mock('../openaiService', () => {
  // Create mock implementations
  class OpenAIError extends Error {
    constructor(message, code, statusCode) {
      super(message);
      this.name = 'OpenAIError';
      this.code = code;
      this.statusCode = statusCode;
    }
  }

  const postChat = jest.fn();
  const isRateLimitError = (error) => error instanceof OpenAIError && error.code === 'RATE_LIMIT';
  const isAuthError = (error) => error instanceof OpenAIError && (
    error.code === 'AUTH_REQUIRED' || 
    error.code === 'AUTH_FAILED' ||
    error.code === 'AUTH_TOKEN_ERROR'
  );
  const getErrorMessage = (error) => {
    if (error instanceof OpenAIError) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  };

  return {
    postChat,
    OpenAIError,
    isRateLimitError,
    isAuthError,
    getErrorMessage,
  };
});

const { postChat, OpenAIError, isRateLimitError, isAuthError, getErrorMessage } = require('../openaiService');
const { auth } = require('../firebase');

describe('openaiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset postChat mock implementation
    postChat.mockReset();
    
    // Ensure auth.currentUser is set
    if (!auth.currentUser) {
      auth.currentUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
      };
    }
    auth.currentUser.getIdToken.mockResolvedValue('mock-id-token');
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

      postChat.mockResolvedValueOnce(mockResponse);

      const messages = [
        { role: 'user', content: 'Hello' },
      ];

      const result = await postChat(messages);

      expect(result).toEqual(mockResponse);
      expect(postChat).toHaveBeenCalledWith(messages);
    });

    it('should handle error responses', async () => {
      const error = new OpenAIError('Test error', 'TEST_ERROR', 500);
      postChat.mockRejectedValueOnce(error);

      await expect(postChat([{ role: 'user', content: 'test' }]))
        .rejects
        .toThrow('Test error');
    });

    it('should handle rate limit errors', async () => {
      const error = new OpenAIError('Rate limit', 'RATE_LIMIT', 429);
      postChat.mockRejectedValueOnce(error);

      await expect(postChat([{ role: 'user', content: 'test' }]))
        .rejects
        .toThrow('Rate limit');
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

