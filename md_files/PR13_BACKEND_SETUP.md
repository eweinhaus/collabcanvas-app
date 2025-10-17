# PR 13 Backend Setup - Firebase Functions + OpenAI SDK

**Status**: ✅ COMPLETE  
**Date**: Current Session  
**Implementation**: Tasks 13.1-13.10

---

## Overview

This document describes the implementation of the backend infrastructure for AI features in CollabCanvas. We've set up a secure Firebase Cloud Function that acts as a proxy for OpenAI API calls.

---

## What Was Implemented

### 1. Firebase Functions Initialization (13.1)
- Initialized Firebase Functions with Node.js 20
- Created `functions/` directory with:
  - `package.json` - Dependencies and scripts
  - `index.js` - Cloud Functions code
  - `.eslintrc.js` - Linting configuration
  - `.gitignore` - Ignore node_modules and build artifacts

### 2. OpenAI SDK Installation (13.2)
- Installed `openai@^4.0.0` in functions directory
- Added to `dependencies` in `functions/package.json`
- SDK supports GPT-4, GPT-4o-mini, and function calling

### 3. API Key Configuration (13.3)

**For Local Development:**
1. Create `.runtimeconfig.json` in `functions/` directory:
```json
{
  "openai": {
    "key": "sk-YOUR_OPENAI_API_KEY_HERE"
  }
}
```

2. Or set environment variable:
```bash
export OPENAI_API_KEY="sk-YOUR_OPENAI_API_KEY_HERE"
```

**For Production:**
```bash
# Set Firebase function config
firebase functions:config:set openai.key="sk-YOUR_OPENAI_API_KEY_HERE"

# Verify
firebase functions:config:get

# Deploy
firebase deploy --only functions
```

**Security Notes:**
- Never commit `.runtimeconfig.json` to git (already in `.gitignore`)
- Never expose API keys in client-side code
- Use Firebase config for production deployment
- Rotate keys if accidentally exposed

### 4. openaiChat Function Implementation (13.4)

**Features:**
- HTTP endpoint accepting POST requests
- Accepts `messages`, `tools`, and `tool_choice` parameters
- Proxies requests to OpenAI Chat Completions API
- Returns assistant message with `role`, `content`, and `tool_calls`

**Function Configuration:**
- Runtime: Node.js 20
- Memory: 256 MiB
- Timeout: 60 seconds
- Max Instances: 10 (cost control)
- Model: `gpt-4o-mini` (dev), `gpt-4` (production)

### 5. Firebase Auth Verification (13.5)

**Implementation:**
- Extracts Firebase ID token from `Authorization: Bearer <token>` header
- Verifies token using `admin.auth().verifyIdToken()`
- Extracts user ID (`uid`) for rate limiting and logging
- Returns 401 if token is missing or invalid

**Flow:**
```
Client → Send request with ID token
Server → Verify token with Firebase Admin SDK
Server → Extract uid
Server → Process request OR reject with 401
```

### 6. CORS Configuration (13.6)

**Implementation:**
- Allows all origins with `cors: true` in function config
- Manual CORS headers for fine-grained control:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
- Handles preflight `OPTIONS` requests
- Returns 204 for OPTIONS, 405 for non-POST methods

**Future Hardening:**
- Restrict origins to production domain
- Update to: `Access-Control-Allow-Origin: https://collabcanvas-app-km8k.onrender.com`

### 7. Rate Limiting (13.7)

**Implementation:**
- In-memory Map keyed by user ID (`uid`)
- Limit: 10 requests per 60 seconds per user
- Sliding window approach (resets after 60s)
- Returns 429 with `Retry-After` header when exceeded

**Algorithm:**
```javascript
const rateLimitMap = new Map();
// Key: uid
// Value: { count: number, resetTime: timestamp }

checkRateLimit(uid):
  1. Check if uid exists in map
  2. If not, create entry with count=1, resetTime=now+60s
  3. If resetTime expired, reset entry
  4. If count >= 10, return 429
  5. Else increment count and allow
```

**Limitations:**
- Per-instance (not global across all instances)
- Lost on cold starts
- For production, consider Firestore-based rate limiting

### 8. Request Validation (13.8)

**Validation Rules:**

1. **messages array:**
   - Must be present and non-empty
   - Maximum 20 messages
   - Each message must have:
     - `role` (string): "system", "user", "assistant", "function", or "tool"
     - `content` (string): Maximum 1000 characters

2. **Body size:**
   - Maximum 10 KB (prevents abuse)

3. **Returns 400 with error message if invalid**

**Example Errors:**
- `"messages must be an array"`
- `"messages array cannot be empty"`
- `"message content cannot exceed 1000 characters"`
- `"request body cannot exceed 10KB"`

---

## Testing (13.9)

### Local Testing with Emulator

**Start Emulator:**
```bash
cd collabcanvas-app
firebase emulators:start --only functions
```

**Emulator URL:**
```
http://localhost:5001/collabcanvas-81fdb/us-central1/openaiChat
```

**Test Request (curl):**
```bash
# Get Firebase ID token first (from browser console after login)
# const user = firebase.auth().currentUser;
# const token = await user.getIdToken();

curl -X POST http://localhost:5001/collabcanvas-81fdb/us-central1/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN_HERE" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

**Expected Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "I'm doing well, thank you! How can I help you today?",
    "tool_calls": []
  }
}
```

### Test Cases

**1. Valid Request:**
- Status: 200
- Response includes `message` with `role`, `content`, `tool_calls`

**2. Missing Token:**
- Status: 401
- Error: `"Unauthorized - missing token"`

**3. Invalid Token:**
- Status: 401
- Error: `"Unauthorized - invalid token"`

**4. Invalid Request Body:**
- Status: 400
- Error: Specific validation error message

