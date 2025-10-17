# AI Canvas Agent - Product Requirements Document
**Implementation Approach**: OpenAI SDK with Function Calling (Direct Integration)

---

## Architecture Overview

```
User Input → AIContext (React)
    ↓
Build messages + tool schemas
    ↓
POST /openaiChat (Firebase Function)
    ↓
OpenAI Chat Completions API (with function calling)
    ↓
Returns assistant message with tool_calls[]
    ↓
AIContext executes tools via aiToolExecutor
    ↓
Executor calls CanvasContext/Firestore
    ↓
Real-time sync to all users (<100ms)
    ↓
Toast feedback + history entry
```

### Key Principles
- **Security First**: API key never exposed to client (server-side only)
- **Function Calling**: Use OpenAI's native function calling (no custom parsing)
- **Think-Act Loop**: Support multi-round conversations (up to 3 rounds)
- **Optimistic Execution**: Execute tools immediately, sync to Firestore
- **Shared State**: AI-created shapes sync to all users like manual edits

---

## Technical Stack

### Backend (Firebase Cloud Function)
- **Runtime**: Node.js 20
- **Package**: `openai` SDK (v4+)
- **Function**: `openaiChat` endpoint
- **Security**: 
  - Firebase ID token verification
  - CORS allowlist
  - Rate limiting (10 req/min per user)
  - Request size limits (10KB)

### Frontend
- **Controller**: `AIContext.jsx` (React Context)
- **UI Components**: 
  - `AIPanel.jsx` (right-side chat panel with conversation history)
  - `AIPrompt.jsx` (input + feedback within panel)
  - Agent button in Toolbar to toggle panel visibility
- **Service**: `openaiService.js` (fetch wrapper)
- **Schemas**: `aiTools.js` (tool definitions)
- **Executor**: `aiToolExecutor.js` (tool → Firestore bridge)
- **Prompt**: `aiPrompts.js` (system prompt builder)

### Utilities
- `colorNormalizer.js` - CSS color names → hex
- `shapeIdentification.js` - Descriptor → shape(s) matching
- `gridGenerator.js` - Grid layout calculations
- `arrangementAlgorithms.js` - Horizontal/vertical/distribute layouts

---

## UI/UX Specifications

### Agent Button (Toolbar)
- **Location**: Tools panel in Toolbar (bottom-right section)
- **Icon**: Robot/AI icon (e.g., 🤖 or sparkle ✨ icon)
- **Label**: "Agent" or "AI Assistant"
- **Behavior**: Toggle button that opens/closes AI panel
- **States**: 
  - Default: Gray/neutral color
  - Active (panel open): Accent color highlight
  - Loading (command executing): Pulsing animation

### AI Panel (Right Side)
- **Layout**: Slide-in panel from right edge
- **Width**: 400px (desktop), 100% (mobile)
- **Height**: Full viewport height minus header
- **Sections**:
  1. **Header**: "AI Assistant" title + close button
  2. **Conversation History**: Scrollable message list
     - User messages: Right-aligned, blue background
     - AI responses: Left-aligned, gray background
     - Timestamps for each message
  3. **Input Area**: Fixed at bottom
     - Text input with placeholder: "Ask AI to create or modify shapes..."
     - Submit button (Enter key or click)
     - Character counter (optional)
     - Loading state while processing

### Conversation Display
- **Message Types**:
  - User command: "Create a blue circle at 300, 400"
  - AI response: "I've created a blue circle at (300, 400)"
  - Tool execution feedback: "✓ Created shape" or "✗ Error: ..."
  - Error messages: Red background for failures
- **Auto-scroll**: Scroll to bottom on new messages
- **Clear History**: Button to clear conversation (confirm dialog)

### Panel Behavior
- **Open/Close**: Smooth slide animation (300ms)
- **Overlay**: Semi-transparent backdrop on mobile
- **Persistence**: Panel state saved to localStorage
- **Responsive**: 
  - Desktop: Panel slides over canvas (overlay mode)
  - Mobile: Full-screen panel with back button

### Keyboard Shortcuts
- **Open Panel**: `Cmd/Ctrl + K` (consistent with other tools)
- **Focus Input**: Automatically focus input when panel opens
- **Submit Command**: `Enter` (no modifier needed)
- **Close Panel**: `Escape` key

