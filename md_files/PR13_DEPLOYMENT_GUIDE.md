# PR 13 Deployment Guide

## Prerequisites

1. **OpenAI API Key**: Get one from https://platform.openai.com/api-keys
2. **Firebase Project**: Ensure you're using the correct project
3. **Firebase CLI**: Updated to latest version

---

## Local Testing with Emulator

### Step 1: Configure OpenAI API Key

Create `.runtimeconfig.json` in `functions/` directory:

```bash
cd collabcanvas-app/functions
cat > .runtimeconfig.json << 'EOF'
{
  "openai": {
    "key": "sk-YOUR_ACTUAL_OPENAI_API_KEY_HERE"
  }
}
EOF
```

**⚠️ Important**: This file is git-ignored. Never commit it!

### Step 2: Start Firebase Emulator

```bash
cd collabcanvas-app
firebase emulators:start --only functions
```

You should see:
```
✔  functions[us-central1-openaiChat]: http function initialized (http://localhost:5001/collabcanvas-81fdb/us-central1/openaiChat).
```

### Step 3: Get Firebase ID Token

1. Start your app: `npm run dev`
2. Login with Google
3. Open browser DevTools console
4. Run: `await firebase.auth().currentUser.getIdToken()`
5. Copy the token

### Step 4: Test the Function

Run the test script:

```bash
export FIREBASE_ID_TOKEN="<paste-token-here>"
cd functions
./test-openai-function.sh
```

Or test manually with curl:

```bash
curl -X POST http://localhost:5001/collabcanvas-81fdb/us-central1/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello in 5 words"}
    ]
  }'
```

**Expected Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Hello! How can I help?",
    "tool_calls": []
  }
}
```

---

## Production Deployment

### Step 1: Set API Key in Firebase

```bash
# Ensure you're on the right project
firebase use collabcanvas-81fdb

# Set the OpenAI API key
firebase functions:config:set openai.key="sk-YOUR_PRODUCTION_API_KEY"

# Verify it's set
firebase functions:config:get
```

Output should show:
```json
{
  "openai": {
    "key": "sk-..."
  }
}
```

### Step 2: Deploy the Function

```bash
cd collabcanvas-app
firebase deploy --only functions:openaiChat
```

You should see:
```
✔  functions[openaiChat(us-central1)] Successful update operation.
Function URL (openaiChat(us-central1)): https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat
```

### Step 3: Test Production Function

```bash
# Get a fresh ID token from production app
# Then test:

curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PRODUCTION_ID_TOKEN" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

### Step 4: Update Frontend Environment

Add to `collabcanvas-app/.env`:

```env
VITE_OPENAI_ENDPOINT=https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat
```

And for production deployment, ensure Render has this environment variable set.

---

## Smoke Tests

### Test 1: Authentication
```bash
# Without token - should return 401
curl -X POST <FUNCTION_URL> \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hi"}]}'

# Expected: {"error":"Unauthorized - missing token"}
```

### Test 2: Rate Limiting
```bash
# Make 11 requests rapidly - 11th should return 429
for i in {1..11}; do
  echo "Request $i:"
  curl -X POST <FUNCTION_URL> \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"messages":[{"role":"user","content":"hi"}]}'
  echo ""
done
```

### Test 3: Request Validation
```bash
# Invalid body - should return 400
curl -X POST <FUNCTION_URL> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"invalid":"body"}'

# Expected: {"error":"messages must be an array"}
```

### Test 4: CORS
```bash
# Preflight request - should return 204
curl -X OPTIONS <FUNCTION_URL> \
  -H "Origin: https://collabcanvas-app-km8k.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -i

# Check for headers:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: POST, OPTIONS
```

### Test 5: OpenAI Integration
```bash
# Valid request - should return assistant message
curl -X POST <FUNCTION_URL> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is 2+2? Answer in 3 words."}
    ]
  }'

# Expected: {"message":{"role":"assistant","content":"Two plus two.","tool_calls":[]}}
```

---

## Monitoring

### View Logs

```bash
# Stream logs in real-time
firebase functions:log --only openaiChat

# Or view in Firebase Console
# https://console.firebase.google.com/project/collabcanvas-81fdb/functions/logs
```

### Check Usage

1. **OpenAI Dashboard**: https://platform.openai.com/usage
   - Monitor API costs
   - Check request counts
   - View error rates

2. **Firebase Console**: https://console.firebase.google.com/project/collabcanvas-81fdb/functions
   - Check invocation counts
   - Monitor execution times
   - View error rates

---

## Troubleshooting

### Error: "OpenAI API key not configured"

**Local:**
- Check `.runtimeconfig.json` exists in `functions/`
- Verify key format: `{"openai":{"key":"sk-..."}}`

**Production:**
```bash
firebase functions:config:get
# Should show: {"openai":{"key":"sk-..."}}

# If empty, set it:
firebase functions:config:set openai.key="sk-..."
firebase deploy --only functions
```

### Error: "Unauthorized - invalid token"

- Token may be expired (1 hour lifetime)
- Get fresh token: `await firebase.auth().currentUser.getIdToken(true)`
- Verify you're logged in: `firebase.auth().currentUser`

### Error: CORS blocked in browser

- Check function CORS headers are present
- Verify Origin header matches allowed origins
- Check browser console for specific CORS error

### Function times out after 60s

- OpenAI API may be slow
- Check OpenAI status: https://status.openai.com
- Consider increasing timeout in function config
- Reduce `max_tokens` in OpenAI call

### High costs

- Check rate limiting is working (10 req/min/user)
- Review OpenAI usage dashboard
- Consider using gpt-4o-mini instead of gpt-4
- Add stricter request size limits

---

## Security Checklist

- ✅ API key stored server-side only (never in client code)
- ✅ Firebase ID token verification required
- ✅ Rate limiting: 10 requests/minute/user
- ✅ Request validation: message count, content length, body size
- ✅ CORS configured (can restrict to specific origins)
- ✅ Function timeout prevents runaway costs (60s)
- ✅ Max instances cap prevents cost spikes (10 instances)
- ✅ Error messages don't leak sensitive information
- ✅ Logging includes user IDs for auditing

---

## Next Steps

Once backend is deployed and tested:

1. **PR 13 Frontend** (Tasks 13.11-13.18):
   - Create `openaiService.js` to call the function
   - Build AI Panel UI component
   - Implement think-act loop in AIContext
   - Add tool schemas and executor

2. **PR 14** (AI Creation Commands)
3. **PR 15** (AI Manipulation Commands)
4. **PR 16** (AI Layout Commands)
5. **PR 17** (AI Complex Commands & Testing)

---

**Deployment Status**: ⏳ Ready to deploy (awaiting OpenAI API key configuration)

