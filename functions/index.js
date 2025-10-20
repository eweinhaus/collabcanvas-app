/**
 * CollabCanvas AI Functions
 * OpenAI Chat Completion Proxy with Security
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const OpenAI = require("openai");

// Initialize Firebase Admin
admin.initializeApp();

// Global options for cost control
setGlobalOptions({maxInstances: 10});

// Rate limiting map (in-memory, per-instance)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

/**
 * Check if user has exceeded rate limit
 * @param {string} uid - User ID
 * @return {Object} {isLimited: boolean, resetTime: number}
 */
function checkRateLimit(uid) {
  const now = Date.now();
  const userRecord = rateLimitMap.get(uid);

  if (!userRecord) {
    // First request from this user
    rateLimitMap.set(uid, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return {isLimited: false, resetTime: now + RATE_LIMIT_WINDOW};
  }

  // Check if window has expired
  if (now > userRecord.resetTime) {
    // Reset the window
    rateLimitMap.set(uid, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return {isLimited: false, resetTime: now + RATE_LIMIT_WINDOW};
  }

  // Within window - check count
  if (userRecord.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {isLimited: true, resetTime: userRecord.resetTime};
  }

  // Increment count
  userRecord.count++;
  return {isLimited: false, resetTime: userRecord.resetTime};
}

/**
 * Validate request body
 * @param {Object} body - Request body
 * @return {Object} {isValid: boolean, error: string}
 */
function validateRequest(body) {
  // Check messages array
  if (!body.messages || !Array.isArray(body.messages)) {
    return {isValid: false, error: "messages must be an array"};
  }

  if (body.messages.length === 0) {
    return {isValid: false, error: "messages array cannot be empty"};
  }

  if (body.messages.length > 20) {
    return {isValid: false, error: "messages array cannot exceed 20 items"};
  }

  // Validate each message
  for (const msg of body.messages) {
    if (!msg.role || typeof msg.role !== "string") {
      return {isValid: false, error: "each message must have a role string"};
    }

    // Allow messages without content (for tool messages)
    if (msg.content !== undefined && typeof msg.content !== "string") {
      return {isValid: false, error: "message content must be a string"};
    }

    // System prompts and tool results can be longer
    const maxLength = msg.role === "system" ? 5000 : 2000;
    if (msg.content && msg.content.length > maxLength) {
      return {
        isValid: false,
        error: `message content cannot exceed ${maxLength} characters`,
      };
    }
  }

  // Check body size (increased for tool definitions)
  const bodySize = JSON.stringify(body).length;
  if (bodySize > 50000) {
    return {isValid: false, error: "request body cannot exceed 50KB"};
  }

  return {isValid: true};
}

/**
 * OpenAI Chat Completion Proxy
 * Secure backend proxy for OpenAI API calls
 */
exports.openaiChat = onRequest(
    {
      timeoutSeconds: 60,
      memory: "256MiB",
      // Keep 1 instance warm in production, 0 in dev (save costs)
      minInstances: process.env.FUNCTIONS_EMULATOR ? 0 : 1,
      maxInstances: 10,
      cors: true, // Enable CORS for all origins (can be restricted later)
    },
    async (req, res) => {
      // CORS headers for manual handling
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers",
          "Content-Type, Authorization");

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      // Only allow POST
      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      try {
        // 1. Verify Firebase ID token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          logger.warn("Missing or invalid authorization header");
          res.status(401).json({error: "Unauthorized - missing token"});
          return;
        }

        const idToken = authHeader.split("Bearer ")[1];
        let decodedToken;

        try {
          decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (error) {
          logger.error("Token verification failed:", error);
          res.status(401).json({error: "Unauthorized - invalid token"});
          return;
        }

        const uid = decodedToken.uid;
        logger.info(`Request from user: ${uid}`);

        // 2. Check rate limit
        const rateLimit = checkRateLimit(uid);
        if (rateLimit.isLimited) {
          const retryAfter = Math.ceil(
              (rateLimit.resetTime - Date.now()) / 1000,
          );
          logger.warn(`Rate limit exceeded for user ${uid}`);
          res.set("Retry-After", retryAfter.toString());
          res.status(429).json({
            error: "Too many requests",
            retryAfter: retryAfter,
          });
          return;
        }

        // 3. Validate request body
        const validation = validateRequest(req.body);
        if (!validation.isValid) {
          logger.warn(`Invalid request: ${validation.error}`);
          res.status(400).json({error: validation.error});
          return;
        }

        // 4. Get OpenAI API key from environment
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!openaiApiKey) {
          logger.error("OpenAI API key not configured");
          res.status(500).json({
            error: "OpenAI API key not configured on server",
          });
          return;
        }

        // 5. Initialize OpenAI client
        const openai = new OpenAI({
          apiKey: openaiApiKey,
        });

        // 6. Extract request parameters
        const {messages, tools, tool_choice, model} = req.body;

        // 7. Validate and select model (whitelist for security)
        const allowedModels = ["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4o"];
        const selectedModel = allowedModels.includes(model)
          ? model
          : "gpt-4o-mini"; // Default to gpt-4o-mini for safety

        logger.info(`Using model: ${selectedModel}`);

        // 8. Call OpenAI API
        logger.info("Calling OpenAI API...");
        const completion = await openai.chat.completions.create({
          model: selectedModel, // Use client-selected model
          messages: messages,
          tools: tools || undefined,
          tool_choice: tool_choice || undefined,
          temperature: 0.1, // Lower for deterministic tool calls (was: 0.3)
          max_tokens: 310, // Sufficient for tool calls (was: 1000)
        });

        // 9. Extract and return response in format expected by frontend
        logger.info("OpenAI API call successful");
        res.json({
          choices: [{
            message: {
              role: completion.choices[0].message.role,
              content: completion.choices[0].message.content,
              tool_calls: completion.choices[0].message.tool_calls || undefined,
            },
          }],
        });
      } catch (error) {
        logger.error("OpenAI API error:", error);

        // Handle different error types
        if (error.status === 401) {
          res.status(500).json({
            error: "OpenAI API authentication failed",
          });
        } else if (error.status === 429) {
          res.status(503).json({
            error: "OpenAI API rate limit exceeded, try again later",
          });
        } else if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
          res.status(504).json({
            error: "OpenAI API request timeout",
          });
        } else {
          res.status(500).json({
            error: error.message || "Internal server error",
          });
        }
      }
    },
);

