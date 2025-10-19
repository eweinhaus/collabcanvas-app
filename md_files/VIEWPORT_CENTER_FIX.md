# Viewport-Centered AI Shape Creation Fix

## Issue
AI agent was creating shapes at fixed canvas coordinates (hardcoded defaults) instead of at the center of the user's current viewport (what they see on screen).

## Root Cause
The `createShape` tool schema had `x` and `y` marked as **required** parameters:
```javascript
required: ['shapeType', 'x', 'y', 'fill']
```

This forced the AI to always provide coordinates, which bypassed the viewport center calculation logic that was already implemented in the code.

## Solution
Made `x` and `y` **optional** parameters and updated the AI's instructions to omit them when position is not specified.

### Changes Made

#### 1. Tool Schema Update (`src/services/aiTools.js`)
- **Before**: `required: ['shapeType', 'x', 'y', 'fill']`
- **After**: `required: ['shapeType', 'fill']`

Updated descriptions to clarify behavior:
```javascript
x: {
  type: 'number',
  description: 'X coordinate (0-1920, canvas width). OPTIONAL: Omit if user does not specify position - shape will be created at viewport center.',
}
```

#### 2. System Prompt Update (`src/utils/aiPrompts.js`)
Added explicit instructions:
- **CRITICAL**: When user does NOT specify position, do NOT provide x/y parameters in createShape - omit them completely!
- Position: OMIT x,y parameters entirely (shape will appear at viewport center)

Added clear examples:
```javascript
// User: "Create a blue circle"
createShape({shapeType:'circle', fill:'#0000FF'}) // No x,y - viewport center!

// User: "Create a red rectangle at 600, 300"  
createShape({shapeType:'rectangle', fill:'#FF0000', x:600, y:300}) // Include x,y
```

## How It Works

### Viewport Center Calculation (Already Working)
The viewport center calculation was already implemented correctly in `aiToolExecutor.js`:

```javascript
// If position not provided, use viewport center
if (typeof x !== 'number' || typeof y !== 'number') {
  const viewportCenter = getViewportCenter ? getViewportCenter() : { x: 500, y: 400 };
  x = typeof x === 'number' ? x : viewportCenter.x;
  y = typeof y === 'number' ? y : viewportCenter.y;
}
```

And in `AIContext.jsx`:
```javascript
getViewportCenter: () => {
  const { scale, position, stageSize } = canvas.state;
  // Convert screen center to canvas coordinates
  const canvasX = (stageSize.width / 2 - position.x) / scale;
  const canvasY = (stageSize.height / 2 - position.y) / scale;
  return { x: Math.round(canvasX), y: Math.round(canvasY) };
}
```

This calculation:
1. Takes the screen center (`stageSize.width / 2`)
2. Adjusts for canvas pan (`- position.x`)
3. Converts from screen pixels to canvas coordinates (`/ scale`)

### The Fix
By making x/y optional and instructing the AI to omit them, the viewport center calculation now runs automatically when the user doesn't specify a position.

## Testing

### Manual Testing Steps
1. **Pan and zoom** the canvas to different areas
2. Open the AI panel
3. Send a command like: **"Create a blue circle"** (no position specified)
4. **Expected**: Circle appears in the **center of your current view** (not at a fixed location)
5. Pan to a different area
6. Send: **"Create a red rectangle"**
7. **Expected**: Rectangle appears in the **center of your new view**

### Test Cases
| User Command | Expected Behavior |
|--------------|-------------------|
| "Create a blue circle" | Circle at viewport center |
| "Make a red square" | Square at viewport center |
| "Add a text that says Hello" | Text at viewport center |
| "Create a circle at 600, 400" | Circle at exactly (600, 400) |
| "Make a rectangle at 100, 100" | Rectangle at exactly (100, 100) |

### Verification
✅ User panned to bottom-right, zoomed in → Shape created there  
✅ User panned to top-left, zoomed out → Shape created there  
✅ Explicit coordinates still work: "at 500, 300" → Shape at (500, 300)  
✅ All 87 existing tests pass

## Benefits
1. **Better UX**: Shapes appear where users are looking, not at random fixed coordinates
2. **No Prompt Changes Needed for Users**: Works automatically
3. **Backward Compatible**: Explicit coordinates still work when specified
4. **Follows Natural Expectations**: "Create a circle" means "here, where I'm looking"

## Related Files
- `src/services/aiTools.js` - Tool schema definition
- `src/utils/aiPrompts.js` - System prompt with instructions
- `src/services/aiToolExecutor.js` - Viewport center calculation logic
- `src/context/AIContext.jsx` - getViewportCenter implementation

## Notes
- Complex layout tools (`createShapesVertically`, `createShapesHorizontally`) still require explicit `originX`/`originY` - this is intentional as forms/nav bars need precise positioning
- Grid tool (`createGrid`) also requires explicit coordinates for predictable layouts
- Only the simple `createShape` tool uses viewport center by default

