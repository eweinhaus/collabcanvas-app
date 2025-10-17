# AI Canvas Agent - Product Requirements Document
**Implementation Approach**: OpenAI SDK with Function Calling (Direct Integration)  
**Scope**: Focused implementation with 7 core commands (1, 2, 3, 4, 6, 8, 10)

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

### ✅ Creation Commands (All 3 Implemented)
| Command | Example | Tool | Status |
|---------|---------|------|--------|
| Create shape with color | "Create a red circle at 100, 200" | `createShape` | ✅ **IN SCOPE** |
| Create text | "Add a text layer that says 'Hello World'" | `createShape` | ✅ **IN SCOPE** |
| Create with dimensions | "Make a 200x300 blue rectangle" | `createShape` | ✅ **IN SCOPE** |

**Requirements**:
- Extract color from natural language (blue → #0000ff)
- Default positions if not specified (200, 200)
- Support circle, rectangle, triangle, text types
- Validate coordinates (allow negative for off-canvas)

### ⚠️ Manipulation Commands (2 of 5 Implemented)
| Command | Example | Tool | Status |
|---------|---------|------|--------|
| Move by descriptor | "Move the blue rectangle to 500, 300" | `moveShape` | ✅ **IN SCOPE** |
| Resize | "Resize the circle to radius 100" | `resizeShape` | ❌ **NOT IMPLEMENTED** |
| Rotate | "Rotate the text 45 degrees" | `rotateShape` | ✅ **IN SCOPE** |
| Change color | "Change the red square to green" | `updateShapeColor` | ❌ **NOT IMPLEMENTED** |
| Delete | "Delete the blue triangle" | `deleteShape` | ❌ **NOT IMPLEMENTED** |

**Requirements** (for implemented commands only):
- Identify shapes by descriptor (color + type) without needing ID
- Handle ambiguity (prefer most recent if singular)
- ~~Support "all X" commands~~ (not in current scope)
- ~~Compound conditions~~ (not in current scope)

### ⚠️ Layout Commands (1 of 4 Implemented)
| Command | Example | Tool | Status |
|---------|---------|------|--------|
| Create grid | "Create a 3x3 grid of blue squares" | `createGrid` | ✅ **IN SCOPE** |
| Arrange horizontal | "Arrange these shapes in a row" | `arrangeHorizontally` | ❌ **NOT IMPLEMENTED** |
| Arrange vertical | "Line up these shapes vertically" | `arrangeVertically` | ❌ **NOT IMPLEMENTED** |
| Distribute evenly | "Space these elements evenly" | `distributeEvenly` | ❌ **NOT IMPLEMENTED** |

**Requirements** (for implemented commands only):
- Grid: max 20×20, total ≤100 shapes
- Spacing: 10-500 pixels (default 120)
- Batch Firestore writes for performance
- Deterministic, idempotent calculations

### ✅ Complex Commands (Flexible LLM-Driven Approach)
| Command Type | Example | Tool | Status |
|---------|---------|------|--------|
| Forms & Vertical Layouts | "Create a login form at 300, 200" | `createShapesVertically` | ✅ **IN SCOPE** |
| Navigation & Horizontal | "Build a navigation bar with 4 menu items" | `createShapesHorizontally` | ✅ **IN SCOPE** |
| Any Complex Layout | "Make a dashboard card", "Create a pricing table" | Multiple tools + LLM reasoning | ✅ **IN SCOPE** |

**Approach**:
- No hardcoded templates - LLM decomposes commands into tool calls
- Two layout helpers enable 80% of complex layouts
- GPT-4 handles spatial reasoning and multi-step planning
- Works for ANY complex command, not just pre-defined ones

**Requirements**:
- LLM can make multiple tool calls per command
- Layout helpers support flexible shape arrays
- System prompt includes examples and best practices
- Smart spacing and positioning (25-40px gaps for forms)

---

## Tool Schemas (OpenAI Function Calling)

**Implemented Tools**: 7 core tools (no hardcoded templates)
- ✅ `createShape` (commands 1, 2, 3)
- ✅ `getCanvasState` (commands 4, 6)
- ✅ `moveShape` (command 4)
- ✅ `rotateShape` (command 6)
- ✅ `createGrid` (command 8)
- ✅ `createShapesVertically` (complex commands - forms, lists)
- ✅ `createShapesHorizontally` (complex commands - nav bars, button groups)
- ❌ `updateShapeColor` (not in scope)
- ❌ `deleteShape` (not in scope)
- ❌ `distributeEvenly` (not in scope)

---

### 1. createShape ✅ **IMPLEMENTED**
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

### 2. getCanvasState ✅ **IMPLEMENTED**
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

### 3. moveShape ✅ **IMPLEMENTED**
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

### 4. updateShapeColor ❌ **NOT IMPLEMENTED** (optional for future)
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

### 5. deleteShape ❌ **NOT IMPLEMENTED** (optional for future)
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

### 6. rotateShape ✅ **IMPLEMENTED**
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

### 7. createGrid ✅ **IMPLEMENTED**
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

### 8. createShapesVertically ✅ **IMPLEMENTED**
```javascript
{
  type: 'function',
  function: {
    name: 'createShapesVertically',
    description: 'Create multiple shapes stacked vertically with consistent spacing. Use for forms, lists, vertical layouts.',
    parameters: {
      type: 'object',
      properties: {
        shapes: {
          type: 'array',
          description: 'Array of shape specifications to create',
          items: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['circle', 'rectangle', 'text', 'triangle'],
                description: 'Shape type'
              },
              color: { type: 'string', description: 'CSS color name or hex' },
              text: { type: 'string', description: 'Text content (for text shapes)' },
              width: { type: 'number', description: 'Width (rectangles/text)' },
              height: { type: 'number', description: 'Height (rectangles/text)' },
              radius: { type: 'number', description: 'Radius (circles/triangles)' },
              stroke: { type: 'string', description: 'Border color (optional)' },
              strokeWidth: { type: 'number', description: 'Border width (optional)' }
            },
            required: ['type', 'color']
          },
          minItems: 2
        },
        originX: { 
          type: 'number', 
          description: 'Starting X position for the stack' 
        },
        originY: { 
          type: 'number', 
          description: 'Starting Y position for the stack' 
        },
        spacing: { 
          type: 'number', 
          description: 'Vertical spacing between shape centers. Default: 25',
          default: 25,
          minimum: 5,
          maximum: 200
        }
      },
      required: ['shapes', 'originX', 'originY']
    }
  }
}
```

### 9. createShapesHorizontally ✅ **IMPLEMENTED**
```javascript
{
  type: 'function',
  function: {
    name: 'createShapesHorizontally',
    description: 'Create multiple shapes arranged horizontally. Use for navigation bars, button groups, horizontal layouts.',
    parameters: {
      type: 'object',
      properties: {
        shapes: {
          type: 'array',
          description: 'Array of shape specifications to create',
          items: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['circle', 'rectangle', 'text', 'triangle'] 
              },
              color: { type: 'string' },
              text: { type: 'string' },
              width: { type: 'number' },
              height: { type: 'number' },
              radius: { type: 'number' },
              stroke: { type: 'string' },
              strokeWidth: { type: 'number' }
            },
            required: ['type', 'color']
          },
          minItems: 2
        },
        originX: { 
          type: 'number', 
          description: 'Starting X position' 
        },
        originY: { 
          type: 'number', 
          description: 'Y position (same for all shapes)' 
        },
        spacing: { 
          type: 'number', 
          description: 'Horizontal spacing between shape centers. Default: 20',
          default: 20,
          minimum: 5,
          maximum: 500
        }
      },
      required: ['shapes', 'originX', 'originY']
    }
  }
}
```

### 10. arrangeHorizontally ❌ **NOT IMPLEMENTED** (optional for future)
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

### 11. arrangeVertically ❌ **NOT IMPLEMENTED** (optional for future)
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

### 12. distributeEvenly ❌ **NOT IMPLEMENTED** (optional for future)
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
- Rotate shapes to different angles
- Create complex layouts (forms, nav bars, dashboards) using vertical/horizontal tools
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

**Common UI Element Sizes:**
- Input fields: 300x40 rectangles (width x height)
- Buttons: 120x40 (primary), 80x36 (secondary)
- Text labels: height 20-24px, width auto-sized
- Navigation items: 80-120px width, 40px height
- Card headers: 280-320px width, 50px height

**Grid Creation:**
- Specify rows (1-20) and columns (1-20)
- Choose shape type and color
- Optional: origin position (default 200, 200)
- Optional: spacing (default 120, range 10-500)
- Optional: size (default 50)
- LIMIT: rows × cols ≤ 100 total shapes

**Complex Command Workflow:**
When given a complex request (form, nav bar, dashboard):

Step 1: DECOMPOSE - Break into individual elements
  "Login form" → username label, username input, password label, password input, submit button

Step 2: CLASSIFY - Determine layout direction
  Forms → vertical (createShapesVertically)
  Nav bars → horizontal (createShapesHorizontally)
  Mixed → multiple tool calls

Step 3: SPECIFY - Define each shape with precise properties
  Labels: text, small height (20-24px), dark color (#2C3E50)
  Inputs: rectangle, 300x40, white fill (#FFFFFF), gray stroke (#CCCCCC)
  Buttons: rectangle, 120x40, action color (#4CAF50), white text overlay

Step 4: EXECUTE - Call appropriate tool(s) with shape array

**Layout Best Practices:**
- Forms: 25-30px vertical spacing between fields
- Nav bars: 40-60px horizontal spacing between items
- Input fields: 300x40 rectangles with light gray stroke (#CCCCCC)
- Buttons: 120x40 rectangles with solid fill (#4CAF50 green)
- Labels: Small text (height ~20-30px) above inputs
- Use white (#FFFFFF) rectangles with gray stroke for input fields

**Reference Implementations:**

Login Form Example:
createShapesVertically({
  shapes: [
    { type: 'text', color: '#2C3E50', text: 'Username:', width: 300, height: 24 },
    { type: 'rectangle', color: '#FFFFFF', width: 300, height: 40, stroke: '#CCCCCC', strokeWidth: 2 },
    { type: 'text', color: '#2C3E50', text: 'Password:', width: 300, height: 24 },
    { type: 'rectangle', color: '#FFFFFF', width: 300, height: 40, stroke: '#CCCCCC', strokeWidth: 2 },
    { type: 'rectangle', color: '#4CAF50', width: 120, height: 40 },
    { type: 'text', color: '#FFFFFF', text: 'Submit', width: 80, height: 24 }
  ],
  originX: 300,
  originY: 200,
  spacing: 30
})

Nav Bar Example:
createShapesHorizontally({
  shapes: [
    { type: 'text', color: '#2C3E50', text: 'Home', width: 80, height: 40 },
    { type: 'text', color: '#2C3E50', text: 'About', width: 80, height: 40 },
    { type: 'text', color: '#2C3E50', text: 'Services', width: 100, height: 40 },
    { type: 'text', color: '#2C3E50', text: 'Contact', width: 90, height: 40 }
  ],
  originX: 300,
  originY: 100,
  spacing: 40
})

**Manipulation Workflow:**
- Direct descriptor for single shapes: "Move the blue rectangle to 500, 300" → moveShape({type: "rectangle", color: "blue", x: 500, y: 300})
- For ambiguous requests, call getCanvasState first to see all shapes (sorted by creation time, newest first)

**Handling Ambiguous Requests:**
If command lacks specifics (e.g., "Create a dashboard"), ask:
- What elements should be included? (title, buttons, cards, etc.)
- Where should it be positioned? (default to 300, 200)
- What style/colors? (default to professional: blue #3498db, gray #95A5A6)
- OR make reasonable assumptions and state them in response

**Viewport Awareness:**
Current viewport: User is viewing area around (0, 0) center.
Default position: Use 300, 200 for new complex layouts (keeps them visible).
Complex layouts should fit within 800x600px area for good UX.

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

### Manual Test Suite (16 cases - Focused Scope)

**✅ Creation (6 cases)**
1. "Create a blue circle at 300, 400"
2. "Add a text that says 'Test'"
3. "Make a 200x150 red rectangle"
4. "Create a green triangle"
5. "Add a purple square at 100, 100"
6. "Create blue circle" (test defaults)

**⚠️ Manipulation (2 cases - 2 of 5 commands)**
7. "Move the blue rectangle to 600, 200"
8. "Rotate the blue rectangle 45 degrees"
~~9. "Resize the circle to radius 80"~~ (not implemented)
~~10. "Change the red square to green"~~ (not implemented)
~~11. "Delete the blue triangle"~~ (not implemented)
~~12. "Delete all circles"~~ (not implemented)
~~13. "Change all red shapes to blue"~~ (not implemented)
~~14. "Move all purple shapes to 500, 300"~~ (not implemented)

**⚠️ Layout (3 cases - 1 of 4 commands)**
9. "Create a 3x3 grid of red squares"
10. "Create a 2x5 grid of blue circles at 400, 300"
11. "Create grid with 150px spacing"
~~18. "Arrange these three shapes horizontally"~~ (not implemented)
~~19. "Line up these shapes vertically with 50px spacing"~~ (not implemented)
~~20. "Space these elements evenly"~~ (not implemented)

**✅ Complex (7 cases - EXPANDED)**
12. "Create a login form at 300, 200"
13. "Build a signup form with email and password"
14. "Create a contact form with name, email, message fields"
15. "Make a nav bar with Home, About, Services, Contact"
16. "Create a dashboard with title and 3 buttons"
17. "Build a pricing table with 3 tiers"
18. Test NOVEL command not in examples (e.g., "Create a profile card")

**Edge Cases (1 case)**
19. "Move the rectangle" (multiple exist) → most recent
~~26. "Create a circle" (missing color) → use default~~ (test in creation)
~~27. "Delete the flying saucer" → friendly error~~ (delete not implemented)
~~28. "Delete all large red circles" → AND logic~~ (not implemented)
~~29. "Create a 15x15 grid" → reject (>100 shapes)~~ (test in layout)
~~30. Concurrent: Two users use AI simultaneously~~ (general test, not specific)

**Accuracy Target**: 17+/19 passed (89%+)

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

## Implementation Phases (Focused Scope)

### Phase 1: Infrastructure (PR 13) ✅ **COMPLETE**
- ✅ Set up Firebase Cloud Function `openaiChat`
- ✅ Configure OpenAI API key in Functions config
- ✅ Implement authentication, CORS, rate limiting
- ✅ Create `openaiService.js` frontend client
- ✅ Create `aiTools.js` with 5 core tool schemas + template
- ✅ Create `aiPrompts.js` with focused system prompt
- ✅ **Build UI Components**:
  - ✅ Create `AIPanel.jsx` with slide-in animation
  - ✅ Create `AIPrompt.jsx` input component
  - ✅ Create `AIMessage.jsx` message display
  - ✅ Add "Agent" button to Toolbar
  - ✅ Implement keyboard shortcuts (Cmd/Ctrl+K)
  - ✅ Add localStorage persistence for panel state
  - ✅ Update ShortcutsModal with AI shortcuts
- ✅ Test basic "ping" with mock tools
- ✅ Test panel UI/UX (animations, responsiveness)

### Phase 2: Creation Commands (PR 14) - **6-8 hours**
- Implement `createShape` executor (commands 1, 2, 3)
- Implement `getCanvasState` executor (for commands 4, 6)
- Create `colorNormalizer.js` utility
- Test all 6 creation test cases
- Verify color extraction works correctly

### Phase 3: Manipulation Commands (PR 15) - **4-6 hours**
- Implement `moveShape` executor (command 4)
- Implement `rotateShape` executor (command 6)
- Create `shapeIdentification.js` utility (descriptor matching)
- Test 2 manipulation test cases
- Handle ambiguity (prefer most recent)

### Phase 4: Layout Commands (PR 16) - **4-6 hours**
- Implement `createGrid` executor (command 8)
- Create `gridGenerator.js` utility
- Test 3 grid test cases
- Validate grid limits (max 20×20, ≤100 shapes)
- Batch Firestore writes for performance

### Phase 5: Complex Commands (PR 17) - **4-6 hours**
- Implement `createShapesVertically` tool + executor
- Implement `createShapesHorizontally` tool + executor
- Update system prompt with complex command examples
- Test 7 complex commands (login form, signup, contact form, nav bar, dashboard, pricing table, novel command)
- Run full manual test suite (19 cases)
- Calculate accuracy rate (target: 17+/19 = 89%+)
- Performance testing with 5+ concurrent AI users
- Update documentation with supported commands

---

## Files to Create (Focused Scope)

### Backend (PR 13) ✅ **COMPLETE**
- ✅ `functions/index.js` - openaiChat function with OpenAI SDK integration

### Frontend (PR 13) ✅ **COMPLETE**
- ✅ `src/context/AIContext.jsx` - Controller with think-act loop
- ✅ `src/components/ai/AIPanel.jsx` - Right-side chat panel component
- ✅ `src/components/ai/AIPrompt.jsx` - Input component within panel
- ✅ `src/components/ai/AIMessage.jsx` - Individual message component
- ✅ `src/components/ai/AIPanel.css` - Panel styling
- ✅ `src/services/openaiService.js` - Fetch wrapper to Cloud Function
- ✅ `src/services/aiTools.js` - 5 core tool schemas (createShape, getCanvasState, moveShape, rotateShape, createGrid)
- ✅ `src/utils/aiPrompts.js` - System prompt builder

### Tool Executors (PR 14-17)
- `src/services/aiToolExecutor.js` - Tool execution bridge (PR 14-17)
- `src/utils/colorNormalizer.js` - CSS → hex conversion (PR 14)
- `src/utils/shapeIdentification.js` - Descriptor matching (PR 15)
- `src/utils/gridGenerator.js` - Grid layout calculations (PR 16)
- No separate files for PR 17 - executors added to aiToolExecutor.js

### Tests
- Unit tests for colorNormalizer, shapeIdentification, gridGenerator
- Unit tests for each executor function
- Integration tests for full flow (prompt → execution → Firestore)
- Manual test documentation (16 cases)

---

**Last Updated**: Current session  
**Approach**: OpenAI SDK with Function Calling (Direct Integration)
