/**
 * Creative Object Planner
 * Utilities for planning and generating creative objects using LLM
 */

/**
 * Build planning prompt for GPT-4o to design a creative object
 * @param {string} objectType - Type of object (e.g., "dinosaur", "bus", "pirate ship")
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} scale - Scale factor (0.5-2.0)
 * @returns {string} Planning prompt for LLM
 */
export function buildCreativeObjectPlanningPrompt(objectType, centerX, centerY, scale = 1.0) {
  return `You are a creative shape artist. Design a "${objectType}" using 10-20 simple shapes (rectangles, circles, triangles).

Center position: (${centerX}, ${centerY})
Scale factor: ${scale}

REQUIREMENTS:
1. Use 10-20 shapes (minimum 10 for detail, maximum 20 for performance)
2. Only use: "rectangle", "circle", "triangle"
3. Create a recognizable representation with good proportions
4. Position shapes relative to center (${centerX}, ${centerY})
5. Use appropriate colors (realistic or stylized)
6. Layer shapes logically (background to foreground)

OUTPUT STRICT JSON (no markdown, no explanation, ONLY the JSON below):
{
  "shapes": [
    {
      "type": "rectangle|circle|triangle",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "radius": number,
      "fill": "#HEXCOLOR",
      "rotation": number,
      "description": "descriptive-name"
    }
  ]
}

PROPERTY RULES:
- type: Required, must be "rectangle", "circle", or "triangle"
- x, y: Required, absolute canvas coordinates
- width, height: Required for rectangle and triangle (omit for circle)
- radius: Required for circle (omit for rectangle/triangle)
- fill: Required, hex color code (e.g., "#FF0000")
- rotation: Optional, degrees 0-359 (default 0)
- description: Optional, helps explain the shape's purpose

EXAMPLES:

Simple Car (4 shapes):
{
  "shapes": [
    {"type":"rectangle","x":500,"y":400,"width":200,"height":80,"fill":"#FF0000","rotation":0,"description":"body"},
    {"type":"rectangle","x":560,"y":350,"width":80,"height":60,"fill":"#87CEEB","rotation":0,"description":"window"},
    {"type":"circle","x":450,"y":480,"radius":30,"fill":"#000000","description":"wheel-left"},
    {"type":"circle","x":550,"y":480,"radius":30,"fill":"#000000","description":"wheel-right"}
  ]
}

Simple House (5 shapes):
{
  "shapes": [
    {"type":"rectangle","x":400,"y":350,"width":150,"height":120,"fill":"#D2691E","rotation":0,"description":"walls"},
    {"type":"triangle","x":475,"y":280,"width":180,"height":80,"fill":"#8B4513","rotation":0,"description":"roof"},
    {"type":"rectangle","x":450,"y":400,"width":40,"height":60,"fill":"#654321","rotation":0,"description":"door"},
    {"type":"rectangle","x":370,"y":340,"width":30,"height":30,"fill":"#87CEEB","rotation":0,"description":"window-left"},
    {"type":"rectangle","x":480,"y":340,"width":30,"height":30,"fill":"#87CEEB","rotation":0,"description":"window-right"}
  ]
}

Simple Tree (6 shapes):
{
  "shapes": [
    {"type":"rectangle","x":500,"y":450,"width":30,"height":100,"fill":"#8B4513","rotation":0,"description":"trunk"},
    {"type":"circle","x":515,"y":370,"radius":50,"fill":"#228B22","description":"foliage-bottom"},
    {"type":"circle","x":480,"y":350,"radius":45,"fill":"#2E8B57","description":"foliage-left"},
    {"type":"circle","x":550,"y":350,"radius":45,"fill":"#2E8B57","description":"foliage-right"},
    {"type":"circle","x":515,"y":320,"radius":40,"fill":"#3CB371","description":"foliage-top-center"},
    {"type":"circle","x":500,"y":300,"radius":30,"fill":"#32CD32","description":"foliage-top"}
  ]
}

Now design the "${objectType}" with 10-20 shapes. Be creative but recognizable!

CRITICAL: Output ONLY valid JSON (no markdown code blocks, no explanation). Start directly with { and end with }.`;
}

