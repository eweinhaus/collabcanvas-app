// functions/index.js
const functions = require('firebase-functions');
const OpenAI = require('openai').default;
const cors = require('cors')({ origin: true });

// Lazy initialize OpenAI client (only when function is called)
// This ensures environment variables are loaded before client creation
let openai = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY || functions.config().openai?.key;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set. Please configure it in functions/.env for local development or use firebase functions:config:set for production.');
    }
    
    openai = new OpenAI({ apiKey });
    console.log('OpenAI client initialized successfully');
  }
  return openai;
}

/**
 * OpenAI Chat Proxy Function
 * Securely forwards chat completion requests to OpenAI API
 * 
 * Request body:
 * {
 *   messages: Array<{role: string, content: string}>,
 *   tools: Array (optional),
 *   tool_choice: string|object (optional)
 * }
 */
exports.openaiChat = functions.https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
      }

      // Extract request parameters
      const { messages, tools, tool_choice } = req.body;

      // Validate required parameters
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: 'messages array is required and must not be empty'
        });
      }

      try {
        // Build OpenAI request
        const requestOptions = {
          model: 'gpt-4o-mini',
          messages
        };

        // Add tools if provided
        if (tools && Array.isArray(tools) && tools.length > 0) {
          requestOptions.tools = tools;
          if (tool_choice) {
            requestOptions.tool_choice = tool_choice;
          }
        }

        // Call OpenAI API
        console.log('Calling OpenAI API with model:', requestOptions.model);
        const completion = await getOpenAI().chat.completions.create(requestOptions);

        // Return first choice
        return res.status(200).json(completion.choices[0]);

      } catch (error) {
        console.error('OpenAI API error:', error);

        // Handle specific error types
        if (error.status === 401) {
          return res.status(401).json({
            error: 'Invalid OpenAI API key configured on server'
          });
        }

        if (error.status === 429) {
          return res.status(429).json({
            error: 'OpenAI rate limit exceeded. Please try again later.'
          });
        }

        if (error.status === 500 || error.status === 503) {
          return res.status(503).json({
            error: 'OpenAI service temporarily unavailable'
          });
        }

        // Generic error
        return res.status(500).json({
          error: error.message || 'Internal server error'
        });
      }
    });
  });