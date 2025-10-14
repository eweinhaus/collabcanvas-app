import OpenAI from 'openai';

/**
 * OpenAI Service for CollabCanvas AI integration
 * 
 * SECURITY WARNING: This implementation uses dangerouslyAllowBrowser: true
 * which exposes the API key in the client. This is acceptable for development
 * and testing, but for production use, you should:
 * 1. Implement a backend proxy to handle OpenAI API calls
 * 2. Store the API key securely on the server
 * 3. Implement rate limiting and usage tracking on the backend
 */

// Helper to get environment variables compatible with both Vite and Jest
function getEnv() {
  // In Jest test environment, use global shim
  if (typeof global !== 'undefined' && global.import && global.import.meta && global.import.meta.env) {
    return global.import.meta.env;
  }
  // In Vite environment, use import.meta.env
  return import.meta.env;
}

class OpenAIService {
  constructor() {
    this.apiKey = getEnv().VITE_OPENAI_API_KEY;
    
    if (!this.apiKey) {
      throw new Error(
        'VITE_OPENAI_API_KEY is not defined. Please add it to your .env.local file.\n' +
        'Get your API key from: https://platform.openai.com/api-keys'
      );
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }

  /**
   * Make a chat completion request to OpenAI
   * @param {Array} messages - Array of message objects with role and content
   * @param {Array} tools - Optional array of tool definitions
   * @param {string|object} toolChoice - Optional tool choice directive
   * @param {AbortSignal} signal - Optional abort signal for cancellation
   * @returns {Promise<object>} - First choice from the completion response
   */
  async chat(messages, tools = null, toolChoice = null, signal = null) {
    try {
      const requestOptions = {
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
        messages,
        ...(signal && { signal })
      };

      // Add tools if provided
      if (tools && tools.length > 0) {
        requestOptions.tools = tools;
        if (toolChoice) {
          requestOptions.tool_choice = toolChoice;
        }
      }

      const response = await this.client.chat.completions.create(requestOptions);
      
      return response.choices[0];
    } catch (error) {
      // Enhanced error handling
      if (error.name === 'AbortError') {
        throw new Error('AI request was cancelled');
      }
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }
      
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      }
      
      if (error.status === 500 || error.status === 503) {
        throw new Error('OpenAI service is currently unavailable. Please try again later.');
      }

      // Generic error
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

// Export singleton instance
let openaiServiceInstance = null;

export const getOpenAIService = () => {
  if (!openaiServiceInstance) {
    openaiServiceInstance = new OpenAIService();
  }
  return openaiServiceInstance;
};

export default getOpenAIService;