### Visual Design
- **Color Scheme**: Match existing CollabCanvas theme
  - Panel background: White (#FFFFFF) with subtle shadow
  - User messages: Blue background (#3498db) with white text
  - AI messages: Light gray background (#F5F5F5) with dark text
  - Input area: White with light border
  - Agent button: Gray default, blue accent when active
- **Typography**: 
  - Headers: 16px bold
  - Messages: 14px regular
  - Timestamps: 12px gray
- **Spacing**: 
  - Message padding: 12px
  - Message gap: 8px
  - Panel padding: 16px
- **Icons**: 
  - Agent button: Robot/sparkle icon
  - Close: X icon
  - Loading: Spinning circle
  - Success: ✓ checkmark
  - Error: ✗ cross

### Layout Mockup
```
┌─────────────────────────────────────────────────┐
│ Header                    [Toolbar with Agent]  │ ← Agent button here
├─────────────────────────────────┬───────────────┤
│                                 │ AI Assistant ×│ ← Panel header
│                                 ├───────────────┤
│                                 │ [Message 1]   │
│      Canvas Area                │ [Message 2]   │ ← Conversation
│                                 │ [Message 3]   │
│                                 │     ⋮         │
│                                 ├───────────────┤
│                                 │ [Text Input]  │ ← Input area
└─────────────────────────────────┴───────────────┘
  ← Canvas (full width)          ← Panel (400px)
```

---

## Command Requirements

### Creation Commands
| Command | Example | Tool |
|---------|---------|------|
| Create shape with color | "Create a red circle at 100, 200" | `createShape` |
| Create text | "Add a text layer that says 'Hello World'" | `createShape` |
| Create with dimensions | "Make a 200x300 blue rectangle" | `createShape` |

**Requirements**:
- Extract color from natural language (blue → #0000ff)
- Default positions if not specified (200, 200)
- Support circle, rectangle, triangle, text types
- Validate coordinates (allow negative for off-canvas)

### Manipulation Commands
| Command | Example | Tool |
|---------|---------|------|
| Move by descriptor | "Move the blue rectangle to 500, 300" | `moveShape` |
| Resize | "Resize the circle to radius 100" | `resizeShape` |
| Rotate | "Rotate the text 45 degrees" | `rotateShape` |
| Change color | "Change the red square to green" | `updateShapeColor` |
| Delete | "Delete the blue triangle" | `deleteShape` |

**Requirements**:
- Identify shapes by descriptor (color + type) without needing ID
- Support "all X" commands ("delete all circles")
- Handle ambiguity (prefer most recent if singular)
- Compound conditions ("all large red circles")

### Layout Commands
| Command | Example | Tool |
|---------|---------|------|
| Create grid | "Create a 3x3 grid of blue squares" | `createGrid` |
| Arrange horizontal | "Arrange these shapes in a row" | `arrangeHorizontally` |
| Arrange vertical | "Line up these shapes vertically" | `arrangeVertically` |
| Distribute evenly | "Space these elements evenly" | `distributeEvenly` |

**Requirements**:
- Grid: max 20×20, total ≤100 shapes
- Spacing: 10-500 pixels
- Batch Firestore writes for performance
- Deterministic, idempotent calculations

### Complex Commands
| Command | Example | Tool |
|---------|---------|------|
| Login form template | "Create a login form at 300, 200" | `createTemplate` |

**Requirements**:
- Generate 6+ properly arranged shapes
- Username label + input field
- Password label + input field  
- Submit button with text
- Smart spacing (25-40px vertical gaps)

---

## Tool Schemas (OpenAI Function Calling)

### 1. createShape
```javascript
{
  type: 'function',
  function: {
    name: 'createShape',
    description: 'Creates a new shape on the canvas. IMPORTANT: Always extract color from user command.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['circle', 'rectangle', 'text', 'triangle'],
          description: 'Shape type'
        },
        color: {
          type: 'string',
          description: 'REQUIRED: CSS color name or hex. Extract from user text.'
        },
        x: { type: 'number', description: 'X coordinate. Default: 200' },
        y: { type: 'number', description: 'Y coordinate. Default: 200' },
        width: { type: 'number', description: 'Width (rectangles/text). Default: 150', minimum: 1 },
        height: { type: 'number', description: 'Height (rectangles/text). Default: 100', minimum: 1 },
        radius: { type: 'number', description: 'Radius (circles/triangles). Default: 50', minimum: 1 },
        text: { type: 'string', description: 'Text content (text shapes only)' }
      },
      required: ['type', 'x', 'y', 'color']
    }
  }
}
```

### 2. getCanvasState
```javascript
{
  type: 'function',
  function: {
    name: 'getCanvasState',
    description: 'Retrieves current canvas state including all shapes and properties',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
}
```

### 3. moveShape
```javascript
{
  type: 'function',
  function: {
    name: 'moveShape',
    description: 'Moves a shape to new position. Identify by ID OR descriptor (color + type).',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Shape ID (optional if color/type provided)' },
        color: { type: 'string', description: 'Current color to identify shape' },
        type: { 
          type: 'string', 
          enum: ['circle', 'rectangle', 'text', 'triangle'],
          description: 'Shape type to identify'
        },
        x: { type: 'number', description: 'New X coordinate' },
        y: { type: 'number', description: 'New Y coordinate' }
      },
      required: ['x', 'y']
    }
  }
}
```

### 4. updateShapeColor
```javascript
{
  type: 'function',
  function: {
    name: 'updateShapeColor',
    description: 'Changes shape color. Identify by ID OR descriptor.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Shape ID (optional)' },
        color: { type: 'string', description: 'CURRENT color to find shape' },
        type: { 
          type: 'string', 
          enum: ['circle', 'rectangle', 'text', 'triangle'],
          description: 'Shape type to find'
        },
        newColor: { 
          type: 'string', 
          description: 'NEW target color. CSS name or hex.'
        }
      },
      required: ['newColor']
    }
  }
}
```

### 5. deleteShape
```javascript
{
  type: 'function',
  function: {
    name: 'deleteShape',
    description: 'Deletes a shape. Identify by ID OR descriptor.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Shape ID (optional)' },
        color: { type: 'string', description: 'Color to identify' },
        type: { 
          type: 'string', 
          enum: ['circle', 'rectangle', 'text', 'triangle'],
          description: 'Type to identify'
        }
      },
      required: []
    }
  }
}
```

### 6. rotateShape
```javascript
{
  type: 'function',
  function: {
    name: 'rotateShape',
    description: 'Rotates a shape by degrees. Identify by ID OR descriptor.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Shape ID (optional)' },
        color: { type: 'string', description: 'Color to identify' },
        type: { 
          type: 'string', 
          enum: ['circle', 'rectangle', 'text', 'triangle'],
          description: 'Type to identify'
        },
        rotation: { 
          type: 'number', 
          description: 'Rotation angle 0-359 degrees',
          minimum: 0,
          maximum: 359
        }
      },
      required: ['rotation']
    }
  }
}
```

### 7. createGrid
```javascript
{
  type: 'function',
  function: {
    name: 'createGrid',
    description: 'Creates a grid of identical shapes. Max 20×20, total ≤100.',
    parameters: {
      type: 'object',
      properties: {
        rows: { type: 'integer', description: 'Rows (1-20)', minimum: 1, maximum: 20 },
        cols: { type: 'integer', description: 'Columns (1-20)', minimum: 1, maximum: 20 },
        shapeType: { 
          type: 'string', 
          enum: ['circle', 'rectangle', 'text', 'triangle'],
          description: 'Shape type for grid'
        },
        color: { type: 'string', description: 'Color for all shapes' },
        originX: { type: 'number', description: 'Top-left X. Default: 200' },
        originY: { type: 'number', description: 'Top-left Y. Default: 200' },
        spacing: { 
          type: 'number', 
          description: 'Spacing between centers. Default: 120',
          minimum: 10,
          maximum: 500
        },
        size: { 
          type: 'number', 
          description: 'Shape size (radius or width/height). Default: 50',
          minimum: 10,
          maximum: 200
        }
      },
      required: ['rows', 'cols', 'shapeType', 'color']
    }
  }
}
```

### 8. arrangeHorizontally
```javascript
{
  type: 'function',
  function: {
    name: 'arrangeHorizontally',
    description: 'Arranges shapes in a horizontal row with equal spacing',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Shape IDs to arrange (2+ required)',
          minItems: 2
        },
        spacing: { 
          type: 'number', 
          description: 'Spacing between centers. Default: 20',
          minimum: 0,
          maximum: 500
        }
      },
      required: ['shapeIds']
    }
  }
}
```

### 9. arrangeVertically
```javascript
{
  type: 'function',
  function: {
    name: 'arrangeVertically',
    description: 'Arranges shapes in a vertical column with equal spacing',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Shape IDs to arrange (2+ required)',
          minItems: 2
        },
        spacing: { 
          type: 'number', 
          description: 'Spacing between centers. Default: 20',
          minimum: 0,
          maximum: 500
        }
      },
      required: ['shapeIds']
    }
  }
}
```

### 10. distributeEvenly
```javascript
{
  type: 'function',
  function: {
    name: 'distributeEvenly',
    description: 'Distributes shapes evenly along axis. First/last stay fixed.',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Shape IDs (3+ required for distribution)',
          minItems: 3
        },
        axis: { 
          type: 'string', 
          enum: ['x', 'y'],
          description: 'Axis to distribute along. x=horizontal, y=vertical'
        }
      },
      required: ['shapeIds', 'axis']
    }
  }
}
```

---

## System Prompt (Comprehensive)

```javascript
export const BASE_SYSTEM_PROMPT = `You are an AI assistant integrated into CollabCanvas, a collaborative whiteboard application. Your role is to help users create and manipulate shapes on the canvas using natural language commands.

**Your Capabilities:**
- Create shapes (circles, rectangles, triangles, text) at specific positions
- Create grids of shapes arranged in rows and columns
- Move shapes to new positions on the canvas
- Change the color of existing shapes
- Delete shapes from the canvas
- Rotate shapes to different angles
- Arrange shapes horizontally or vertically with custom spacing
- Distribute shapes evenly along an axis
- Query the current canvas state to see what shapes exist

**CRITICAL: Color Extraction**
When users specify a color in their command, YOU MUST extract and use that exact color.

Examples:
- "Create a blue rectangle at 400, 400" → color MUST be "blue", x=400, y=400
- "Make a red circle at 100, 200" → color MUST be "red", x=100, y=200
- "Add a green triangle" → color MUST be "green", use default position

**Shape Types:**
1. Circle: Requires x, y, radius, and color
2. Rectangle: Requires x, y, width, height, and color
3. Triangle: Requires x, y, radius (for size), and color
4. Text: Requires x, y, width, height, text content, and color

**Color Guidelines:**
- ALWAYS extract the color from the user's command if specified
- Accept color names (red, blue, green, orange, purple, yellow, etc.) or hex codes
- Common colors: red, blue, green, yellow, orange, purple, pink, brown, black, white, gray
- Default colors ONLY if no color specified: circle=#3498db, rectangle=#e74c3c, triangle=#9b59b6, text=#2c3e50

**Position Guidelines:**
- Canvas coordinates start at (0, 0) in the top-left
- Default position if not specified: x=200, y=200
- Typical canvas: 2000×2000 pixels
- Negative coordinates allowed (off-canvas positioning)
- Keep shapes in visible area (0-1000) for normal use

**Size Guidelines:**
- Default circle/triangle radius: 50
- Default rectangle: 150×100 (width × height)
- Default text: 200×50 (width × height)

**Grid Creation:**
- Specify rows (1-20) and columns (1-20)
- Choose shape type and color
- Optional: origin position (default 200, 200)
- Optional: spacing (default 120, range 10-500)
- Optional: size (default 50)
- LIMIT: rows × cols ≤ 100 total shapes

**Manipulation Workflow:**
OPTION 1: Direct Descriptor (RECOMMENDED for single shapes)
- "Move the blue rectangle to 500, 300" → moveShape({type: "rectangle", color: "blue", x: 500, y: 300})
- "Change the red circle to green" → updateShapeColor({type: "circle", color: "red", newColor: "green"})
- "Delete the triangle" → deleteShape({type: "triangle"})

OPTION 2: Get Canvas State First (for complex queries or "all X")
1. Call getCanvasState to see all shapes
2. Shapes are SORTED BY CREATION TIME (newest first)
3. Identify target shape(s)
4. Use shape IDs in manipulation tools

**"All X" Commands:**
When user says "all X", make MULTIPLE tool calls (one per target shape):
- "Delete all blue triangles" → Call deleteShape for each blue triangle
- "Delete all purple shapes" → Call deleteShape for ALL purple shapes (circles, rectangles, triangles, text)
- "Change all red shapes to blue" → Call updateShapeColor for each red shape

**Arrangement Workflow:**
1. Call getCanvasState to get shape IDs
2. Identify shapes to arrange based on criteria
3. Extract IDs into array
4. Call arrangeHorizontally/arrangeVertically/distributeEvenly with IDs

**Response Style:**
- Be concise and friendly
- Confirm actions: "I've created a blue circle at (100, 200)"
- If ambiguous, make reasonable assumptions
- Use the tools provided to execute commands
- ALWAYS respect the color specified by the user`;
```

---

## Firebase Cloud Function Implementation

### Function: `openaiChat`

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');

admin.initializeApp();

const openai = new OpenAI({
  apiKey: functions.config().openai.key
});

exports.openaiChat = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    try {
      // Verify Firebase ID token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const idToken = authHeader.split('Bearer ')[1];
      await admin.auth().verifyIdToken(idToken);

      // Extract request body
      const { messages, tools, tool_choice } = req.body;
      
      // Validate
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages' });
      }

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        tools: tools || undefined,
        tool_choice: tool_choice || undefined,
        temperature: 0.3,
        max_tokens: 1000
      });

      // Return first choice
      const message = completion.choices[0].message;
      
      res.json({
        message: {
          role: message.role,
          content: message.content,
          tool_calls: message.tool_calls || []
        }
      });

    } catch (error) {
      console.error('OpenAI Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
```

---

## Testing Strategy

### Unit Tests
- `colorNormalizer.test.js`: CSS names → hex, hex validation
- `shapeIdentification.test.js`: Descriptor matching, recency bias
- `gridGenerator.test.js`: Grid layouts, edge cases
- `arrangementAlgorithms.test.js`: Horizontal/vertical/distribute math
- `aiToolExecutor.test.js`: Each executor function with mocks

### Integration Tests
- End-to-end: prompt → function → executor → Firestore mock
- Tool calling: OpenAI response parsing and execution
- Multi-round: getCanvasState → manipulation flow
- Error handling: Invalid args, network failures

### Manual Test Suite (30 cases)

**Creation (6 cases)**
1. "Create a blue circle at 300, 400"
2. "Add a text that says 'Test'"
3. "Make a 200x150 red rectangle"
4. "Create a green triangle"
5. "Add a purple square at 100, 100"
6. "Create blue circle" (test defaults)

**Manipulation (8 cases)**
7. "Move the blue rectangle to 600, 200"
8. "Rotate the blue rectangle 45 degrees"
9. "Resize the circle to radius 80"
10. "Change the red square to green"
11. "Delete the blue triangle"
12. "Delete all circles"
13. "Change all red shapes to blue"
14. "Move all purple shapes to 500, 300"

**Layout (6 cases)**
15. "Create a 3x3 grid of red squares"
16. "Create a 2x5 grid of blue circles at 400, 300"
17. "Create grid with 150px spacing"
18. "Arrange these three shapes horizontally"
19. "Line up these shapes vertically with 50px spacing"
20. "Space these elements evenly"

**Complex (4 cases)**
21. "Create a login form at 300, 200"
22-24. Verify login form components positioned correctly

**Edge Cases (6 cases)**
25. "Move the rectangle" (multiple exist) → most recent
26. "Create a circle" (missing color) → use default
27. "Delete the flying saucer" → friendly error
28. "Delete all large red circles" → AND logic
29. "Create a 15x15 grid" → reject (>100 shapes)
30. Concurrent: Two users use AI simultaneously

**Accuracy Target**: 27+/30 passed (90%+)

---

## Performance & Reliability Requirements

### Response Time Targets
- Simple commands (create/move/color): <2s P95
- Complex commands (grid/template): <5s P95
- Multi-round (with getCanvasState): <4s P95

### Accuracy Targets
- Overall accuracy: ≥90% across test suite
- Color extraction: 100% (must always extract specified color)
- Position parsing: 95%+ (coordinates, descriptors)
- "All X" commands: 90%+ (proper fan-out)

### Reliability Targets
- Success rate: 95%+ (excluding network errors)
- Error handling: Graceful failures with user-friendly messages
- Concurrent users: Support 5+ users using AI simultaneously
- Shared state: AI operations sync <100ms like manual edits

### Rate Limits
- Per user: 10 commands/minute
- Per session: 50 commands/hour
- Request size: 10KB max
- Response timeout: 60 seconds

---

## Security & Safety

### API Key Protection
- Store in Firebase Functions config (never client-side)
- Environment variable in local development
- Secret manager in production

### Authentication & Authorization
- Verify Firebase ID token on every request
- Extract uid from token, validate against request
- Log user ID with every AI request

### Rate Limiting
- Firestore counter per user per minute
- Reset counter after 60 seconds
- Return 429 Too Many Requests if exceeded

### Input Validation
- Validate messages array structure
- Validate tools array if provided
- Limit message count (max 20)
- Limit message length (max 1000 chars each)

### Output Sanitization
- Validate tool arguments before execution
- Normalize colors before storing
- Clamp coordinates to safe ranges (-10000 to 10000)
- Validate shape IDs exist before operations

---

## Implementation Phases

### Phase 1: Infrastructure (PR 13)
- Set up Firebase Cloud Function `openaiChat`
- Configure OpenAI API key in Functions config
- Implement authentication, CORS, rate limiting
- Create `openaiService.js` frontend client
- Create `aiTools.js` with all 10 tool schemas
- Create `aiPrompts.js` with comprehensive system prompt
- **Build UI Components**:
  - Create `AIPanel.jsx` with slide-in animation
  - Create `AIPrompt.jsx` input component
  - Create `AIMessage.jsx` message display
  - Add "Agent" button to Toolbar
  - Implement keyboard shortcuts (Cmd/Ctrl+K)
  - Add localStorage persistence for panel state
  - Update ShortcutsModal with AI shortcuts
- Test basic "ping" with mock tools
- Test panel UI/UX (animations, responsiveness)

### Phase 2: Foundation Tools (PR 14)
- Implement `createShape` executor
- Implement `getCanvasState` executor
- Create `colorNormalizer.js` utility
- Create `AIContext.jsx` controller with think-act loop
- Create `AIPrompt.jsx` UI component
- Test creation commands end-to-end

### Phase 3: Manipulation Tools (PR 15)
- Implement `moveShape`, `updateShapeColor`, `deleteShape`, `rotateShape` executors
- Create `shapeIdentification.js` utility (descriptor matching)
- Implement "all X" fan-out logic in AIContext
- Test manipulation commands end-to-end

### Phase 4: Layout Tools (PR 16)
- Implement `createGrid` executor
- Implement `arrangeHorizontally`, `arrangeVertically`, `distributeEvenly` executors
- Create `gridGenerator.js` utility
- Create `arrangementAlgorithms.js` utility
- Test layout commands end-to-end

### Phase 5: Complex Templates (PR 17)
- Implement template generator for login form
- Optional: nav bar and card templates
- Performance testing with 5+ concurrent AI users
- Run full manual test suite (30 cases)
- Calculate accuracy rate, refine prompts if needed
- Update documentation with demo commands

---

## Files to Create

### Backend
- `functions/index.js` - openaiChat function with OpenAI SDK integration

### Frontend
- `src/context/AIContext.jsx` - Controller with think-act loop
- `src/components/ai/AIPanel.jsx` - Right-side chat panel component
- `src/components/ai/AIPrompt.jsx` - Input component within panel
- `src/components/ai/AIMessage.jsx` - Individual message component
- `src/components/ai/AIPanel.css` - Panel styling
- `src/services/openaiService.js` - Fetch wrapper to Cloud Function
- `src/services/aiTools.js` - 10 tool schemas
- `src/services/aiToolExecutor.js` - Tool execution bridge
- `src/utils/aiPrompts.js` - System prompt builder
- `src/utils/colorNormalizer.js` - CSS → hex conversion
- `src/utils/shapeIdentification.js` - Descriptor matching
- `src/utils/gridGenerator.js` - Grid layout calculations
- `src/utils/arrangementAlgorithms.js` - Alignment utilities

### Tests
- Unit tests for each utility
- Integration tests for full flow
- Manual test documentation

---

**Last Updated**: Current session  
**Approach**: OpenAI SDK with Function Calling (Direct Integration)
