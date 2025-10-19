/**
 * OpenAI Service
 * Handles communication with Firebase Cloud Function proxy for OpenAI API
 */

import { auth } from './firebase';

/**
 * Custom error class for OpenAI-related errors
 */
export class OpenAIError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'OpenAIError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Get the Firebase Cloud Function URL
 * Supports both production and emulator environments
 */
function getFunctionUrl() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment && import.meta.env.VITE_USE_EMULATOR === 'true') {
    // Use emulator
    return `http://localhost:5001/${projectId}/us-central1/openaiChat`;
  }

  // Production URL
  return `https://us-central1-${projectId}.cloudfunctions.net/openaiChat`;
}

/**
 * Get fresh ID token from Firebase Auth
 * @returns {Promise<string>} ID token
 */
async function getIdToken() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new OpenAIError('User not authenticated', 'AUTH_REQUIRED', 401);
  }
  
  try {
    // Force refresh to ensure token is valid
    return await currentUser.getIdToken(true);
  } catch (error) {
    throw new OpenAIError('Failed to get authentication token', 'AUTH_TOKEN_ERROR', 401);
  }
}

/**
 * Post chat messages to OpenAI via Cloud Function
 * @param {Array} messages - Array of message objects {role, content}
 * @param {Object} [options] - Optional configuration
 * @param {Array} [options.tools] - Tool definitions for function calling
 * @param {string} [options.toolChoice] - Tool choice strategy ('auto', 'none', etc.)
 * @param {string} [options.model] - Model to use ('gpt-3.5-turbo', 'gpt-4o-mini', etc.)
 * @param {AbortSignal} [options.abortSignal] - Optional abort signal for cancellation
 * @returns {Promise<Object>} Response from OpenAI
 */
export async function postChat(messages, options = {}) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new OpenAIError('Messages array is required', 'INVALID_INPUT', 400);
  }

  const { tools, toolChoice, model, abortSignal } = options;
  const functionUrl = getFunctionUrl();
  
  try {
    // Get fresh ID token
    const tokenStartTime = performance.now();
    const idToken = await getIdToken();
    const tokenEndTime = performance.now();
    console.log(`🔐 [OpenAI Service] Got auth token (${Math.round(tokenEndTime - tokenStartTime)}ms)`);

    // Prepare request
    const requestBody = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        // Include tool_calls if present (for function calling)
        ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
        ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
      })),
      // Include tools if provided
      ...(tools && { tools }),
      ...(toolChoice && { tool_choice: toolChoice }),
      // Include model selection
      ...(model && { model }),
    };

    // Make request to Cloud Function
    const fetchStartTime = performance.now();
    console.log(`🌐 [OpenAI Service] Sending ${JSON.stringify(requestBody).length} bytes to Cloud Function`);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal,
    });
    
    const fetchEndTime = performance.now();
    console.log(`🌐 [OpenAI Service] Received response (${Math.round(fetchEndTime - fetchStartTime)}ms network time)`);

    // Handle various HTTP status codes
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 401:
          throw new OpenAIError(
            errorData.error || 'Authentication failed. Please sign in again.',
            'AUTH_FAILED',
            401
          );
        
        case 429:
          throw new OpenAIError(
            errorData.error || 'Rate limit exceeded. Please wait a minute and try again.',
            'RATE_LIMIT',
            429
          );
        
        case 400:
          throw new OpenAIError(
            errorData.error || 'Invalid request',
            'INVALID_REQUEST',
            400
          );
        
        default:
          throw new OpenAIError(
            errorData.error || 'Server error occurred',
            'SERVER_ERROR',
            response.status
          );
      }
    }

    // Parse successful response
    const parseStartTime = performance.now();
    const data = await response.json();
    const parseEndTime = performance.now();
    console.log(`📄 [OpenAI Service] Parsed response (${Math.round(parseEndTime - parseStartTime)}ms)`);
    
    return data;

  } catch (error) {
    // Handle abort
    if (error.name === 'AbortError') {
      throw new OpenAIError('Request cancelled', 'ABORTED', 0);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new OpenAIError(
        'Network error. Please check your connection.',
        'NETWORK_ERROR',
        0
      );
    }

    // Re-throw OpenAIError as-is
    if (error instanceof OpenAIError) {
      throw error;
    }

    // Unknown error
    throw new OpenAIError(
      error.message || 'Unknown error occurred',
      'UNKNOWN_ERROR',
      500
    );
  }
}

/**
 * Check if error is a rate limit error
 * @param {Error} error
 * @returns {boolean}
 */
export function isRateLimitError(error) {
  return error instanceof OpenAIError && error.code === 'RATE_LIMIT';
}

/**
 * Check if error is an authentication error
 * @param {Error} error
 * @returns {boolean}
 */
export function isAuthError(error) {
  return error instanceof OpenAIError && (
    error.code === 'AUTH_REQUIRED' || 
    error.code === 'AUTH_FAILED' ||
    error.code === 'AUTH_TOKEN_ERROR'
  );
}

/**
 * Get user-friendly error message
 * @param {Error} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (error instanceof OpenAIError) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

