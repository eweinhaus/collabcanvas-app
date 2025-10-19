# DSPy Integration PRD
# Complex Object Creation Enhancement

**Project**: CollabCanvas AI - DSPy Module  
**Version**: 1.0  
**Status**: Planning  
**Implementation Approach**: Quick & Simple

---

## Executive Summary

Integrate DSPy framework to improve AI accuracy for complex object creation (animals, people, vehicles, buildings) from ~60% to 85-90%. DSPy will only handle complex requests, maintaining current system for simple operations.

**Key Principle**: Keep it simple - no templates, leverage DSPy's automatic optimization.

---

## Problem Statement

### Current State
- **Simple operations** (shapes, grids, forms): 95-98% accuracy ✅
- **Complex creative objects** (animals, vehicles, scenes): ~60% accuracy ❌
- Users must manually describe every part
- AI sometimes creates disproportionate or incoherent shapes

### Examples of Failures
1. "Create a dinosaur" → AI hangs or creates 2 random shapes
2. "Make a robot" → Parts don't connect properly
3. "Build a person" → Head is same size as body

### Target Improvements
- **Complex object accuracy**: 85-90% (from ~60%)
- **Coverage**: 15+ object types recognized
- **Visual coherence**: Proper proportions and spatial relationships

---

## Solution: DSPy for Complex Decomposition

### What is DSPy?

DSPy treats prompts as programs that can be automatically optimized:
1. Define input/output signatures
2. Provide training examples (20-50)
3. DSPy compiles optimized prompts
4. System learns from examples

### Architecture

```
User Request
    ↓
┌───────────────────────┐
│ Complexity Classifier │ ← "person", "dog", "house" = COMPLEX
└───────┬───────────────┘
        │
        ├─→ Simple? → Current GPT-4o-mini System ✅
        │
        └─→ Complex? → ┌──────────────────┐
                        │ DSPy Module      │
                        │ - Decompose      │
                        │ - Calculate      │
                        │ - Optimize       │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ Shape Specs →    │
                        │ Tool Calls       │
                        └──────────────────┘
```

---

## DSPy Module Design

### Core Module: ComplexObjectCreator

```python
class ComplexObjectDecomposition(dspy.Signature):
    """Decompose complex object into primitive shapes"""
    user_request: str       # "create a person"
    position: str           # "400, 300" or "viewport_center"
    
    # Outputs
    object_type: str        # "person"
    parts: list[str]        # ["head", "body", "arms", "legs"]
    shapes: str             # JSON array of shape specs
    layout: str             # "vertical", "horizontal", or "custom"
    rationale: str          # "Head 1/6 of height..."

class ComplexObjectCreator(dspy.Module):
    def __init__(self):
        super().__init__()
        self.decompose = dspy.ChainOfThought(ComplexObjectDecomposition)
    
    def forward(self, user_request, position="viewport_center"):
        return self.decompose(
            user_request=user_request,
            position=position
        )
```

### Training Data Format

```python
dspy.Example(
    user_request="create a person",
    position="viewport_center",
    
    # Expected outputs
    object_type="person",
    parts=["head", "body", "left_arm", "right_arm", "left_leg", "right_leg"],
    shapes='''[
        {"type": "circle", "color": "#FFE4C4", "radius": 20, "role": "head"},
        {"type": "rectangle", "color": "#2196F3", "width": 30, "height": 40, "role": "body"},
        {"type": "rectangle", "color": "#FFE4C4", "width": 25, "height": 10, "role": "left_arm"},
        {"type": "rectangle", "color": "#FFE4C4", "width": 25, "height": 10, "role": "right_arm"},
        {"type": "rectangle", "color": "#1976D2", "width": 12, "height": 30, "role": "left_leg"},
        {"type": "rectangle", "color": "#1976D2", "width": 12, "height": 30, "role": "right_leg"}
    ]''',
    layout="custom",
    rationale="Head 1/6 of total height, body 1/3, limbs proportional"
).with_inputs("user_request", "position")
```

---

## Training Dataset

### Minimum Viable Dataset: 30 Examples

**Priority 0 (15 examples)** - Must have:
- Person (4 variations: standing, colors, sizes)
- Dog (3 variations: sitting, standing, colors)
- Cat (2 variations)
- Car (3 variations: sedan, colors)
- House (3 variations: styles, sizes)

