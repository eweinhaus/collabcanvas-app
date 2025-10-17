# AI Response Latency Optimization Guide

## Current Performance Baseline
- **Target**: <2s P95
- **Current Production**: ~4-10s (using GPT-4)
- **Current Dev**: ~1-2s (using GPT-4o-mini)

## Optimization Strategies (Ranked by Impact)

### 🔥 HIGH IMPACT (Immediate Wins)

#### 1. Switch to Faster Model
**Current**: GPT-4 in production
**Recommendation**: GPT-4o or GPT-4o-mini

```javascript
// functions/index.js - Line 209
model: "gpt-4o-mini", // Was: gpt-4
```

**Impact**: 
- GPT-4: 4-10s response time
- GPT-4o: 2-4s response time
- GPT-4o-mini: 0.5-2s response time

**Trade-offs**:
- GPT-4o-mini: 60% cheaper, 3-5x faster, slightly less capable
- GPT-4o: 2x cheaper than GPT-4, 2-3x faster, similar quality

**Recommendation**: Start with `gpt-4o-mini` for tool calls (simple, structured) and `gpt-4o` only if quality issues arise.

#### 2. Implement Response Streaming
**Current**: Wait for entire response
**Recommendation**: Stream tokens as they arrive

```javascript
// functions/index.js
const stream = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: messages,
  tools: tools || undefined,
  tool_choice: tool_choice || undefined,
  stream: true, // Enable streaming
  temperature: 0.3,
  max_tokens: 1000,
});

// Stream back to client
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
}
```

**Impact**: User sees response starting in ~500ms instead of waiting 2-4s

**Trade-off**: More complex implementation (SSE or WebSockets)

#### 3. Reduce Message History
**Current**: Up to 20 messages (can be large)
**Recommendation**: Reduce to 8-10 messages

```javascript
// AIContext.jsx - Line ~220
const recentMessages = messages
  .filter(m => m.role === 'user' || m.role === 'assistant')
  .slice(-8); // Was: -12
```

**Impact**: Reduces tokens processed by 30-40%, saves ~200-500ms

#### 4. Keep Functions Warm
**Current**: Cold starts every ~15 minutes
**Recommendation**: Implement keep-alive ping

```javascript
// Add to Cloud Function
const MIN_INSTANCES = process.env.NODE_ENV === "production" ? 1 : 0;

exports.openaiChat = onRequest({
  timeoutSeconds: 60,
  memory: "256MiB",
  minInstances: MIN_INSTANCES, // Keep 1 instance warm
  maxInstances: 10,
  cors: true,
}, async (req, res) => { ... });
```

**Impact**: Eliminates 1-3s cold start delay
**Trade-off**: Costs ~$5-10/month for always-on instance

---

### 💪 MEDIUM IMPACT (Worth Implementing)

#### 5. Optimize Tool Definitions
**Current**: Full verbose tool schemas
**Recommendation**: Minimize descriptions, use shorter names

```javascript
// aiTools.js - Example optimization
{
  name: "create", // Was: "createShape"
  description: "Create shape", // Was: long description
  parameters: {
    type: "object",
    properties: {
      t: { type: "string", enum: ["rect", "circle", "text", "tri"] }, // Shorter
      x: { type: "number" },
      y: { type: "number" },
      c: { type: "string" }, // color
    },
    required: ["t"],
  }
}
```

**Impact**: Reduces request size by 20-30%, saves ~100-200ms
**Trade-off**: Less readable code, need mapping layer

#### 6. Implement Request Debouncing
**Current**: Every keystroke could trigger a request (if enabled)
**Recommendation**: Debounce user input

```javascript
// AIContext.jsx
const debouncedSend = useMemo(
  () => debounce(sendMessage, 500),
  [sendMessage]
);
```

**Impact**: Reduces unnecessary API calls
**Trade-off**: 500ms delay before request starts

#### 7. Use Shorter Temperature & Tokens
**Current**: temperature 0.3, max_tokens 1000
**Recommendation**: Lower for structured outputs

```javascript
// functions/index.js
temperature: 0.1, // Was: 0.3 (more deterministic, faster)
max_tokens: 500,  // Was: 1000 (sufficient for tool calls)
```

**Impact**: ~10-20% faster response
**Trade-off**: Less creative responses (not an issue for tool calls)

---

### 🎯 LOW IMPACT (Nice to Have)