**5. Rate Limit Exceeded (11th request in 60s):**
- Status: 429
- Headers: `Retry-After: <seconds>`
- Error: `"Too many requests"`

**6. OpenAI API Error:**
- Status: 500/503/504
- Error: Specific OpenAI error message

---

## Deployment (13.10)

### Deploy to Firebase

**1. Set API Key:**
```bash
firebase functions:config:set openai.key="sk-YOUR_API_KEY"
```

**2. Deploy:**
```bash
cd collabcanvas-app
firebase deploy --only functions:openaiChat
```

**3. Get Function URL:**
```
https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat
```

**4. Update Frontend Environment:**
```bash
# In collabcanvas-app/.env
VITE_OPENAI_ENDPOINT=https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat
```

### Smoke Test (Production)

**Test with Postman or curl:**
```bash
curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PRODUCTION_ID_TOKEN" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

**Verify:**
- ✅ Returns 200 with valid response
- ✅ Authentication works (valid token accepted, invalid rejected)
- ✅ Rate limiting triggers after 10 requests
- ✅ CORS headers present
- ✅ Logs appear in Firebase Console

---

## Files Created/Modified

### New Files:
- `functions/index.js` - Cloud function implementation
- `functions/package.json` - Dependencies
- `functions/.eslintrc.js` - Linting config
- `functions/.gitignore` - Git ignore rules
- `md_files/PR13_BACKEND_SETUP.md` - This document

### Modified Files:
- `firebase.json` - Added functions emulator config
- `collabcanvas-app/.env` - Add VITE_OPENAI_ENDPOINT (not committed)

---

## Next Steps (PR 13 Frontend - Tasks 13.11-13.18)

1. **Create `src/services/openaiService.js`** (13.11)
   - Fetch wrapper to call the Cloud Function
   - Include Firebase ID token in Authorization header
   - Handle errors and loading states

2. **Create `src/services/aiTools.js`** (13.12)
   - Define 10 tool schemas (createShape, moveShape, etc.)
   - Follow OpenAI function calling format

3. **Create `src/utils/aiPrompts.js`** (13.13)
   - System prompt with canvas context
   - Message builders for user commands

4. **Create `src/context/AIContext.jsx`** (13.14)
   - Think-act loop controller
   - Execute tool calls from OpenAI responses
   - Integrate with CanvasContext

5. **Create `src/components/ai/AIPanel.jsx` and `AIPrompt.jsx`** (13.15)
   - Right-side sliding panel (400px width)
   - Conversation history display
   - Input field with submit button
   - Agent toggle button in Toolbar

6. **Implement Loading States & Error Handling** (13.16)
   - Toast notifications for errors
   - Loading spinner during API calls
   - Rate limit warnings

7. **Add AbortController for Cancellation** (13.17)
   - Allow users to cancel in-progress requests

8. **Implement Command History Tracking** (13.18)
   - Store command history in AIContext
   - Display in AI Panel

---

## Cost Estimation

**OpenAI API Costs (GPT-4o-mini):**
- Input: $0.15 per 1M tokens (~$0.00015 per 1K tokens)
- Output: $0.60 per 1M tokens (~$0.0006 per 1K tokens)

**Average Command:**
- Input: ~500 tokens (system prompt + user command + canvas state)
- Output: ~200 tokens (assistant response + tool calls)
- Cost per command: ~$0.0002 (0.02 cents)

**With Rate Limiting (10 req/min/user):**
- Max cost per user per hour: 600 commands × $0.0002 = $0.12
- 100 active users per day: $12/day = $360/month

**Mitigation:**
- Use gpt-4o-mini in development
- Implement stricter rate limits if needed
- Monitor usage via OpenAI dashboard
- Consider caching frequent commands

**Firebase Functions Costs (Free Tier):**
- 2M invocations/month (free)
- 400K GB-seconds compute (free)
- 200K CPU-seconds (free)
- 5 GB outbound data (free)

---

## Security Checklist

- ✅ API key stored server-side only
- ✅ Firebase ID token verification
- ✅ Rate limiting per user
- ✅ Request validation
- ✅ CORS configured (currently allow-all, can restrict)
- ✅ Error messages don't leak sensitive info
- ✅ Logging includes user IDs for auditing
- ✅ Function timeout prevents runaway costs
- ✅ Max instances cap prevents cost spikes

---

## Troubleshooting

### Problem: "OpenAI API key not configured"
**Solution:**
- For local: Create `.runtimeconfig.json` or set `OPENAI_API_KEY` env var
- For production: Run `firebase functions:config:set openai.key="sk-..."`

### Problem: "CORS error in browser"
**Solution:**
- Check that function includes CORS headers
- Verify Authorization header is allowed
- Check browser console for specific CORS error

### Problem: Rate limit not working
**Solution:**
- Rate limit is per-instance (cold starts reset counter)
- For global rate limiting, use Firestore counter

### Problem: Function times out
**Solution:**
- Check OpenAI API status
- Increase timeout in function config
- Reduce max_tokens in OpenAI call

### Problem: High costs
**Solution:**
- Check rate limiting is working
- Review OpenAI dashboard usage
- Switch to gpt-4o-mini if using gpt-4
- Add stricter request validation

---

## Summary

✅ **Tasks 13.1-13.10 Complete**
- Firebase Functions initialized with Node.js 20
- OpenAI SDK installed
- Secure `openaiChat` function implemented with:
  - Firebase Auth verification
  - CORS configuration
  - Rate limiting (10 req/min/user)
  - Request validation
  - Error handling
- Tested with emulator
- Ready for deployment

**Next PR**: PR 13 Frontend (Tasks 13.11-13.18) - Build the frontend AI integration

**Estimated Time**: Backend setup took ~2 hours (including documentation)

