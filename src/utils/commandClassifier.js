/**
 * Command Classifier & Preprocessor
 * Routes commands to appropriate model and preprocesses calculations
 */

/**
 * Preprocess command to inject calculated values
 * @param {string} userInput - Raw user input
 * @param {Object} canvasContext - Canvas context with shapes and viewport info
 * @returns {Object} { preprocessed: string, needsPreprocessing: boolean, calculations: Object }
 */
export function preprocessCommand(userInput, canvasContext) {
  const input = userInput.trim();
  const lower = input.toLowerCase();
  
  // Get viewport center
  const { scale = 1, position = { x: 0, y: 0 }, stageSize = { width: 800, height: 600 } } = canvasContext;
  const centerX = Math.round((stageSize.width / 2 - position.x) / scale);
  const centerY = Math.round((stageSize.height / 2 - position.y) / scale);
  
  // Pattern: "move X to center" or "move X to the center"
  const moveToCenterMatch = input.match(/move (the |that )?(.+?) to (the )?center/i);
  if (moveToCenterMatch) {
    const descriptor = moveToCenterMatch[2];
    const preprocessed = `Move ${descriptor} to ${centerX}, ${centerY}`;
    return {
      preprocessed,
      needsPreprocessing: true,
      calculations: { centerX, centerY },
      originalIntent: 'move_to_center',
    };
  }
  
  // Pattern: "resize X to be Y times as big" or "make X twice as big"
  const resizeMatch = input.match(/(?:resize|make) (the |that )?(.+?) (?:to be )?(\w+|[\d.]+)x? (?:times )?(?:as )?(?:big|large)/i);
  if (resizeMatch) {
    const descriptor = resizeMatch[2];
    const multiplierText = resizeMatch[3];
    
    // Convert word to number (twice = 2, triple = 3, etc.)
    const multiplierMap = {
      'twice': 2,
      'double': 2,
      'triple': 3,
      'quadruple': 4,
      'half': 0.5,
    };
    const multiplier = multiplierMap[multiplierText.toLowerCase()] || parseFloat(multiplierText) || 2;
    
    // Find the shape
    const shapes = canvasContext.shapes || [];
    const identifiedShape = identifyShape(descriptor, shapes);
    
    if (identifiedShape) {
      const currentSize = identifiedShape.radius || identifiedShape.width || 100;
      const newSize = Math.round(currentSize * multiplier);
      
      // Note: resize tool not implemented, but we preprocess for future
      const preprocessed = `Resize ${descriptor} to size ${newSize}`;
      return {
        preprocessed,
        needsPreprocessing: true,
        calculations: { multiplier, currentSize, newSize },
        originalIntent: 'resize_multiply',
        warning: 'Resize tool not implemented - will fail',
      };
    }
  }
  
  // No preprocessing needed
  return {
    preprocessed: input,
    needsPreprocessing: false,
    calculations: {},
  };
}

/**
 * Simple shape identifier
 */
function identifyShape(descriptor, shapes) {
  const lower = descriptor.toLowerCase();
  
  // Try color + type match
  for (const shape of shapes) {
    const colorMatch = shape.fill && lower.includes(shape.fill.substring(1).toLowerCase());
    const typeMatch = lower.includes(shape.type);
    if (colorMatch && typeMatch) return shape;
  }
  
  // Try type only (most recent)
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (lower.includes(shapes[i].type)) return shapes[i];
  }
  
  return null;
}

/**
 * Classify command complexity for model routing
 * @param {string} userInput - User input (can be preprocessed)
 * @returns {Object} { complexity: 'simple'|'complex', model: string, confidence: number, reason: string }
 */
export function classifyCommand(userInput) {
  const input = userInput.toLowerCase().trim();
  
  // SIMPLE patterns (route to gpt-3.5-turbo)
  const simplePatterns = [
    // Explicit shape creation with position
    /^create (a |an )?(?:red|blue|green|yellow|orange|purple|white|black|cyan|magenta|pink|brown|gray|grey) (?:circle|rectangle|square|triangle) at \d+,?\s*\d+$/,
    
    // Explicit shape creation with dimensions
    /^(?:make|create) (a |an )?\d+x\d+ (?:rectangle|square)$/,
    
    // Text creation with content
    /^(?:add|create) (a |an )?text (?:layer |shape |that )?(?:says|saying|with) ['"].+['"]$/,
    
    // Grid creation (direct tool mapping)
    /^create (a |an )?\d+x\d+ grid (?:of )?(?:squares?|circles?|rectangles?|triangles?)$/,
    
    // Move with explicit coordinates (including preprocessed center commands)
    /^move (?:the |that )?[\w\s]+ to \d+,?\s*\d+$/,
    
    // Rotate with explicit degrees
    /^rotate (?:the |that )?[\w\s]+ (?:by )?\d+ degrees?$/,
  ];
  
  if (simplePatterns.some(pattern => pattern.test(input))) {
    return {
      complexity: 'simple',
      model: 'gpt-3.5-turbo',
      confidence: 0.95,
      reason: 'Direct tool mapping with explicit parameters',
    };
  }
  
  // COMPLEX patterns (route to gpt-4o-mini)
  const complexPatterns = [
    // Multi-shape operations
    /^(?:arrange|align|space|distribute)/,
    
    // Relative positioning (not preprocessed)
    /\b(?:top|bottom|left|right)\b/,
    
    // Decomposition keywords
    /\b(?:form|layout|card|panel|dashboard|nav|menu|bar|login|signup|contact|profile|pricing)\b/,
    
    // Ambiguous shape references without explicit coords
    /^(?:move|delete) (?:the |that )?.+(?<!to \d+,?\s*\d+)$/,
  ];
  
  if (complexPatterns.some(pattern => pattern.test(input))) {
    return {
      complexity: 'complex',
      model: 'gpt-4o-mini',
      confidence: 0.90,
      reason: 'Requires reasoning, decomposition, or shape identification',
    };
  }
  
  // DEFAULT: Complex (safety first for accuracy)
  return {
    complexity: 'complex',
    model: 'gpt-4o-mini',
    confidence: 0.75,
    reason: 'Unmatched pattern - defaulting to accurate model',
  };
}

/**
 * Get detailed classification with explanation
 * @param {string} userInput - User input
 * @param {Object} canvasContext - Canvas context for preprocessing
 * @returns {Object} Full classification result
 */
export function classifyAndPreprocess(userInput, canvasContext) {
  // First, preprocess to handle center/resize calculations
  const preprocessResult = preprocessCommand(userInput, canvasContext);
  
  // Then classify (use preprocessed command)
  const classification = classifyCommand(preprocessResult.preprocessed);
  
  // Log for debugging
  if (preprocessResult.needsPreprocessing) {
    console.log(`🔧 [Preprocessor] "${userInput}"`);
    console.log(`   → Preprocessed: "${preprocessResult.preprocessed}"`);
    console.log(`   → Calculations:`, preprocessResult.calculations);
  }
  
  console.log(`🧠 [Classifier] "${preprocessResult.preprocessed}"`);
  console.log(`   → ${classification.complexity.toUpperCase()} (${classification.model})`);
  console.log(`   → Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
  console.log(`   → Reason: ${classification.reason}`);
  
  return {
    ...classification,
    preprocessed: preprocessResult.preprocessed,
    needsPreprocessing: preprocessResult.needsPreprocessing,
    calculations: preprocessResult.calculations,
    originalInput: userInput,
    warning: preprocessResult.warning,
  };
}

