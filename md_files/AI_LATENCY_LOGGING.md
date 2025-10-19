# AI Latency Logging Guide

## Overview
Added comprehensive logging to track AI request latency at each stage of the pipeline.

## Log Output Example

When you send an AI command, you'll see logs like this in the browser console:

```
🚀 [AI] Starting request at 2025-10-19T10:30:45.123Z
⏱️ [AI] Sending to OpenAI (15ms since start)
📦 [AI] Message count: 6 messages
🔐 [OpenAI Service] Got auth token (45ms)
🌐 [OpenAI Service] Sending 2847 bytes to Cloud Function
🌐 [OpenAI Service] Received response (1523ms network time)
📄 [OpenAI Service] Parsed response (3ms)
✅ [AI] OpenAI responded (1568ms API time)
🔧 [AI] Executing 1 tool(s): createShape
✅ [AI] Tools executed (89ms execution time)
🏁 [AI] Request completed in 1672ms total
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Latency Breakdown

### 1. Request Preparation (0-50ms)
- **What**: Preparing messages, filtering history
- **Location**: AIContext.jsx
- **Log**: `Starting request at`

### 2. Auth Token (~10-50ms)
- **What**: Getting Firebase ID token
- **Location**: openaiService.js
- **Log**: `🔐 Got auth token`

### 3. Network Request (~500-2000ms) - LARGEST COMPONENT
- **What**: Round-trip to Cloud Function + OpenAI API
- **Location**: openaiService.js
- **Log**: `🌐 Received response (Xms network time)`
- **Includes**:
  - Upload to Firebase Function (~50-200ms)
  - Firebase Function processing (~50-100ms)
  - OpenAI API processing (~400-1500ms)
  - Download response (~50-100ms)

### 4. Response Parsing (~1-10ms)
- **What**: JSON.parse() of response
- **Location**: openaiService.js
- **Log**: `📄 Parsed response`

### 5. Tool Execution (~50-300ms)
- **What**: Creating shapes, updating Firestore
- **Location**: AIContext.jsx
- **Log**: `🔧 Executing X tool(s)` → `✅ Tools executed`

### 6. Total Time
- **What**: End-to-end latency
- **Log**: `🏁 Request completed in Xms total`

## Optimization Impact Tracking

With message history reduced from 8 to 4:

**Expected improvements**:
- Request body size: ~30-40% smaller
- OpenAI API time: ~100-200ms faster
- Total latency: ~10-15% improvement

**Test commands**:
```
"Create a red circle"           (simple - baseline)
"Create a 3x3 grid of squares"  (grid - batch operations)
"Create a login form"           (complex - multiple shapes)
```

## Interpreting Results

### Good Performance
- Total: <1500ms for simple commands
- Network time: <1000ms
- Tool execution: <100ms

### Needs Investigation
- Total: >2500ms
- Network time: >2000ms (check OpenAI status)
- Tool execution: >500ms (check Firestore)

### Bottleneck Identification

If **Network time** is dominant (>80% of total):
- OpenAI API is the bottleneck
- Consider: streaming, smaller prompts, faster model

If **Tool execution** is dominant (>30% of total):
- Firestore writes are slow
- Consider: batch writes, connection issues

## Testing Commands

```bash
# Open browser console (F12)
# Send AI commands and observe logs

# Simple command (baseline)
"Create a blue circle at 200, 200"

# Medium complexity
"Move the blue circle to 500, 300"

# High complexity
"Create a login form with username and password"
```

## Changes Made

### Files Modified
1. `src/context/AIContext.jsx`
   - Added timing markers at request start/end
   - Tracks OpenAI API time
   - Tracks tool execution time
   - Shows message count

2. `src/services/openaiService.js`
   - Added auth token timing
   - Added network request timing
   - Added response parsing timing
   - Shows request body size

### Message History Optimization
- Reduced from 8 to 4 messages (line 245 in AIContext.jsx)
- Expected impact: 100-200ms improvement