**Priority 1 (10 examples)** - Should have:
- Tree (2 variations)
- Robot (2 variations)
- Bird (2 variations)
- Dinosaur (2 variations)
- Flower (2 variations)

**Priority 2 (5 examples)** - Nice to have:
- Boat, airplane, bicycle, snowman, star

### Example Structure

Each example includes:
1. **User request**: Natural language input
2. **Expected decomposition**: List of parts
3. **Shape specifications**: JSON with relative positions
4. **Layout strategy**: How to arrange shapes
5. **Proportions rationale**: Why these sizes

---

## Integration Points

### 1. Request Classification (AIContext.jsx)

```javascript
function isComplexRequest(userRequest) {
  const complexKeywords = [
    'person', 'people', 'human', 'man', 'woman',
    'dog', 'cat', 'bird', 'animal',
    'car', 'truck', 'vehicle',
    'house', 'building',
    'tree', 'flower',
    'robot', 'dinosaur',
  ];
  
  return complexKeywords.some(kw => 
    userRequest.toLowerCase().includes(kw)
  );
}
```

### 2. DSPy Service Call (Firebase Function)

```javascript
// New Cloud Function: callDSPyService
async function callDSPyService(userRequest, position) {
  const response = await fetch(DSPY_SERVICE_URL + '/decompose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request: userRequest,
      position: position,
    }),
  });
  
  return await response.json();
}
```

### 3. Shape Creation (aiToolExecutor.js)

```javascript
// Convert DSPy output to tool calls
function convertDSPyToToolCalls(dspyResult) {
  const shapes = JSON.parse(dspyResult.shapes);
  
  // Use createShapesBatch for efficiency
  return {
    tool: 'createShapesBatch',
    shapes: shapes.map(s => ({
      type: s.type,
      fill: s.color,
      x: calculateAbsoluteX(s),
      y: calculateAbsoluteY(s),
      ...getDimensions(s),
    })),
  };
}
```

---

## Success Metrics

### Accuracy Evaluation

```python
def evaluate_complex_objects(test_set, model):
    """Score DSPy model performance"""
    scores = []
    
    for example in test_set:
        prediction = model(example.user_request)
        
        # 1. Shape count (30%)
        expected = len(json.loads(example.shapes))
        actual = len(json.loads(prediction.shapes))
        shape_score = 1.0 if abs(expected - actual) <= 2 else 0.0
        
        # 2. Proportions (30%)
        proportion_score = check_proportions(prediction.shapes)
        
        # 3. Visual coherence (20%)
        coherence_score = check_overlaps(prediction.shapes)
        
        # 4. Color realism (10%)
        color_score = check_colors(prediction.shapes)
        
        # 5. Completeness (10%)
        parts_score = check_all_parts_present(prediction.parts)
        
        total = (0.3 * shape_score + 
                 0.3 * proportion_score +
                 0.2 * coherence_score +
                 0.1 * color_score +
                 0.1 * parts_score)
        
        scores.append(total)
    
    return sum(scores) / len(scores)  # Target: 0.85+
```

### Target Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Complex object accuracy | 60% | 85-90% |
| Simple operations (no regression) | 95% | 95% |
| Shape count accuracy | 40% | 85% |
| Proportion realism | 50% | 85% |
| Visual coherence | 70% | 90% |

---

## Deployment Architecture

### Simple Deployment: Cloud Run + Cloud Functions

```
┌──────────────────────────────────────┐
│  Firebase Cloud Functions            │
│  (Node.js)                            │
│                                       │
│  - AI chat handler                   │
│  - Complexity classifier              │
│  - DSPy service proxy                 │
└────────────┬─────────────────────────┘
             │ HTTP POST
             ▼
┌──────────────────────────────────────┐
│  Google Cloud Run                    │
│  (Python 3.11 + Flask)               │
│                                       │
│  - DSPy module                        │
│  - Compiled model (.pkl)              │
│  - Inference endpoint                 │
│                                       │
│  Config:                              │
│  - Memory: 2GB                        │
│  - CPU: 2                             │
│  - Min instances: 0 (scale to zero)   │
│  - Max instances: 5                   │
└──────────────────────────────────────┘
```

### Fallback Strategy

If DSPy fails:
1. Log error to monitoring
2. Retry once with exponential backoff
3. If still fails → fall back to current GPT-4o-mini system
4. Return result with fallback flag

