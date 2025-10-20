# DSPy Integration Task List
# Complex Object Creation via DSPy

**Status**: Planning → Implementation  
**Total PRs**: 3 (PRs 20-22)  
**Approach**: Quick & Simple - No templates, leverage DSPy optimization  
**Target**: 85-90% accuracy for complex objects

---

## Overview

### Current State
- ✅ Simple shapes, grids, forms: 95-98% accurate
- ❌ Complex objects (animals, people, vehicles): ~60% accurate
- ❌ Creative requests often fail or hang

### Goal
- 🎯 Complex objects: 85-90% accurate
- 🎯 Cover 15+ object types
- 🎯 No regression on simple operations
- 🎯 Fallback to current system if DSPy fails

### Strategy
1. **PR 20**: Build & train DSPy module locally
2. **PR 21**: Deploy and integrate with Firebase
3. **PR 22**: Optimize and expand coverage

---

## PR 20: DSPy Foundation (Core Module & Training)
**Priority**: HIGH | **Status**: Not Started  
**Estimated Effort**: Quick Implementation Focus

### Goal
Create and train a working DSPy module that can decompose complex objects into shape specifications with 80%+ accuracy on a test set.

### Tasks

#### 20.1 Environment Setup
- [x] **20.1.1** Create `backend/dspy_service/` directory structure
- [x] **20.1.2** Set up Python 3.11 virtual environment
- [x] **20.1.3** Install DSPy: `pip install dspy-ai openai`
- [x] **20.1.4** Create `requirements.txt` with all dependencies
- [x] **20.1.5** Test DSPy import and basic functionality

**Files to Create**:
```
backend/dspy_service/
├── requirements.txt
├── .python-version (3.11)
└── venv/ (gitignored)
```

#### 20.2 DSPy Module Implementation
- [x] **20.2.1** Create `complex_objects.py` with DSPy signatures
- [x] **20.2.2** Implement `ComplexObjectDecomposition` signature
- [x] **20.2.3** Implement `ComplexObjectCreator` module with ChainOfThought
- [x] **20.2.4** Add docstrings and type hints
- [x] **20.2.5** Test module instantiation

**Files to Create**:
```python
# backend/dspy_service/complex_objects.py
import dspy

class ComplexObjectDecomposition(dspy.Signature):
    """Decompose complex object into primitive shapes"""
    user_request: str = dspy.InputField(desc="User's request")
    position: str = dspy.InputField(desc="Target position")
    
    object_type: str = dspy.OutputField(desc="Type of object")
    parts: list[str] = dspy.OutputField(desc="Object parts")
    shapes: str = dspy.OutputField(desc="JSON shape specs")
    layout: str = dspy.OutputField(desc="Layout strategy")
    rationale: str = dspy.OutputField(desc="Proportion explanation")

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

#### 20.3 Training Data Creation
- [x] **20.3.1** Create `training_data.json` file structure
- [x] **20.3.2** Add training data examples
- [x] **20.3.3** Validate JSON format and completeness

**Target**: 15 high-quality training examples

**Example Format**:
```python
dspy.Example(
    user_request="create a person",
    position="viewport_center",
    object_type="person",
    parts=["head", "body", "left_arm", "right_arm", "left_leg", "right_leg"],
    shapes='''[...]''',  # JSON array
    layout="custom",
    rationale="Head 1/6 of height, body 1/3, proportional limbs"
).with_inputs("user_request", "position")
```

**Files to Create**:
- `backend/dspy_service/training_data.json`
- `backend/dspy_service/load_training_data.py` (helper to load examples)

#### 20.4 Evaluation Function
- [x] **20.4.1** Create `evaluate.py` with metrics
- [x] **20.4.2** Implement shape count accuracy check (±2 shapes)
- [x] **20.4.3** Implement proportion accuracy check (size ratios)
- [x] **20.4.4** Implement visual coherence check (overlaps)
- [x] **20.4.5** Implement color appropriateness check
- [x] **20.4.6** Implement weighted scoring (target: 0.85+)
- [x] **20.4.7** Add logging and visualization

**Files to Create**:
```python
# backend/dspy_service/evaluate.py
def evaluate_complex_objects(test_set, model):
    """
    Evaluate model accuracy on test set
    Returns: float (0.0-1.0), target is 0.85+
    """
    scores = []
    for example in test_set:
        prediction = model(example.user_request)
        
        # 1. Shape count (30% weight)
        shape_score = check_shape_count(prediction, example)
        
        # 2. Proportions (30% weight)
        proportion_score = check_proportions(prediction, example)
        
        # 3. Visual coherence (20% weight)
        coherence_score = check_coherence(prediction)
        
        # 4. Colors (10% weight)
        color_score = check_colors(prediction)
        
        # 5. Completeness (10% weight)
        parts_score = check_parts(prediction, example)
        
        total = (0.3 * shape_score + 0.3 * proportion_score + 
                 0.2 * coherence_score + 0.1 * color_score + 
                 0.1 * parts_score)
        scores.append(total)
    
    return sum(scores) / len(scores)
