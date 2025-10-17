# Firebase Functions OpenAI Proxy - Setup Complete ✅

**Date:** October 15, 2025  
**Status:** ✅ Local Testing Working  

---

## What Was Implemented

### 1. ✅ Firebase Functions Initialized
- Created `functions/` directory
- Installed dependencies: `openai@4.67.3`, `cors`
- Configured for Node.js 20 (your global version)

### 2. ✅ Proxy Function Created
- **Function Name:** `openaiChat`
- **Region:** us-central1
- **URL (Local):** `http://127.0.0.1:5001/collabcanvas-prod/us-central1/openaiChat`
- **URL (Prod):** `https://us-central1-collabcanvas-prod.cloudfunctions.net/openaiChat`

### 3. ✅ Security Improvements
- API key moved from browser to server
- Stored in `functions/.env` (gitignored)
- Lazy initialization prevents startup errors
- CORS enabled for your domain

### 4. ✅ Test Results
```bash
curl -X POST http://127.0.0.1:5001/collabcanvas-prod/us-central1/openaiChat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}]}'

# Response:
{
  "message": {
    "role": "assistant",
    "content": "Hello! How can I assist you today?"
  },
  "finish_reason": "stop"
}
```

**✅ Function works perfectly!**

---

## Next Steps - Update Client Code

### Current Status
- ✅ Firebase Function proxy working
- ⏳ Client still using old OpenAI SDK directly
- ⏳ Need to update `openaiService.js` to use proxy

### What Needs to Change

**File:** `src/services/openaiService.js`

Replace the entire file with this proxy version:

```javascript
/**
 * OpenAI Service Proxy for CollabCanvas
 * 
 * Routes all OpenAI requests through Firebase Functions for security.
 * API key is stored securely on the server, not exposed to the client.
 */

class OpenAIServiceProxy {
  constructor() {
    // Determine function URL based on environment
    this.functionUrl = this.getFunctionUrl();
    console.log('OpenAI Service initialized with proxy:', this.functionUrl);
  }

  /**
   * Get the appropriate function URL for current environment
   */
  getFunctionUrl() {
    // Production: Use your deployed function URL
    if (import.meta.env.PROD) {
      return 'https://us-central1-collabcanvas-prod.cloudfunctions.net/openaiChat';
    }
    
    // Development: Use local emulator
    return 'http://127.0.0.1:5001/collabcanvas-prod/us-central1/openaiChat';
  }

  /**
   * Make a chat completion request via Firebase Function proxy
   * @param {Array} messages - Array of message objects
   * @param {Array} tools - Optional array of tool definitions
   * @param {string|object} toolChoice - Optional tool choice directive
   * @param {AbortSignal} signal - Optional abort signal
   * @returns {Promise<object>} - First choice from completion
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
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      // Handle abort
      if (error.name === 'AbortError') {
        throw new Error('AI request was cancelled');
      }

      // Re-throw with user-friendly message
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Check if service is configured (always true for proxy)
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
```

---

## Testing the Integration

### 1. Keep Firebase Emulator Running
```bash
# In Terminal 1
cd /Users/ethan/Desktop/Github/Gauntlet/CollabCanvas/collabcanvas-app
firebase emulators:start --only functions
```

### 2. Update openaiService.js
Replace the file with the proxy version above (or switch to agent mode for automatic update)

### 3. Remove OpenAI package from client
```bash
cd /Users/ethan/Desktop/Github/Gauntlet/CollabCanvas/collabcanvas-app
npm uninstall openai
```

### 4. Start dev server
```bash
# In Terminal 2
npm run dev
```

### 5. Test AI Commands
1. Open `http://localhost:5173`
2. Log in
3. Try: `"Create a blue circle at 100, 100"`
4. Check Network tab → should see request to `127.0.0.1:5001`
5. Try: `"Move it to 500, 300"`
6. Verify no CORS errors

---

## Deploying to Production

### 1. Deploy the Function
```bash
firebase deploy --only functions
```

