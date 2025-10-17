# Firebase Functions - Billing Setup Required

## Issue

Firebase Cloud Functions requires the **Blaze (pay-as-you-go)** plan. Your project is currently on the free **Spark** plan.

**Error Message:**
```
Your project collabcanvas-81fdb must be on the Blaze (pay-as-you-go) plan to complete this command.
```

---

## What is the Blaze Plan?

The Blaze plan is Firebase's pay-as-you-go pricing tier that allows you to use advanced features like Cloud Functions.

**Important: It includes a generous free tier!**

### Free Tier Limits (Monthly)

**Cloud Functions (2nd Generation):**
- 2 million invocations
- 400,000 GB-seconds compute time
- 200,000 CPU-seconds
- 5 GB network egress

**This is typically enough for:**
- Small to medium projects
- Development and testing
- Low to moderate production traffic
- Your CollabCanvas MVP should easily fit within these limits

### Pay-as-you-go Pricing (After Free Tier)

**Cloud Functions:**
- Invocations: $0.40 per million
- Compute time: $0.0000025 per GB-second
- Memory: 256 MB (what we're using)

**Estimated Costs for CollabCanvas:**

With 100 active users per day:
- AI commands: ~1,000 invocations/day = 30K/month
- Cost: FREE (well within 2M free tier)

With 1,000 active users per day:
- AI commands: ~10,000 invocations/day = 300K/month
- Cost: FREE (still within free tier)

**You'd need ~65,000 invocations/day to exceed the free tier!**

---

## How to Enable Blaze Plan

### Option 1: Via Firebase Console (Recommended)

1. Go to: https://console.firebase.google.com/project/collabcanvas-81fdb/usage/details

2. Click **"Modify plan"** or **"Upgrade to Blaze"**

3. **Important**: Set up billing alerts!
   - Click "Set up billing alerts"
   - Set alert at $5, $10, $25 (recommended)
   - This will email you if costs approach these thresholds

4. Add a credit card (required, but you won't be charged unless you exceed free tier)

5. Complete the upgrade

6. Return to terminal and retry deployment:
   ```bash
   firebase deploy --only functions:openaiChat
   ```

### Option 2: Via Google Cloud Console

1. Go to: https://console.cloud.google.com/billing

2. Link the `collabcanvas-81fdb` project to a billing account

3. Set up budget alerts (recommended: $5, $10, $25)

4. Return to Firebase Console to confirm Blaze plan is active

---

## Cost Protection Strategies

### 1. Set Budget Alerts
- $5 alert: Early warning
- $10 alert: Investigation needed
- $25 alert: Critical review

### 2. Rate Limiting (Already Implemented ✅)
- 10 requests per minute per user
- Prevents abuse and runaway costs

### 3. Function Limits (Already Configured ✅)
- Max instances: 10
- Timeout: 60 seconds
- Memory: 256 MB (minimum needed)

### 4. Model Selection (Already Configured ✅)
- Development: gpt-4o-mini (cheaper)
- Production: gpt-4 (higher quality)

### 5. Monitor Usage
- Check Firebase Console > Functions > Usage tab
- Check OpenAI Dashboard: https://platform.openai.com/usage
- Review Google Cloud billing monthly

---

## Expected Monthly Costs

### Scenario 1: Development Phase
- You + 5 testers
- ~100 AI commands/day
- **Cost: $0** (free tier)

### Scenario 2: Small Production
- 50 users/day
- ~500 AI commands/day
- **Cost: $0** (free tier)

### Scenario 3: Medium Production
- 500 users/day
- ~5,000 AI commands/day
- **Firebase Functions: $0** (within free tier)
- **OpenAI API: ~$3-5/month** (gpt-4o-mini)
- **Total: ~$3-5/month**

### Scenario 4: High Traffic
- 5,000 users/day
- ~50,000 AI commands/day
- **Firebase Functions: ~$20/month** (exceeds free tier)
- **OpenAI API: ~$30-50/month** (gpt-4o-mini)
- **Total: ~$50-70/month**

**Note:** OpenAI costs are separate from Firebase and must be monitored independently.

---

## What Happens After Upgrade?

1. **Immediate Effects:**
   - Cloud Functions deployment will work
   - All other Firebase services remain free tier
   - No charges unless you exceed free limits

2. **No Surprise Charges:**
   - Free tier is very generous
   - Billing alerts will warn you
   - Rate limiting prevents abuse
   - You can set hard spending limits in Google Cloud

3. **Monitoring:**
   - Firebase Console shows function invocations
   - Google Cloud shows detailed billing
   - OpenAI Dashboard shows API usage

---

## Alternative: Keep Functions Local (Not Recommended)

If you want to avoid Blaze plan for now:

### Option A: Use Emulator Only
- Functions work in emulator (already tested ✅)
- Cannot deploy to production
- Cannot be accessed by deployed frontend
- Only good for local development

### Option B: Deploy Frontend Without AI
- Deploy everything except AI features
- Keep AI features for local development
- Users won't have AI canvas manipulation

**Recommendation:** Upgrade to Blaze plan. The free tier is generous enough for your MVP, and you can set strict billing alerts to avoid surprises.

---

## After Upgrading to Blaze

### Deploy the Function

```bash
cd collabcanvas-app
firebase deploy --only functions:openaiChat
```

You should see:
```
✔  functions[openaiChat(us-central1)] Successful update operation.
Function URL: https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat
```

### Update Frontend Environment

Add to your production environment variables (in Render dashboard):

```
VITE_OPENAI_ENDPOINT=https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat
```

### Test Production Function

```bash
# Get a fresh ID token from your deployed app
# Then test:

curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PRODUCTION_TOKEN" \
  -d '{"messages":[{"role":"user","content":"Say hello in 3 words"}]}'
```

Expected response:
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

## Summary

**Action Required:**
1. ✅ Upgrade to Blaze plan (free tier is sufficient for MVP)
2. ✅ Set billing alerts ($5, $10, $25)
3. ✅ Deploy function: `firebase deploy --only functions:openaiChat`
4. ✅ Update frontend environment variable
5. ✅ Test production deployment

**Cost Estimate:**
- **Development/Testing:** $0/month (within free tier)
- **Small Production:** $0-5/month (mostly OpenAI costs)
- **Medium Production:** $5-20/month
- **Protection:** Rate limiting + billing alerts + function limits

**Already Implemented Cost Protection:**
- ✅ Rate limiting (10 req/min/user)
- ✅ Max instances (10)
- ✅ Timeout limits (60s)
- ✅ Request validation
- ✅ Model selection (cheaper in dev)

---

**Next Steps:** Visit https://console.firebase.google.com/project/collabcanvas-81fdb/usage/details to upgrade to Blaze plan.