```

#### 20.5 DSPy Compilation & Optimization
- [x] **20.5.1** Create `compile.py` script
- [x] **20.5.2** Configure OpenAI API (GPT-4o-mini for compilation)
- [x] **20.5.3** Split data: 12 training, 3 test
- [x] **20.5.4** Initialize BootstrapFewShot teleprompter
- [x] **20.5.5** Run compilation (max_bootstrapped_demos=5)
- [x] **20.5.6** Evaluate on test set (target: 80%+)
- [x] **20.5.7** Save compiled model as `models/complex_v1.pkl`
- [x] **20.5.8** Document compilation settings and results

**Files to Create**:
```python
# backend/dspy_service/compile.py
import dspy
from dspy.teleprompt import BootstrapFewShot
from complex_objects import ComplexObjectCreator
from evaluate import evaluate_complex_objects
from load_training_data import load_examples

# Configure LLM
turbo = dspy.OpenAI(model='gpt-4o-mini', api_key='...')
dspy.settings.configure(lm=turbo)

# Load data
examples = load_examples('training_data.json')
trainset = examples[:12]
testset = examples[12:15]

# Compile
teleprompter = BootstrapFewShot(
    metric=evaluate_complex_objects,
    max_bootstrapped_demos=5,
    max_labeled_demos=5
)

creator = ComplexObjectCreator()
optimized = teleprompter.compile(creator, trainset=trainset)

# Evaluate
score = evaluate_complex_objects(testset, optimized)
print(f"Test accuracy: {score:.2%}")

# Save
optimized.save('models/complex_v1.pkl')
```

#### 20.6 Unit Testing
- [x] **20.6.1** Create `tests/test_module.py`
- [x] **20.6.2** Test person decomposition (5+ shapes)
- [x] **20.6.3** Test dog decomposition (6+ shapes)
- [x] **20.6.4** Test proportions (body > head)
- [x] **20.6.5** Test color extraction ("red car" → red shapes)
- [x] **20.6.6** Test JSON validity of outputs
- [x] **20.6.7** Run all tests and verify passing

**Files to Create**:
```python
# backend/dspy_service/tests/test_module.py
import pytest
from complex_objects import ComplexObjectCreator

@pytest.fixture
def creator():
    # Load compiled model
    return ComplexObjectCreator.load('models/complex_v1.pkl')

def test_person(creator):
    result = creator(user_request="create a person")
    assert result['object_type'] == 'person'
    assert len(result['parts']) >= 5
    shapes = json.loads(result['shapes'])
    assert len(shapes) >= 5

def test_proportions(creator):
    result = creator(user_request="make a dog")
    shapes = json.loads(result['shapes'])
    body = next(s for s in shapes if s['role'] == 'body')
    head = next(s for s in shapes if s['role'] == 'head')
    assert body['width'] > head.get('radius', 0) * 1.5