/**
 * DSPy Service Proxy
 * Proxy for DSPy complex object decomposition service
 * Adds authentication and rate limiting to Cloud Run service
 */
exports.callDSPyService = onRequest(
    {
      timeoutSeconds: 10,
      memory: "256MiB",
      minInstances: 0, // Scale to zero when not in use
      maxInstances: 5,
      cors: true,
    },
    async (req, res) => {
      // CORS headers
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers",
          "Content-Type, Authorization");

      // Handle preflight
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      // Only allow POST
      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      try {
        // 1. Verify Firebase ID token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          logger.warn("DSPy proxy: Missing authorization header");
          res.status(401).json({error: "Unauthorized - missing token"});
          return;
        }

        const idToken = authHeader.split("Bearer ")[1];
        let decodedToken;
        try {
          decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (error) {
          logger.warn("DSPy proxy: Invalid token", {error: error.message});
          res.status(401).json({error: "Unauthorized - invalid token"});
          return;
        }

        // 2. Check rate limit
        const {isLimited, resetTime} = checkRateLimit(decodedToken.uid);
        if (isLimited) {
          logger.warn("DSPy proxy: Rate limit exceeded", {
            uid: decodedToken.uid,
            resetTime,
          });
          res.status(429).json({
            error: "Rate limit exceeded",
            resetTime,
          });
          return;
        }

        // 3. Validate request body
        const {userRequest, position} = req.body;
        if (!userRequest || typeof userRequest !== "string") {
          res.status(400).json({
            error: "Missing or invalid 'userRequest' field",
          });
          return;
        }

        if (userRequest.length > 500) {
          res.status(400).json({
            error: "userRequest cannot exceed 500 characters",
          });
          return;
        }

        // 4. Get DSPy service URL from config
        // Set via: firebase functions:config:set dspy.url="https://..."
        const dspyServiceUrl = process.env.DSPY_SERVICE_URL ||
          "https://dspy-service-placeholder.run.app"; // TODO: Update after deployment

        logger.info("DSPy proxy: Calling service", {
          uid: decodedToken.uid,
          request: userRequest.substring(0, 50),
        });

        // 5. Call DSPy service with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

        try {
          const response = await fetch(`${dspyServiceUrl}/decompose`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              request: userRequest,
              position: position || "viewport_center",
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          // Handle non-2xx responses
          if (!response.ok) {
            const errorText = await response.text();
            logger.error("DSPy service error", {
              status: response.status,
              error: errorText,
            });
            res.status(response.status).json({
              error: `DSPy service error: ${response.status}`,
              details: errorText,
            });
            return;
          }

          // Parse and return result
          const result = await response.json();

          if (!result.success) {
            logger.error("DSPy inference failed", {error: result.error});
            res.status(500).json({
              error: "DSPy inference failed",
              details: result.error,
            });
            return;
          }

          logger.info("DSPy proxy: Success", {
            uid: decodedToken.uid,
            objectType: result.object_type,
            shapeCount: result.shapes?.length || 0,
          });

          res.status(200).json(result);
        } catch (fetchError) {
          clearTimeout(timeout);

          if (fetchError.name === "AbortError") {
            logger.error("DSPy service timeout");
            res.status(504).json({error: "DSPy service timeout"});
          } else {
            logger.error("DSPy service fetch failed", {
              error: fetchError.message,
            });
            res.status(503).json({
              error: "DSPy service unavailable",
              details: fetchError.message,
            });
          }
        }
      } catch (error) {
        logger.error("DSPy proxy error", {error: error.message});
        res.status(500).json({error: "Internal server error"});
      }
    },
);