---

## Implementation Phases

### Phase 1: Foundation
**Goal**: Working DSPy module locally

1. Set up DSPy environment
2. Create 15 training examples (P0 objects)
3. Implement ComplexObjectCreator module
4. Write evaluation function
5. Compile with BootstrapFewShot
6. Achieve 80%+ accuracy on test set

**Deliverable**: Trained DSPy model file (.pkl)

### Phase 2: Integration
**Goal**: DSPy callable from Firebase

1. Create Flask API wrapper
2. Deploy to Cloud Run
3. Add complexity classifier to AIContext
4. Wire up frontend to call DSPy service
5. Add fallback logic
6. Test end-to-end

**Deliverable**: Working integration in production

### Phase 3: Optimization
**Goal**: 85-90% accuracy

1. Expand to 30 examples
2. Add more object types
3. Tune DSPy compiler settings
4. Collect real user feedback
5. Re-compile with new data
6. Deploy optimized model

**Deliverable**: Production-ready with target accuracy

---

## Testing Strategy

### Unit Tests (Python)

```python
def test_person_decomposition():
    result = creator(user_request="create a person")
    assert result['object_type'] == 'person'
    assert len(result['parts']) >= 5
    shapes = json.loads(result['shapes'])
    assert any(s['role'] == 'head' for s in shapes)

def test_proportions():
    result = creator(user_request="make a dog")
    shapes = json.loads(result['shapes'])
    body = next(s for s in shapes if s['role'] == 'body')
    head = next(s for s in shapes if s['role'] == 'head')
    # Body should be larger than head
    assert body['width'] > head.get('radius', 0) * 1.5
```

### Integration Tests (JavaScript)

```javascript
test('creates person via DSPy', async () => {
  const result = await sendMessage('create a person');
  expect(result.success).toBe(true);
  expect(result.shapes.length).toBeGreaterThanOrEqual(5);
});

test('falls back on DSPy failure', async () => {
  mockDSPyService.mockRejectedValue(new Error('Service down'));
  const result = await sendMessage('create a person');
  expect(result.usedFallback).toBe(true);
  expect(result.success).toBe(true);
});
```

### Manual Testing Checklist

**P0 - Must Work**:
- [ ] "Create a person" → Human-like figure
- [ ] "Make a dog" → 4-legged animal
- [ ] "Build a car" → Vehicle with wheels
- [ ] "Add a house" → Building with roof

**P1 - Should Work**:
- [ ] "Create a blue person" → Color override
- [ ] "Make a small dog" → Size adjustment
- [ ] "Build a red car with windows" → Detail addition

**Edge Cases**:
- [ ] "Create something cool" → Should ask for clarification
- [ ] "Make a dinosaur" → Novel object, reasonable attempt
- [ ] Fallback works when DSPy service is down

---

## Object Type Coverage

### Phase 1 (15 types)
✅ **Living Things**: person, dog, cat, bird  
✅ **Vehicles**: car, truck, boat  
✅ **Buildings**: house, tower  
✅ **Nature**: tree, flower  
✅ **Fantasy**: robot, dinosaur, dragon  
✅ **Basic**: snowman, star

### Phase 2+ (Future)
🔮 **Scenes**: "city street", "park", "beach"  
🔮 **Actions**: "person waving", "dog running"  
🔮 **Styles**: "cartoon person", "realistic car"

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accuracy < 85% | High | Expand training set, tune compiler |
| DSPy service down | Medium | Auto-fallback to current system |
| Inference too slow | Medium | Cache common objects, optimize |
| Training data quality | High | Peer review, visual validation |
| Color choices unrealistic | Low | Add color constraints to examples |

---

## File Structure

```
collabcanvas-app/
├── backend/
│   └── dspy_service/
│       ├── app.py                  # Flask API
│       ├── complex_objects.py      # DSPy module
│       ├── training_data.json      # Examples
│       ├── evaluate.py             # Metrics
│       ├── compile.py              # Optimization script
│       ├── models/
│       │   └── complex_v1.pkl      # Compiled model
│       ├── requirements.txt
│       └── Dockerfile
│
├── functions/
│   └── src/
│       └── dspyProxy.js           # Cloud Function proxy
│
└── src/
    ├── context/
    │   └── AIContext.jsx          # Add complexity classifier
    ├── services/
    │   └── aiToolExecutor.js      # Convert DSPy output
    └── utils/
        └── dspyConverter.js       # Helper utilities
```