```

#### 20.7 Documentation
- [x] **20.7.1** Create `README.md` for dspy_service
- [x] **20.7.2** Document training data format
- [x] **20.7.3** Document compilation process
- [x] **20.7.4** Add usage examples
- [x] **20.7.5** Document evaluation metrics

**Deliverables**:
- ✅ Trained DSPy model (80%+ accuracy)
- ✅ 15 training examples (P0 objects)
- ✅ Evaluation function
- ✅ Unit tests passing
- ✅ Documentation COMPLETE

**Files Created**:
```
backend/dspy_service/
├── README.md                      ✅ (comprehensive, 400+ lines)
├── QUICKSTART.md                  ✅ (step-by-step guide)
├── USAGE_EXAMPLES.md              ✅ (12 detailed examples)
├── TRAINING_DATA_FORMAT.md        ✅ (complete specification)
├── EVALUATION_GUIDE.md            ✅ (metrics documentation)
├── TRAINING_DATA_SUMMARY.md       ✅ (dataset overview)
├── requirements.txt               ✅
├── complex_objects.py             ✅
├── training_data.json             ✅ (16 examples, 185 shapes)
├── load_training_data.py          ✅
├── evaluate.py                    ✅ (580 lines)
├── compile.py                     ✅ (390 lines)
├── run_tests.py                   ✅ (270 lines)
├── models/
│   ├── complex_v1.pkl             ✅
│   ├── complex_v1.sha256          ✅
│   └── complex_v1.prompt.txt      ✅
└── tests/
    ├── test_module.py             ✅ (9 tests)
    └── test_evaluate.py           ✅ (28 tests)
```

---

## PR 21: Integration & Deployment
**Priority**: HIGH | **Status**: Not Started  
**Depends On**: PR 20

### Goal
Deploy DSPy service to Cloud Run and integrate with Firebase Cloud Functions so complex object requests flow through DSPy.

### Tasks

#### 21.1 Flask API Wrapper
- [ ] **21.1.1** Create `app.py` Flask server
- [ ] **21.1.2** Add `/health` endpoint for monitoring
- [ ] **21.1.3** Add `/decompose` POST endpoint
- [ ] **21.1.4** Load compiled model at startup
- [ ] **21.1.5** Handle inference requests
- [ ] **21.1.6** Return JSON response with shape specs
- [ ] **21.1.7** Add error handling and logging
- [ ] **21.1.8** Test locally with curl

**Files to Create**:
```python
# backend/dspy_service/app.py
from flask import Flask, request, jsonify
import json
from complex_objects import ComplexObjectCreator

app = Flask(__name__)

# Load model at startup
model = ComplexObjectCreator.load('models/complex_v1.pkl')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/decompose', methods=['POST'])
def decompose():
    try:
        data = request.json
        result = model(
            user_request=data['request'],
            position=data.get('position', 'viewport_center')
        )
        
        return jsonify({
            'success': True,
            'object_type': result['object_type'],
            'parts': result['parts'],
            'shapes': json.loads(result['shapes']),
            'layout': result['layout'],
            'rationale': result['rationale'],
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

#### 21.2 Docker Containerization
- [ ] **21.2.1** Create `Dockerfile` for Python service
- [ ] **21.2.2** Use Python 3.11 slim base image
- [ ] **21.2.3** Copy requirements and install dependencies
- [ ] **21.2.4** Copy model and source files
- [ ] **21.2.5** Expose port 8080
- [ ] **21.2.6** Build container locally and test
- [ ] **21.2.7** Verify /health and /decompose endpoints work

**Files to Create**:
```dockerfile
# backend/dspy_service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["python", "app.py"]
```

#### 21.3 Cloud Run Deployment
- [ ] **21.3.1** Build Docker image: `docker build -t gcr.io/collabcanvas/dspy-service:v1 .`
- [ ] **21.3.2** Push to Google Container Registry: `docker push gcr.io/collabcanvas/dspy-service:v1`
- [ ] **21.3.3** Deploy to Cloud Run with config:
  - Memory: 2GB
  - CPU: 2
  - Min instances: 0 (scale to zero)
  - Max instances: 5
  - Timeout: 10s
- [ ] **21.3.4** Set OPENAI_API_KEY environment variable
- [ ] **21.3.5** Test deployed service with curl
- [ ] **21.3.6** Verify health endpoint
- [ ] **21.3.7** Save Cloud Run URL

**Cloud Run URL**: `https://dspy-service-[hash]-uc.a.run.app`

#### 21.4 Firebase Cloud Function Proxy
- [ ] **21.4.1** Create `functions/src/dspyProxy.ts`
- [ ] **21.4.2** Add authentication check
- [ ] **21.4.3** Add rate limiting (same as AI chat)
- [ ] **21.4.4** Call Cloud Run service via HTTP
- [ ] **21.4.5** Parse and return response
- [ ] **21.4.6** Add error handling and retry logic
- [ ] **21.4.7** Deploy function: `npm run deploy -- --only functions:callDSPyService`

**Files to Create**:
```typescript
// functions/src/dspyProxy.ts
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

const DSPY_SERVICE_URL = 'https://dspy-service-[hash]-uc.a.run.app';

export const callDSPyService = functions
  .runWith({
    timeoutSeconds: 10,
    memory: '1GB',
  })
  .https.onCall(async (data, context) => {
    // 1. Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    
    // 2. Rate limit
    await checkRateLimit(context.auth.uid);
    
    // 3. Call DSPy service
    try {
      const response = await fetch(`${DSPY_SERVICE_URL}/decompose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: data.userRequest,
          position: data.position || 'viewport_center',
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'DSPy service failed');
      }
      
      return result;
    } catch (error) {
      console.error('DSPy service error:', error);
      throw new functions.https.HttpsError('internal', 'DSPy service unavailable');
    }
  });