#### 8. Add Response Caching
**Current**: Every request hits OpenAI
**Recommendation**: Cache common queries

```javascript
// Simple in-memory cache
const responseCache = new Map();

function getCacheKey(messages) {
  return JSON.stringify(messages.slice(-3)); // Last 3 messages
}

// Before calling OpenAI
const cacheKey = getCacheKey(messages);
if (responseCache.has(cacheKey)) {
  return responseCache.get(cacheKey);
}

// After getting response
responseCache.set(cacheKey, response);
```

**Impact**: Instant response for repeated queries (~50ms)
**Trade-off**: Memory usage, cache invalidation complexity

#### 9. Parallel Tool Execution
**Current**: Sequential tool execution
**Recommendation**: Execute multiple tools in parallel

```javascript
// AIContext.jsx - executeToolCalls
const results = await Promise.all(
  toolCalls.map(toolCall => executor.executeCreateShape(args))
);
```

**Impact**: If multiple tools called, saves ~100-200ms per additional tool
**Trade-off**: None (easy win)

#### 10. Optimize Cloud Function Region
**Current**: us-central1
**Recommendation**: Use region closest to most users

```javascript
// firebase.json or deployment config
// Deploy to multiple regions for geo-distribution
// Example: us-east1 (faster for East Coast users)
```

**Impact**: Reduces network latency by ~50-100ms depending on user location
**Trade-off**: Slightly more complex deployment

---

## Recommended Implementation Plan

### Phase 1: Quick Wins (Target: <2s, ~1 hour)
1. ✅ Switch to `gpt-4o-mini` in production
2. ✅ Reduce message history to 8 messages
3. ✅ Lower max_tokens to 500
4. ✅ Set temperature to 0.1

**Expected Result**: ~1-2s P95 latency

### Phase 2: Streaming (Target: Perceived <1s, ~4 hours)
1. Implement server-sent events (SSE) for streaming
2. Show "typing" indicator immediately
3. Stream tool execution results

**Expected Result**: User sees response starting in <500ms

### Phase 3: Optimization (Target: <1.5s, ~2 hours)
1. Minimize tool definitions
2. Keep 1 function instance warm
3. Parallel tool execution

**Expected Result**: Consistent <1.5s responses

### Phase 4: Advanced (Optional, ~8 hours)
1. Response caching layer
2. Multi-region deployment
3. WebSocket connection for real-time

---

## Monitoring & Measurement

### Add Performance Tracking
```javascript
// AIContext.jsx
const sendMessage = async (content) => {
  const startTime = performance.now();
  
  try {
    // ... existing code
  } finally {
    const latency = performance.now() - startTime;
    console.log(`AI Response Latency: ${latency}ms`);
    
    // Optional: Send to analytics
    // analytics.logEvent('ai_latency', { latency });
  }
};
```

### Key Metrics to Track
- **Time to First Token** (TTFT): When user first sees response
- **Time to Complete**: Total time for full response
- **Tool Execution Time**: How long tools take
- **P50, P95, P99**: Percentile distribution

---

## Cost Comparison

| Model | Speed | Cost/1K tokens | Quality |
|-------|-------|----------------|---------|
| GPT-4 | Slow (4-10s) | $0.03 | Best |
| GPT-4o | Fast (2-4s) | $0.015 | Great |
| GPT-4o-mini | Fastest (0.5-2s) | $0.0004 | Good |

**For 1000 AI requests:**
- GPT-4: $30-60 (slow)
- GPT-4o: $15-30 (balanced)
- GPT-4o-mini: $0.40-0.80 (fast & cheap)

**Recommendation**: Use GPT-4o-mini for production. It's 60x cheaper and 3-5x faster.

---

## Testing Strategy

### Load Testing
```bash
# Test 100 concurrent requests
npm run test:load -- --concurrent 100 --duration 60s
```

### Latency Benchmarking
```javascript
// Create benchmark test
async function benchmarkAI() {
  const trials = 100;
  const latencies = [];
  
  for (let i = 0; i < trials; i++) {
    const start = Date.now();
    await postChat([{role: 'user', content: 'Create a red circle'}]);
    latencies.push(Date.now() - start);
  }
  
  latencies.sort((a, b) => a - b);
  console.log('P50:', latencies[50]);
  console.log('P95:', latencies[95]);
  console.log('P99:', latencies[99]);
}
```

---

## Quick Implementation (Phase 1)

Here's the exact changes for immediate ~50-70% latency improvement:

