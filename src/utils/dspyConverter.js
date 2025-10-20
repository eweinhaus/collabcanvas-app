/**
 * DSPy Result Converter
 * Converts DSPy complex object decomposition results into tool calls
 */

/**
 * Check if a user request is complex and should use DSPy
 * @param {string} text - User's natural language request
 * @returns {boolean} True if request should use DSPy service
 */
export function isComplexRequest(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const lower = text.toLowerCase();
  
  // Complex object keywords that DSPy can handle well
  const complexKeywords = [
    // People and characters
    'person', 'people', 'human', 'man', 'woman', 'child', 'boy', 'girl',
    'pirate', 'santa', 'robot', 'character',
    
    // Animals
    'dog', 'cat', 'bird', 'elephant', 'dinosaur', 'animal',
    'fish', 'horse', 'lion', 'tiger', 'bear',
    
    // Vehicles
    'car', 'truck', 'vehicle', 'bike', 'bicycle', 'motorcycle',
    'airplane', 'plane', 'boat', 'ship', 'train',
    
    // Buildings and structures
    'house', 'building', 'castle', 'tower', 'bridge',
    
    // Nature
    'tree', 'flower', 'plant', 'sun', 'moon', 'star', 'cloud',
    'earth', 'planet',
    
    // Objects
    'snowman', 'christmas', 'gift', 'present',
  ];

  return complexKeywords.some(keyword => lower.includes(keyword));
}

/**
 * Convert DSPy service response to tool call format
 * @param {Object} dspyResult - Result from DSPy service
 * @param {Object} canvasState - Current canvas state for positioning
 * @returns {Array} Array of tool calls for aiToolExecutor
 */
export function convertDSPyToToolCalls(dspyResult, canvasState) {
  if (!dspyResult || !dspyResult.success) {
    throw new Error('Invalid DSPy result');
  }

  const { shapes } = dspyResult;
  
  if (!Array.isArray(shapes) || shapes.length === 0) {
    throw new Error('No shapes in DSPy result');
  }

  // Limit to 100 shapes for safety
  const limitedShapes = shapes.slice(0, 100);

  // Get canvas viewport center for positioning
  // DSPy returns shapes with relative_pos, we need to convert to absolute canvas coordinates
  const { stageSize, scale } = canvasState;
  const centerX = (stageSize?.width || 1920) / 2 / scale;
  const centerY = (stageSize?.height || 1080) / 2 / scale;

  // Convert shapes to absolute positions
  const absoluteShapes = limitedShapes.map(shape => {
    const relX = shape.relative_pos?.x ?? 0;
    const relY = shape.relative_pos?.y ?? 0;

    // Build shape object with canvas coordinate system
    const canvasShape = {
      type: shape.type,
      fill: shape.color || '#4A90E2',
      x: centerX + relX,
      y: centerY + relY,
    };

    // Add type-specific dimensions
    if (shape.type === 'circle' || shape.type === 'triangle') {
      canvasShape.radius = shape.radius || 50;
    }

    if (shape.type === 'rectangle' || shape.type === 'text') {
      canvasShape.width = shape.width || 100;
      canvasShape.height = shape.height || 100;
    }

    if (shape.type === 'text' && shape.text) {
      canvasShape.text = shape.text;
      canvasShape.fontSize = shape.fontSize || 16;
    }

    // Include rotation if specified
    if (shape.rotation) {
      canvasShape.rotation = shape.rotation;
    }

    return canvasShape;
  });

  // Return as createShapesBatch tool call
  return [{
    type: 'function',
    function: {
      name: 'createShapesBatch',
      arguments: JSON.stringify({ shapes: absoluteShapes }),
    },
  }];
}

/**
 * Call DSPy service via Firebase Function
 * @param {string} userRequest - Natural language request
 * @param {string} position - Position hint (e.g., "viewport_center")
 * @param {string} idToken - Firebase ID token for authentication
 * @returns {Promise<Object>} DSPy service response
 */
export async function callDSPyService(userRequest, position, idToken) {
  // Get Firebase Functions URL from environment or use default
  // In browser, Vite will replace import.meta.env at build time
  // In tests, this will use the fallback
  const functionsUrl = 'https://us-central1-collabcanvas.cloudfunctions.net';

  const url = `${functionsUrl}/callDSPyService`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      userRequest,
      position: position || 'viewport_center',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Extract object description from user request
 * Useful for logging and feedback
 * @param {string} request - User's request
 * @returns {string} Extracted object name
 */
export function extractObjectName(request) {
  const lower = request.toLowerCase();
  
  // Try to extract "create a [object]" or "make a [object]"
  const patterns = [
    /create (?:a |an |the )?(\w+)/,
    /make (?:a |an |the )?(\w+)/,
    /draw (?:a |an |the )?(\w+)/,
    /add (?:a |an |the )?(\w+)/,
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return 'object';
}