```

#### 21.5 Frontend Integration
- [ ] **21.5.1** Add complexity classifier to `AIContext.jsx`
- [ ] **21.5.2** Create `isComplexRequest()` function
- [ ] **21.5.3** Route complex requests to DSPy service
- [ ] **21.5.4** Create `utils/dspyConverter.js` to convert DSPy output to tool calls
- [ ] **21.5.5** Add fallback logic (if DSPy fails → current system)
- [ ] **21.5.6** Update `aiToolExecutor.js` to handle batch shape creation
- [ ] **21.5.7** Add error handling and user feedback

**Files to Modify/Create**:
```javascript
// src/context/AIContext.jsx
function isComplexRequest(userRequest) {
  const complexKeywords = [
    'person', 'people', 'human', 'man', 'woman',
    'dog', 'cat', 'bird', 'animal',
    'car', 'truck', 'vehicle',
    'house', 'building',
    'tree', 'flower',
    'robot', 'dinosaur',
  ];
  
  const lower = userRequest.toLowerCase();
  return complexKeywords.some(kw => lower.includes(kw));
}

// In sendMessage function:
if (isComplexRequest(content)) {
  // Try DSPy first
  try {
    const dspyResult = await callDSPyService({
      userRequest: content,
      position: canvas.state.viewportCenter,
    });
    
    // Convert to tool calls
    const toolCalls = convertDSPyToToolCalls(dspyResult);
    await executeToolCalls(toolCalls);
  } catch (error) {
    console.warn('DSPy failed, falling back to current system:', error);
    // Fall through to current GPT-4o-mini system
    // ... existing code ...
  }
} else {
  // Simple request, use current system
  // ... existing code ...
}
```

```javascript
// src/utils/dspyConverter.js
export function convertDSPyToToolCalls(dspyResult) {
  const shapes = dspyResult.shapes;
  const centerX = 960; // viewport center X
  const centerY = 540; // viewport center Y
  
  // Convert relative positions to absolute
  const absoluteShapes = shapes.map(shape => {
    const relX = shape.relative_pos?.x || 0;
    const relY = shape.relative_pos?.y || 0;
    
    return {
      type: shape.type,
      fill: shape.color,
      x: centerX + relX,
      y: centerY + relY,
      ...(shape.width && { width: shape.width }),
      ...(shape.height && { height: shape.height }),
      ...(shape.radius && { radius: shape.radius }),
      ...(shape.text && { text: shape.text }),
      ...(shape.fontSize && { fontSize: shape.fontSize }),
    };
  });
  
  return [{
    function: {
      name: 'createShapesBatch',
      arguments: JSON.stringify({ shapes: absoluteShapes }),
    },
  }];
}
```

#### 21.6 Testing
- [ ] **21.6.1** Test "create a person" end-to-end
- [ ] **21.6.2** Test "make a dog" end-to-end
- [ ] **21.6.3** Test "build a house" end-to-end
- [ ] **21.6.4** Test fallback when DSPy service is down
- [ ] **21.6.5** Test simple requests still work (no regression)
- [ ] **21.6.6** Test with color overrides ("red car")
- [ ] **21.6.7** Verify shapes appear correctly on canvas
- [ ] **21.6.8** Check shapes sync to other users

#### 21.7 Monitoring Setup
- [ ] **21.7.1** Add Cloud Monitoring dashboard for Cloud Run
- [ ] **21.7.2** Track request rate, latency, errors
- [ ] **21.7.3** Add custom logs for DSPy requests
- [ ] **21.7.4** Set up alert for high error rate (>5%)
- [ ] **21.7.5** Document monitoring setup in README

**Deliverables**:
- ✅ DSPy service deployed to Cloud Run
- ✅ Firebase proxy function working
- ✅ Frontend integration complete
- ✅ Fallback logic tested
- ✅ End-to-end testing passed
- ✅ Monitoring dashboard live

**Files Created/Modified**:
```
backend/dspy_service/
├── app.py
├── Dockerfile
└── .dockerignore

