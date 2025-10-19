# GPT-3.5-Turbo Testing Guide

## Changes Made

Updated Firebase Function to use `gpt-3.5-turbo` instead of `gpt-4o-mini` for all AI commands.

**File**: `functions/index.js` line 210
```javascript
model: "gpt-3.5-turbo", // TESTING: gpt-3.5-turbo for speed comparison
```

## Deployment

To test this change, you need to deploy the updated Firebase Function:

```bash
# Navigate to functions directory
cd collabcanvas-app/functions

# Deploy the function
firebase deploy --only functions:openaiChat

# Or deploy all functions
firebase deploy --only functions
```

**Note**: If using emulator for testing:
```bash
firebase emulators:start --only functions
```

## Expected Differences

### Speed Comparison

| Metric | gpt-4o-mini | gpt-3.5-turbo | Expected Change |
|--------|-------------|---------------|-----------------|
| **Latency** | ~1,500ms | ~800-1,200ms | 20-47% faster ✅ |
| **Cost** | $0.15/1M in | $0.50/1M in | 3.3x more expensive ⚠️ |
| **Quality** | Excellent | Good | Slightly lower ⚠️ |

### What to Test

#### ✅ Simple Commands (Should Work Great)
```
"Create a red circle"
"Create a blue rectangle at 300, 200"
"Move the red circle to 500, 400"
"Rotate the square 45 degrees"
"Create a 3x3 grid of blue squares"
```

#### ⚠️ Complex Commands (Watch for Quality)
```
"Create a login form at 300, 200"
"Make a navigation bar with Home, About, Services, Contact"
"Create a dashboard with 3 panels"
```

#### 🎨 Creative Commands (May Struggle)
```
"Make a dinosaur"
"Create a house"
"Draw a car"
```

### Quality Metrics to Track

1. **Tool Call Accuracy**
   - Does it call the right tools?
   - Are parameters correct?
   - Does it follow the system prompt?

2. **Complex Command Decomposition**
   - Login forms: Does it create all elements?
   - Nav bars: Proper spacing and alignment?
   - Grids: Correct row/column math?

3. **Creative Request Handling**
   - Does it decompose into simple shapes?
   - Or does it explain "this is complex" without calling tools?

4. **Edge Cases**
   - Ambiguous commands ("the square" when multiple exist)
   - Missing parameters (defaults applied?)
   - Color name parsing

## Testing Checklist

### Basic Functionality
- [ ] Simple shape creation works
- [ ] Move commands work
- [ ] Rotate commands work
- [ ] Grid creation works (3x3, 5x5)

### Complex Features
- [ ] Login form creates 5+ elements
- [ ] Nav bar creates properly spaced items
- [ ] Creative requests produce shapes (not just explanations)

### Performance
- [ ] Check browser console latency logs
- [ ] Compare before/after times
- [ ] Note any timeouts or errors

### Quality Issues
- [ ] Any tool call errors?
- [ ] Any parameter parsing failures?
- [ ] Any "I don't understand" responses?

## Logging

With the latency logging already added, you'll see:

```
🚀 [AI] Starting request at ...
⏱️ [AI] Sending to OpenAI ...
🌐 [OpenAI Service] Received response (Xms network time)  ← WATCH THIS
✅ [AI] OpenAI responded (Xms API time)  ← AND THIS
🏁 [AI] Request completed in Xms total  ← COMPARE THIS
```

**Key metric**: Compare the "network time" and "total time" against gpt-4o-mini baseline.

## Baseline Comparison

### Current Performance (gpt-4o-mini)
- Simple commands: ~1,200-1,500ms
- Complex commands: ~1,500-2,000ms
- Grid creation: ~1,300-1,600ms

### Target Performance (gpt-3.5-turbo)
- Simple commands: ~700-1,000ms (30-50% faster) ✅
- Complex commands: ~1,000-1,500ms (25-40% faster) ✅
- Grid creation: ~900-1,200ms (30-40% faster) ✅

## Known Limitations of gpt-3.5-turbo

1. **Function Calling**: Less reliable than GPT-4 models
   - May miss required parameters
   - May not follow system prompt as strictly
   - May call wrong tools for ambiguous commands

2. **Complex Reasoning**: Weaker decomposition
   - "Login form" might miss elements
   - Creative requests might be less creative
   - May ask for clarification more often (violating CRITICAL RULE #1)

3. **Context Understanding**: Shorter effective context
   - May forget earlier conversation points
   - Less good at "the shape" references

## Reverting Back

If gpt-3.5-turbo doesn't perform well, revert with:

```javascript
// functions/index.js line 210
model: "gpt-4o-mini", // Fast model for tool calls
```

Then redeploy:
```bash
firebase deploy --only functions:openaiChat
```

## Decision Criteria

**Keep gpt-3.5-turbo if**:
- ✅ Speed improvement is significant (>30%)
- ✅ Simple commands work perfectly (>95% accuracy)
- ✅ Complex commands work acceptably (>80% accuracy)
- ✅ No critical bugs or failures

**Revert to gpt-4o-mini if**:
- ❌ Speed improvement is minimal (<20%)
- ❌ Simple commands fail frequently (>5% error rate)
- ❌ Complex commands break (>30% error rate)
- ❌ Creative requests don't work at all

## Cost Analysis

**Typical usage** (100 commands/day):
- gpt-4o-mini: ~2,680 tokens/request × 100 = 268K tokens/day = **$0.04/day**
- gpt-3.5-turbo: Same tokens = **$0.13/day**
- **Cost increase**: $0.09/day = **$2.70/month**

If speed improvement is 30%+ and quality is acceptable, the $2.70/month is worth it.

## Next Steps

1. Deploy the function
2. Test all command types
3. Log results in this file
4. Make decision: keep or revert
5. If keeping, consider hybrid approach (fast model for simple, current for complex)

