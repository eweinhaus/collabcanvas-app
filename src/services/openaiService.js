/**
 * OpenAI Service Proxy for CollabCanvas
 * 
 * Routes all OpenAI requests through Firebase Functions for security.
 * API key is stored securely on the server, not exposed to the client.
 * 
 * This eliminates CORS issues and protects the API key from browser exposure.
 */

class OpenAIServiceProxy {
  constructor() {
    // Determine function URL based on environment
    this.functionUrl = this.getFunctionUrl();
    console.log('✅ OpenAI Service initialized with secure proxy:', this.functionUrl);
  }

  /**
   * Get the appropriate function URL for current environment
   */
  getFunctionUrl() {
    // Production: Use deployed Firebase Function
    if (import.meta.env.PROD) {
      return 'https://us-central1-collabcanvas-prod.cloudfunctions.net/openaiChat';
    }
    
    // Development: Use local Firebase emulator
    return 'http://127.0.0.1:5001/collabcanvas-prod/us-central1/openaiChat';
  }

  /**
   * Make a chat completion request via Firebase Function proxy
   * @param {Array} messages - Array of message objects with role and content
   * @param {Array} tools - Optional array of tool definitions
   * @param {string|object} toolChoice - Optional tool choice directive
   * @param {AbortSignal} signal - Optional abort signal for cancellation
   * @returns {Promise<object>} - First choice from the completion response
   */
  async chat(messages, tools = null, toolChoice = null, signal = null) {
    try {
      const requestBody = { messages };

      // Add tools if provided
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
        if (toolChoice) {
          requestBody.tool_choice = toolChoice;
        }
      }

      console.log('🚀 Sending request to Firebase Function proxy...');
      
      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Received response from proxy');
      
      return result;

    } catch (error) {
      // Handle abort
      if (error.name === 'AbortError') {
        throw new Error('AI request was cancelled');
      }

      // Handle fetch errors
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to AI service. Make sure Firebase emulator is running on port 5001.');
      }

      // Re-throw with user-friendly message
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Check if service is configured
   * For proxy mode, always returns true since API key is on server
   * @returns {boolean}
   */
  isConfigured() {
    return true;
  }
}

// Export singleton instance
let serviceInstance = null;

export const getOpenAIService = () => {
  if (!serviceInstance) {
    serviceInstance = new OpenAIServiceProxy();
  }
  return serviceInstance;
};

export default getOpenAIService;