functions/src/
└── dspyProxy.ts

src/
├── context/
│   └── AIContext.jsx (modified)
├── utils/
│   └── dspyConverter.js (new)
└── services/
    └── aiToolExecutor.js (modified)
```

---

## PR 22: Optimization & Expansion
**Priority**: MEDIUM | **Status**: Not Started  
**Depends On**: PR 21

### Goal
Expand training set to 30 examples, re-compile for 85-90% accuracy, and add more object types.

### Tasks

#### 22.1 Expand Training Set
- [ ] **22.1.1** Add 2 more person variations (sitting, waving)
- [ ] **22.1.2** Add 2 more dog variations (colors, breeds)
- [ ] **22.1.3** Add 2 more car variations (SUV, sports car)
- [ ] **22.1.4** Add 2 tree variations (pine, oak)
- [ ] **22.1.5** Add 2 robot variations (humanoid, industrial)
- [ ] **22.1.6** Add 2 bird variations (flying, standing)
- [ ] **22.1.7** Add 2 dinosaur variations (T-Rex, Brontosaurus)
- [ ] **22.1.8** Add 2 flower variations (daisy, tulip)
- [ ] **22.1.9** Add 1 boat example
- [ ] **22.1.10** Add 1 airplane example
- [ ] **22.1.11** Review all 30 examples for quality
- [ ] **22.1.12** Validate proportions and visual coherence

**Target**: 30 total training examples

#### 22.2 Re-compilation with Expanded Data
- [ ] **22.2.1** Split data: 24 training, 6 test
- [ ] **22.2.2** Run compilation with new dataset
- [ ] **22.2.3** Evaluate on test set (target: 85%+)
- [ ] **22.2.4** If < 85%, tune parameters and retry
- [ ] **22.2.5** Save as `models/complex_v2.pkl`
- [ ] **22.2.6** Compare v2 vs v1 performance
- [ ] **22.2.7** Document improvements

#### 22.3 Production Deployment
- [ ] **22.3.1** Update Flask app to load v2 model
- [ ] **22.3.2** Build new Docker image: `dspy-service:v2`
- [ ] **22.3.3** Deploy to Cloud Run
- [ ] **22.3.4** Run smoke tests
- [ ] **22.3.5** Monitor for errors
- [ ] **22.3.6** Rollback if issues detected

#### 22.4 Real User Feedback Collection
- [ ] **22.4.1** Add thumbs up/down to AI responses
- [ ] **22.4.2** Log feedback to Firestore
- [ ] **22.4.3** Create feedback review dashboard
- [ ] **22.4.4** Identify low-scoring requests
- [ ] **22.4.5** Add failing cases to training set
- [ ] **22.4.6** Plan for monthly re-compilation

#### 22.5 Performance Optimization
- [ ] **22.5.1** Measure average inference time
- [ ] **22.5.2** Add response caching for common requests
- [ ] **22.5.3** Optimize model loading (lazy load if slow)
- [ ] **22.5.4** Test with concurrent requests
- [ ] **22.5.5** Verify scale-to-zero works correctly

#### 22.6 Documentation Updates
- [ ] **22.6.1** Update README with new object types
- [ ] **22.6.2** Add examples of all 15 object types
- [ ] **22.6.3** Document accuracy metrics
- [ ] **22.6.4** Create user-facing guide
- [ ] **22.6.5** Update memory bank with DSPy patterns

#### 22.7 Manual Testing
- [ ] **22.7.1** Test all P0 objects (person, dog, cat, car, house)
- [ ] **22.7.2** Test all P1 objects (tree, robot, bird, dinosaur, flower)
- [ ] **22.7.3** Test all P2 objects (boat, airplane)
- [ ] **22.7.4** Test color overrides
- [ ] **22.7.5** Test size modifications
- [ ] **22.7.6** Test edge cases
- [ ] **22.7.7** Document any failures

**Deliverables**:
- ✅ 30 training examples
- ✅ 85-90% accuracy achieved
- ✅ v2 model deployed
- ✅ Feedback system active
- ✅ Documentation complete
- ✅ All object types tested

---

## Summary

### PR Breakdown

| PR | Goal | Key Deliverables | Estimated Effort |
|----|------|------------------|------------------|
| **PR 20** | Build & Train | DSPy module, 15 examples, 80%+ accuracy | Foundation |
| **PR 21** | Deploy & Integrate | Cloud Run service, Firebase proxy, frontend integration | Integration |
| **PR 22** | Optimize & Expand | 30 examples, 85-90% accuracy, feedback system | Polish |

### Success Metrics

**After PR 20**:
- ✅ DSPy module working locally
- ✅ 80%+ accuracy on 15 examples
- ✅ Unit tests passing

**After PR 21**:
- ✅ Production deployment working
- ✅ "Create a person" works end-to-end
- ✅ Fallback tested
- ✅ No regression on simple requests

**After PR 22**:
- ✅ 85-90% accuracy on 30 examples
- ✅ 15+ object types working
- ✅ User feedback collected
- ✅ Documentation complete

### Object Coverage Roadmap

**Phase 1 (PR 20)**: 5 types
- ✅ Person, Dog, Cat, Car, House

**Phase 2 (PR 22)**: +10 types (15 total)
- ✅ Tree, Robot, Bird, Dinosaur, Flower
- ✅ Boat, Airplane, Bicycle, Snowman, Star

**Phase 3 (Future)**: Unlimited
- 🔮 Any object via learned decomposition
- 🔮 User feedback improves accuracy
- 🔮 Monthly re-compilation with new data

---

## Testing Checklist

### Unit Tests
- [ ] DSPy module instantiation
- [ ] Person decomposition
- [ ] Dog decomposition
- [ ] Proportion checks
- [ ] Color extraction
- [ ] JSON validity

### Integration Tests
- [ ] End-to-end "create a person"
- [ ] End-to-end "make a dog"
- [ ] DSPy service health check
- [ ] Fallback on service failure
- [ ] No regression on simple requests

### Manual Tests
- [ ] All P0 objects working
- [ ] All P1 objects working
- [ ] Color overrides work
- [ ] Size modifications work
- [ ] Shapes sync to other users
- [ ] Fallback triggers correctly

---

## Rollback Plan

### If PR 20 fails:
- No impact on production (local only)
- Review training data quality
- Adjust evaluation metrics
- Retry compilation

### If PR 21 fails:
- Remove complexity classifier (revert AIContext.jsx)
- All requests go to current system
- No user impact

### If PR 22 fails:
- Keep v1 model deployed
- Roll back to previous accuracy level
- Review failing examples

---

## Future Enhancements (Post-Launch)

### V2 Features
- [ ] User feedback loop (learn from ratings)
- [ ] Style variations ("cartoon person")
- [ ] Multi-object scenes ("person next to house")
- [ ] Custom user objects

### V3 Features
- [ ] Image-to-shapes (upload image → extract objects)
- [ ] Animation hints ("person waving" → arm up)
- [ ] Collaborative training (learn from all users)
- [ ] Real-time optimization

---

## Notes

### Key Decisions
1. **No templates**: DSPy learns decomposition, no hardcoded logic
2. **Complex only**: Simple requests use existing system
3. **Scale to zero**: Cloud Run for cost efficiency
4. **Fallback always**: Never break existing functionality

### Simplifications for Quick Implementation
- Start with 15 examples (not 50)
- Target 80% in PR 20, 85-90% in PR 22
- Simple Flask API (no fancy routing)
- Basic evaluation metrics
- Manual testing focus

### Success Criteria
✅ Can create person, dog, cat, car, house  
✅ 85-90% accuracy on test set  
✅ No regression on simple operations  
✅ Fallback works 100% of the time

---

**Status**: Ready to implement  
**Start with**: PR 20 Task 20.1.1  
**Next milestone**: Trained DSPy module with 80%+ accuracy