/**
 * Validate a creative object plan
 * @param {Object} plan - Plan object from LLM
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateCreativeObjectPlan(plan) {
  // Check plan structure
  if (!plan || typeof plan !== 'object') {
    return { valid: false, error: 'Plan is not an object' };
  }

  if (!plan.shapes || !Array.isArray(plan.shapes)) {
    return { valid: false, error: 'Plan missing shapes array' };
  }

  // Check shape count (10-20)
  if (plan.shapes.length < 10) {
    return { valid: false, error: `Too few shapes: ${plan.shapes.length} (minimum 10 required)` };
  }

  if (plan.shapes.length > 20) {
    return { valid: false, error: `Too many shapes: ${plan.shapes.length} (maximum 20 allowed)` };
  }

  // Validate each shape
  for (let i = 0; i < plan.shapes.length; i++) {
    const shape = plan.shapes[i];
    
    // Check required fields
    if (!shape.type || !['rectangle', 'circle', 'triangle'].includes(shape.type)) {
      return { valid: false, error: `Shape ${i}: invalid or missing type "${shape.type}"` };
    }

    if (typeof shape.x !== 'number' || typeof shape.y !== 'number') {
      return { valid: false, error: `Shape ${i}: missing or invalid x/y coordinates` };
    }

    if (!shape.fill || typeof shape.fill !== 'string') {
      return { valid: false, error: `Shape ${i}: missing or invalid fill color` };
    }

    // Check type-specific requirements
    if (shape.type === 'circle') {
      if (typeof shape.radius !== 'number' || shape.radius <= 0) {
        return { valid: false, error: `Shape ${i}: circle requires valid radius` };
      }
    } else {
      // rectangle and triangle need width and height
      if (typeof shape.width !== 'number' || shape.width <= 0) {
        return { valid: false, error: `Shape ${i}: ${shape.type} requires valid width` };
      }
      if (typeof shape.height !== 'number' || shape.height <= 0) {
        return { valid: false, error: `Shape ${i}: ${shape.type} requires valid height` };
      }
    }
  }

  return { valid: true };
}

/**
 * Parse LLM response and extract JSON plan
 * Handles markdown-wrapped JSON and other common formatting issues
 * @param {string} responseText - Raw text response from LLM
 * @returns {Object} Parsed plan object
 * @throws {Error} If parsing fails
 */
export function parseCreativeObjectPlan(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    throw new Error('Invalid response: empty or not a string');
  }

  // Remove markdown code blocks if present
  let cleaned = responseText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  cleaned = cleaned.trim();

  // Try to parse
  try {
    const plan = JSON.parse(cleaned);
    return plan;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

/**
 * Create a simple fallback object if LLM planning fails
 * @param {string} objectType - Type of object
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} scale - Scale factor
 * @returns {Object} Simple plan with basic shapes (minimum 10 shapes)
 */
export function createFallbackPlan(objectType, centerX, centerY, scale = 1.0) {
  // Generic fallback: 10-shape abstract representation
  const baseSize = 50 * scale;
  
  return {
    shapes: [
      // Main body
      {
        type: 'rectangle',
        x: centerX,
        y: centerY,
        width: baseSize * 2,
        height: baseSize * 1.5,
        fill: '#4285F4',
        rotation: 0,
        description: 'body-main',
      },
      // Head
      {
        type: 'circle',
        x: centerX,
        y: centerY - baseSize * 1.2,
        radius: baseSize * 0.6,
        fill: '#34A853',
        description: 'head',
      },
      // Left leg
      {
        type: 'rectangle',
        x: centerX - baseSize * 0.5,
        y: centerY + baseSize,
        width: baseSize * 0.6,
        height: baseSize * 0.8,
        fill: '#FBBC05',
        rotation: 0,
        description: 'leg-left',
      },
      // Right leg
      {
        type: 'rectangle',
        x: centerX + baseSize * 0.5,
        y: centerY + baseSize,
        width: baseSize * 0.6,
        height: baseSize * 0.8,
        fill: '#FBBC05',
        rotation: 0,
        description: 'leg-right',
      },
      // Left arm
      {
        type: 'rectangle',
        x: centerX - baseSize * 1.2,
        y: centerY,
        width: baseSize * 0.5,
        height: baseSize,
        fill: '#EA4335',
        rotation: 0,
        description: 'arm-left',
      },
      // Right arm
      {
        type: 'rectangle',
        x: centerX + baseSize * 1.2,
        y: centerY,
        width: baseSize * 0.5,
        height: baseSize,
        fill: '#EA4335',
        rotation: 0,
        description: 'arm-right',
      },
      // Top detail/hat
      {
        type: 'triangle',
        x: centerX,
        y: centerY - baseSize * 1.8,
        width: baseSize * 0.8,
        height: baseSize * 0.6,
        fill: '#F4B400',
        rotation: 0,
        description: 'top-detail',
      },
      // Left eye
      {
        type: 'circle',
        x: centerX - baseSize * 0.25,
        y: centerY - baseSize * 1.2,
        radius: baseSize * 0.15,
        fill: '#000000',
        description: 'eye-left',
      },
      // Right eye
      {
        type: 'circle',
        x: centerX + baseSize * 0.25,
        y: centerY - baseSize * 1.2,
        radius: baseSize * 0.15,
        fill: '#000000',
        description: 'eye-right',
      },
      // Center detail/badge
      {
        type: 'circle',
        x: centerX,
        y: centerY,
        radius: baseSize * 0.3,
        fill: '#FFFFFF',
        description: 'center-badge',
      },
    ],
  };
}
