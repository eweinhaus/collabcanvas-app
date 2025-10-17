# Deploy AI Latency Optimizations

## Quick Deploy (5 minutes)

### Step 1: Deploy Cloud Function
```bash
cd functions
firebase deploy --only functions:openaiChat
```

**Wait 2-3 minutes** for deployment to complete.

### Step 2: Verify Deployment
Check the Firebase console or logs:
```bash
firebase functions:log --only openaiChat --limit 3
```

Look for: `model: "gpt-4o-mini"` in the logs

### Step 3: Test Performance
In browser console:
```javascript
benchmarkAI(10)
```

**Expected results:**
- Average: ~1500ms (was: 3800ms)
- P95: ~1800ms (was: 5294ms)
- ✅ **60% improvement**

---

## What's Being Deployed

### Changes in functions/index.js:
1. ✅ Model: GPT-4 → **gpt-4o-mini** (3-5x faster)
2. ✅ Temperature: 0.3 → **0.1** (more deterministic)
3. ✅ Max tokens: 1000 → **500** (faster generation)
4. ✅ **minInstances: 1** (no cold starts)

### Changes in AIContext.jsx:
1. ✅ Message history: 12 → **8** (fewer tokens)
2. ✅ **Parallel tool execution** (faster multi-shape)

---

## Troubleshooting

### If deployment fails:
```bash
# Check you're logged in
firebase login

# Check project
firebase use

# Try again
firebase deploy --only functions:openaiChat
```

### If still slow after deployment:
1. Hard refresh browser (Cmd+Shift+R)
2. Clear browser cache
3. Check internet speed: https://fast.com
4. Check Firebase console for errors

---

## Still Need More Speed?

If you're still above 2s P95 after deployment, next steps:

### Option A: Streaming (Perceived Instant)
- User sees response in 300-500ms
- Total time same, but feels instant
- 4 hours to implement

### Option B: Response Caching
- Common commands: 3000ms → 50ms
- Redis-based caching
- 2 hours to implement

### Option C: Pattern Matching (Skip AI)
- Simple commands execute directly
- "Create red circle" → 50ms (no AI call)
- 1 hour to implement

Let me know what you want to tackle next!