---

## Launch Checklist

### Pre-Launch
- [ ] 30 training examples created
- [ ] DSPy model compiled with 85%+ accuracy
- [ ] Flask service deployed to Cloud Run
- [ ] Cloud Function proxy working
- [ ] Frontend integration complete
- [ ] Fallback logic tested
- [ ] All P0 objects working
- [ ] Manual testing completed

### Post-Launch (Week 1)
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Track accuracy in production
- [ ] Fix critical bugs
- [ ] Document learnings

---

## Success Criteria

### Go/No-Go Decision
- ✅ Accuracy ≥ 85% on test set
- ✅ Fallback working 100%
- ✅ No regression on simple operations
- ✅ All P0 objects (person, dog, cat, car, house) working

### Post-Launch Success
- Real-world accuracy ≥ 80%
- User satisfaction ≥ 85% (thumbs up/down)
- Fallback rate < 5%
- No P0 incidents

---

## Future Enhancements

### V2
- User feedback loop (learn from thumbs up/down)
- More object types (30+)
- Style variations (cartoon, realistic)
- Multi-object scenes

### V3
- Composition ("add person next to house")
- Animation poses ("person waving")
- Custom user-trained objects
- Image-to-shapes conversion

---

## Key Design Decisions

### 1. Why DSPy over Templates?
- **Flexibility**: Handles novel objects
- **Learning**: Improves with data
- **Maintainability**: No hardcoded logic
- **Scalability**: Easy to add new types

### 2. Why Complex-Only (Not All Requests)?
- **Performance**: Simple requests fast as-is
- **Risk**: Minimize regression
- **Cost**: Only pay for complex inference
- **Simplicity**: Clear separation of concerns

### 3. Why Cloud Run (Not Lambda)?
- **Python support**: Native DSPy environment
- **Scale to zero**: Free when idle
- **Container-based**: Easy deployment
- **Firebase integration**: Simple HTTP calls

---

## Appendix: Example Outputs

### Input: "create a person"

**DSPy Output**:
```json
{
  "object_type": "person",
  "parts": ["head", "body", "left_arm", "right_arm", "left_leg", "right_leg"],
  "shapes": [
    {"type": "circle", "color": "#FFE4C4", "radius": 20, "relative_pos": {"x": 0, "y": 0}, "role": "head"},
    {"type": "rectangle", "color": "#2196F3", "width": 30, "height": 40, "relative_pos": {"x": -15, "y": 25}, "role": "body"},
    {"type": "rectangle", "color": "#FFE4C4", "width": 25, "height": 10, "relative_pos": {"x": -45, "y": 30}, "role": "left_arm"},
    {"type": "rectangle", "color": "#FFE4C4", "width": 25, "height": 10, "relative_pos": {"x": 20, "y": 30}, "role": "right_arm"},
    {"type": "rectangle", "color": "#1976D2", "width": 12, "height": 30, "relative_pos": {"x": -15, "y": 65}, "role": "left_leg"},
    {"type": "rectangle", "color": "#1976D2", "width": 12, "height": 30, "relative_pos": {"x": 3, "y": 65}, "role": "right_leg"}
  ],
  "layout": "custom",
  "rationale": "Head is 1/6 of total height (20px radius). Body is 1/3 (40px). Limbs proportional to body. Arms at shoulder height, legs at waist."
}
```

**Converted to Tool Call**:
```javascript
{
  tool: 'createShapesBatch',
  shapes: [
    {type: 'circle', fill: '#FFE4C4', x: 400, y: 300, radius: 20},
    {type: 'rectangle', fill: '#2196F3', x: 385, y: 325, width: 30, height: 40},
    {type: 'rectangle', fill: '#FFE4C4', x: 355, y: 330, width: 25, height: 10},
    {type: 'rectangle', fill: '#FFE4C4', x: 420, y: 330, width: 25, height: 10},
    {type: 'rectangle', fill: '#1976D2', x: 385, y: 365, width: 12, height: 30},
    {type: 'rectangle', fill: '#1976D2', x: 403, y: 365, width: 12, height: 30},
  ]
}
```

---

**Document Version**: 1.0  
**Last Updated**: October 19, 2025  
**Status**: Ready for Implementation