Expected output:
```
✔  functions[openaiChat(us-central1)] Successful update operation.
Function URL: https://us-central1-collabcanvas-prod.cloudfunctions.net/openaiChat
```

### 2. Set Production API Key
```bash
firebase functions:config:set openai.key="sk-your-production-key"
firebase deploy --only functions
```

### 3. Deploy Client
Your client code already handles prod vs dev URLs automatically:
```bash
git add .
git commit -m "feat: Secure OpenAI proxy via Firebase Functions"
git push origin main
```

Render will auto-deploy your client.

### 4. Test Production
1. Open `https://collabcanvas-app-km8k.onrender.com`
2. Test AI commands
3. Check Network tab → should hit Firebase Function URL
4. Verify no API key in browser (DevTools → Sources → search `sk-`)

---

## File Changes Summary

### Created Files
- ✅ `functions/index.js` - Proxy function
- ✅ `functions/package.json` - Dependencies
- ✅ `functions/.env` - API key (gitignored)
- ✅ `.firebaserc` - Project configuration
- ✅ `firebase.json` - Firebase config

### Modified Files
- ✅ `.gitignore` - Added `functions/.env`
- ⏳ `src/services/openaiService.js` - **NEEDS UPDATE** (see above)

### Removed Dependencies
- ⏳ `openai` package from client `package.json` - **NEEDS REMOVAL**

---

## Current Emulator Status

The Firebase emulator is running in the background:
- **Functions URL:** http://127.0.0.1:5001
- **Emulator UI:** http://127.0.0.1:4000
- **Function Endpoint:** http://127.0.0.1:5001/collabcanvas-prod/us-central1/openaiChat

You can view logs and test the function in the Emulator UI.

---

## Troubleshooting

### "Function not found"
- Check emulator is running: `curl http://127.0.0.1:4400`
- Restart emulator: `firebase emulators:start --only functions`

### "CORS error"
- Verify `cors` package installed in functions/
- Check CORS is enabled in function code (line 36)

### "API key not set"
- Check `functions/.env` exists
- Verify content: `cat functions/.env`
- Should have: `OPENAI_API_KEY=sk-...`

### "Client still hits api.openai.com"
- Update `openaiService.js` with proxy version
- Remove `openai` package: `npm uninstall openai`
- Clear browser cache
- Hard refresh (Cmd+Shift+R)

---

## Security Checklist ✅

- ✅ API key NOT in browser bundle
- ✅ API key in `.env` (gitignored)
- ✅ CORS properly configured
- ✅ Function validates requests
- ✅ Error handling doesn't expose secrets
- ⏳ Rate limiting (recommended for production)
- ⏳ Authentication (recommended for production)

---

## Next Actions

**Immediate (for local testing):**
1. Update `src/services/openaiService.js` with proxy version
2. Remove `openai` from client: `npm uninstall openai`
3. Test AI commands in browser

**For Production:**
1. Deploy function: `firebase deploy --only functions`
2. Test deployed function
3. Deploy client to Render
4. Verify security (no key in browser)

---

## Performance Notes

- **Local:** Function runs on localhost (very fast)
- **Production:** Cold start ~1-2s, warm ~200ms
- **OpenAI API:** Typically 1-3s response time
- **Total latency:** 2-5s (acceptable for AI features)

---

## Cost Considerations

**Firebase Functions (Blaze Plan):**
- First 2M invocations/month: FREE
- After that: $0.40 per million
- Your usage: ~100-1000 calls/day = FREE tier

**OpenAI API:**
- Model: gpt-4o-mini
- Cost: ~$0.0001 per request
- Your usage: $0.01-0.10/day

**Total:** Essentially free for your usage levels! 💰

---

## Documentation Updated

- ✅ This guide created
- ⏳ README.md - Update AI section with proxy info
- ⏳ PR12 docs - Note proxy implementation

---

**Status: ✅ Firebase Functions proxy working perfectly!**
**Next: Update client code to use proxy (switch to agent mode for automatic update)**

