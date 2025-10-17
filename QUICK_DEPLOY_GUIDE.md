# Quick Deploy Guide - Firebase Functions

## Current Status

✅ **Backend Implementation:** Complete  
✅ **Local Testing:** Passed  
⏸️ **Production Deployment:** Requires Blaze Plan  

---

## What You Need to Do

### Step 1: Upgrade to Blaze Plan (5 minutes)

**Link:** https://console.firebase.google.com/project/collabcanvas-81fdb/usage/details

**What to do:**
1. Click "Upgrade to Blaze"
2. Add a credit/debit card
3. ⚠️ **Important:** Set billing alerts at $5, $10, $25
4. Complete upgrade

**Cost:** $0/month for your usage (well within 2M free invocations/month)

**Why safe:**
- Free tier: 2 million invocations/month
- Your usage: ~30K invocations/month in production
- Rate limiting: Prevents abuse (10 req/min/user)
- Billing alerts: Email warnings before charges

### Step 2: Deploy Function (1 minute)

```bash
cd collabcanvas-app
firebase deploy --only functions:openaiChat
```

### Step 3: Get Function URL

After deployment, you'll see:
```
Function URL: https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat
```

### Step 4: Update Frontend Environment

**For Render deployment:**
1. Go to Render dashboard
2. Add environment variable:
   - Key: `VITE_OPENAI_ENDPOINT`
   - Value: `https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat`
3. Redeploy frontend

**For local development:**
Add to `collabcanvas-app/.env`:
```
VITE_OPENAI_ENDPOINT=http://127.0.0.1:5001/collabcanvas-81fdb/us-central1/openaiChat
```

---

## Test Production Deployment

### Get a Firebase Token

1. Login to your deployed app
2. Open DevTools console
3. Run: `const token = await firebase.auth().currentUser.getIdToken()`
4. Copy the token

### Test the Function

```bash
curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say hello in exactly 3 words"}
    ]
  }'
```

**Expected response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Hello there friend!",
    "tool_calls": []
  }
}
```

---

## Local Testing (Already Works!)

Your function is working locally in the emulator:

```bash
# If emulator isn't running:
cd collabcanvas-app
firebase emulators:start --only functions

# Test it:
./test-openai-local.sh
```

---

## What's Already Done

✅ Firebase Functions initialized  
✅ OpenAI SDK installed  
✅ Security implemented (auth, rate limiting, validation)  
✅ API key configured  
✅ Local testing passed  
✅ Documentation complete  

---

## Need Help?

See detailed documentation:
- `FIREBASE_FUNCTIONS_BILLING_SETUP.md` - Billing details
- `DEPLOYMENT_STATUS.md` - Full deployment status
- `PR13_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `PR13_BACKEND_SETUP.md` - Technical implementation details

---

## TL;DR

**What to do right now:**
1. Visit: https://console.firebase.google.com/project/collabcanvas-81fdb/usage/details
2. Upgrade to Blaze plan (free for your usage!)
3. Set billing alerts ($5, $10, $25)
4. Run: `firebase deploy --only functions:openaiChat`
5. Add function URL to Render environment variables
6. Test with curl command above

**Time needed:** ~10 minutes total  
**Cost:** $0/month (within free tier)  
**Risk:** Very low (billing alerts + rate limiting + free tier)

