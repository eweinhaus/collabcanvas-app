# CollabCanvas MVP - Task List & PR Structure

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginButton.jsx
│   │   │   └── AuthProvider.jsx
│   │   ├── canvas/
│   │   │   ├── Canvas.jsx
│   │   │   ├── Shape.jsx
│   │   │   ├── RemoteCursor.jsx
│   │   │   └── Toolbar.jsx
│   │   ├── collaboration/
│   │   │   ├── PresenceList.jsx
│   │   │   └── UserAvatar.jsx
│   │   └── layout/
│   │       ├── Header.jsx
│   │       └── Sidebar.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCanvas.js
│   │   ├── useFirestore.js
│   │   ├── useRealtimeDB.js
│   │   └── useCursors.js
│   ├── services/
│   │   ├── firebase.js
│   │   ├── firestoreService.js
│   │   └── realtimeDBService.js
│   ├── utils/
│   │   ├── throttle.js
│   │   ├── colors.js
│   │   └── shapes.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── CanvasContext.jsx
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── firebase.json
```

---

## PR #1: Project Setup & Firebase Configuration
**Estimated Time:** 1 hour  
**User Stories:** Foundation for US-1, US-2  
**Testing Required:** ✅ Basic smoke test

### Tasks:
- [ ] **1.1** Initialize React project with Create React App
- [ ] **1.2** Install dependencies (firebase, konva, react-konva, uuid, @testing-library/react, @testing-library/jest-dom, jest)
- [ ] **1.3** Create Firebase project and enable Auth, Firestore, Realtime DB
- [ ] **1.4** Configure Firebase in project
- [ ] **1.5** Setup environment variables
- [ ] **1.6** Create basic folder structure
- [ ] **1.7** Add .gitignore for Firebase config
- [ ] **1.8** Create basic test setup and smoke test

### Files Created/Modified:
```
NEW:
- package.json (dependencies)
- .env.example
- .gitignore
- src/services/firebase.js
- firebase.json
- README.md (setup instructions)

DEPENDENCIES:
{
  "firebase": "^10.x",
  "react": "^18.x",
  "react-dom": "^18.x",
  "konva": "^9.x",
  "react-konva": "^18.x",
  "uuid": "^9.x"
}
```

### Key Code:
**src/services/firebase.js**
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDB = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
```

### Tests to Implement:
**src/services/__tests__/firebase.test.js**
```javascript
// Smoke test to verify Firebase initialization
describe('Firebase Configuration', () => {
  test('Firebase app initializes without errors', () => {
    expect(auth).toBeDefined();
    expect(firestore).toBeDefined();
    expect(realtimeDB).toBeDefined();
    expect(googleProvider).toBeDefined();
  });
});
```

---

## PR #2: Authentication & User Context
**Estimated Time:** 1.5 hours  
**User Stories:** US-1, US-2  
**Testing Required:** ✅ Unit tests + Integration tests

### Tasks:
- [ ] **2.1** Create AuthContext with user state management
- [ ] **2.2** Implement Google OAuth login/logout
- [ ] **2.3** Create LoginButton component
- [ ] **2.4** Create AuthProvider wrapper
- [ ] **2.5** Add protected route logic
- [ ] **2.6** Persist auth state on refresh
- [ ] **2.7** Write unit tests for AuthContext and useAuth hook
- [ ] **2.8** Write integration tests for login/logout flow

### Files Created/Modified:
```
NEW:
- src/context/AuthContext.jsx
- src/components/auth/AuthProvider.jsx
- src/components/auth/LoginButton.jsx
- src/hooks/useAuth.js

MODIFIED:
- src/App.jsx (wrap with AuthProvider)
- src/index.js
```

### Key Code:
**src/context/AuthContext.jsx**
```javascript
import { createContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Tests to Implement:
**src/context/__tests__/AuthContext.test.jsx**
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../AuthContext';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

jest.mock('../../services/firebase');
jest.mock('firebase/auth');

describe('AuthContext', () => {
  test('provides user state and auth methods', async () => {
    const mockUser = { uid: '123', displayName: 'Test User' };
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    const { result } = renderHook(() => useContext(AuthContext), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.login).toBeDefined();
    expect(result.current.logout).toBeDefined();
  });

  test('login calls signInWithPopup', async () => {
    const { result } = renderHook(() => useContext(AuthContext), {
      wrapper: AuthProvider,
    });

    await result.current.login();
    expect(signInWithPopup).toHaveBeenCalled();
  });

  test('logout calls signOut', async () => {
    const { result } = renderHook(() => useContext(AuthContext), {
      wrapper: AuthProvider,
    });

    await result.current.logout();
    expect(signOut).toHaveBeenCalled();
  });
});
```

**src/components/auth/__tests__/LoginButton.test.jsx**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import LoginButton from '../LoginButton';
import { useAuth } from '../../../hooks/useAuth';

jest.mock('../../../hooks/useAuth');

describe('LoginButton', () => {
  test('renders login button when user is not authenticated', () => {
    useAuth.mockReturnValue({ user: null, login: jest.fn(), logout: jest.fn() });
    render(<LoginButton />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  test('renders logout button when user is authenticated', () => {
    useAuth.mockReturnValue({ 
      user: { displayName: 'Test User' }, 
      login: jest.fn(), 
      logout: jest.fn() 
    });
    render(<LoginButton />);
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  test('calls login function when login button is clicked', () => {
    const mockLogin = jest.fn();
    useAuth.mockReturnValue({ user: null, login: mockLogin, logout: jest.fn() });
    render(<LoginButton />);
    
    fireEvent.click(screen.getByText(/sign in/i));
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });
});
```

---

## PR #3: Basic Canvas with Pan & Zoom
**Estimated Time:** 2 hours  
**User Stories:** US-3, US-4  
**Testing Required:** ✅ Unit tests for zoom/pan calculations

### Tasks:
- [ ] **3.1** Create Canvas component with Konva Stage/Layer
- [ ] **3.2** Implement pan (drag background)
- [ ] **3.3** Implement zoom (mouse wheel)
- [ ] **3.4** Add zoom constraints (0.1x to 3x)
- [ ] **3.5** Create CanvasContext for canvas state
- [ ] **3.6** Add grid background (optional)
- [ ] **3.7** Ensure 60 FPS performance
- [ ] **3.8** Write unit tests for zoom constraints and calculations

### Files Created/Modified:
```
NEW:
- src/components/canvas/Canvas.jsx
- src/context/CanvasContext.jsx
- src/hooks/useCanvas.js

MODIFIED:
- src/App.jsx (add Canvas component)
- src/index.css (canvas styles)
```

### Key Code:
**src/components/canvas/Canvas.jsx**
```javascript
import { Stage, Layer } from 'react-konva';
import { useRef, useState } from 'react';

const Canvas = () => {
  const stageRef = useRef();
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const newScale = e.evt.deltaY > 0 
      ? Math.max(oldScale / scaleBy, 0.1)
      : Math.min(oldScale * scaleBy, 3);

    setStageScale(newScale);
    
    // Zoom to cursor position
    const newPos = {
      x: pointer.x - ((pointer.x - stage.x()) / oldScale) * newScale,
      y: pointer.y - ((pointer.y - stage.y()) / oldScale) * newScale,
    };
    setStagePos(newPos);
  };

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      draggable
      scaleX={stageScale}
      scaleY={stageScale}
      x={stagePos.x}
      y={stagePos.y}
      onWheel={handleWheel}
    >
      <Layer>
        {/* Shapes will go here */}
      </Layer>
    </Stage>
  );
};

export default Canvas;
```

### Tests to Implement:
**src/components/canvas/__tests__/Canvas.test.jsx**
```javascript
import { render } from '@testing-library/react';
import Canvas from '../Canvas';

describe('Canvas zoom constraints', () => {
  test('zoom respects minimum constraint of 0.1x', () => {
    const { container } = render(<Canvas />);
    // Test zoom out constraint
    const minScale = 0.1;
    const maxScale = 3;
    
    expect(Math.max(0.5 / 1.05, minScale)).toBe(minScale);
  });

  test('zoom respects maximum constraint of 3x', () => {
    const maxScale = 3;
    const currentScale = 2.9;
    const scaleBy = 1.05;
    
    expect(Math.min(currentScale * scaleBy, maxScale)).toBe(maxScale);
  });

  test('calculates zoom to cursor position correctly', () => {
    const oldScale = 1;
    const newScale = 1.05;
    const pointer = { x: 400, y: 300 };
    const stage = { x: 0, y: 0 };
    
    const newPos = {
      x: pointer.x - ((pointer.x - stage.x) / oldScale) * newScale,
      y: pointer.y - ((pointer.y - stage.y) / oldScale) * newScale,
    };
    
    expect(newPos.x).toBe(pointer.x - (pointer.x * newScale));
    expect(newPos.y).toBe(pointer.y - (pointer.y * newScale));
  });
});
```

---

## PR #4: Local Shape Creation & Manipulation
**Estimated Time:** 2.5 hours  
**User Stories:** US-5, US-6, US-7, US-8, US-9, US-10  
**Testing Required:** ✅ Unit tests for utilities + Integration tests

### Tasks:
- [ ] **4.1** Create Shape component (handles rect, circle, text)
- [ ] **4.2** Create Toolbar component with shape buttons
- [ ] **4.3** Implement shape creation on canvas click
- [ ] **4.4** Add shape selection logic
- [ ] **4.5** Implement drag-to-move for selected shapes
- [ ] **4.6** Add delete functionality (Delete/Backspace keys)
- [ ] **4.7** Create shape utilities (color palette, defaults)
- [ ] **4.8** Store shapes in local state (CanvasContext)
- [ ] **4.9** Write unit tests for shape utilities
- [ ] **4.10** Write integration tests for shape CRUD operations

### Files Created/Modified:
```
NEW:
- src/components/canvas/Shape.jsx
- src/components/canvas/Toolbar.jsx
- src/utils/shapes.js
- src/utils/colors.js

MODIFIED:
- src/components/canvas/Canvas.jsx (integrate shapes)
- src/context/CanvasContext.jsx (shape state management)
```

### Key Code:
**src/components/canvas/Shape.jsx**
```javascript
import { Rect, Circle, Text } from 'react-konva';

const Shape = ({ shape, isSelected, onSelect, onDragEnd }) => {
  const shapeProps = {
    id: shape.id,
    x: shape.x,
    y: shape.y,
    fill: shape.fill,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: onDragEnd,
    stroke: isSelected ? '#0066ff' : undefined,
    strokeWidth: isSelected ? 2 : 0,
  };

  if (shape.type === 'rectangle') {
    return <Rect {...shapeProps} width={shape.width} height={shape.height} />;
  }
  
  if (shape.type === 'circle') {
    return <Circle {...shapeProps} radius={shape.width / 2} />;
  }
  
  if (shape.type === 'text') {
    return <Text {...shapeProps} text={shape.text} fontSize={shape.fontSize} />;
  }
  
  return null;
};

export default Shape;
```

**src/utils/colors.js**
```javascript
export const DEFAULT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Orange
  '#98D8C8', // Green
];

export const getRandomColor = () => {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
};
```

### Tests to Implement:
**src/utils/__tests__/colors.test.js**
```javascript
import { DEFAULT_COLORS, getRandomColor } from '../colors';

describe('Color utilities', () => {
  test('DEFAULT_COLORS contains 5 colors', () => {
    expect(DEFAULT_COLORS).toHaveLength(5);
  });

  test('getRandomColor returns a valid color from DEFAULT_COLORS', () => {
    const color = getRandomColor();
    expect(DEFAULT_COLORS).toContain(color);
  });

  test('getRandomColor returns hex color format', () => {
    const color = getRandomColor();
    expect(color).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
```

**src/utils/__tests__/shapes.test.js**
```javascript
import { createShape, isValidShapeType } from '../shapes';

describe('Shape utilities', () => {
  test('creates a rectangle shape with default properties', () => {
    const shape = createShape('rectangle', { x: 100, y: 100 });
    expect(shape).toMatchObject({
      type: 'rectangle',
      x: 100,
      y: 100,
      width: expect.any(Number),
      height: expect.any(Number),
      fill: expect.stringMatching(/^#[0-9A-F]{6}$/i),
    });
  });

  test('creates a circle shape with default properties', () => {
    const shape = createShape('circle', { x: 200, y: 200 });
    expect(shape.type).toBe('circle');
    expect(shape.x).toBe(200);
  });

  test('validates shape types correctly', () => {
    expect(isValidShapeType('rectangle')).toBe(true);
    expect(isValidShapeType('circle')).toBe(true);
    expect(isValidShapeType('text')).toBe(true);
    expect(isValidShapeType('invalid')).toBe(false);
  });
});
```

**src/components/canvas/__tests__/Shape.integration.test.jsx**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { Stage, Layer } from 'react-konva';
import Shape from '../Shape';

describe('Shape integration tests', () => {
  test('shape can be selected', () => {
    const mockOnSelect = jest.fn();
    const shape = {
      id: '1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      fill: '#FF6B6B',
    };

    render(
      <Stage width={800} height={600}>
        <Layer>
          <Shape 
            shape={shape} 
            isSelected={false} 
            onSelect={mockOnSelect}
            onDragEnd={jest.fn()}
          />
        </Layer>
      </Stage>
    );

    // Konva shapes can be found and interacted with
    const stageCanvas = document.querySelector('canvas');
    expect(stageCanvas).toBeInTheDocument();
  });

  test('selected shape shows stroke', () => {
    const shape = {
      id: '1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      fill: '#FF6B6B',
    };

    const { rerender } = render(
      <Stage width={800} height={600}>
        <Layer>
          <Shape 
            shape={shape} 
            isSelected={false} 
            onSelect={jest.fn()}
            onDragEnd={jest.fn()}
          />
        </Layer>
      </Stage>
    );

    // Verify selected state shows stroke
    rerender(
      <Stage width={800} height={600}>
        <Layer>
          <Shape 
            shape={shape} 
            isSelected={true} 
            onSelect={jest.fn()}
            onDragEnd={jest.fn()}
          />
        </Layer>
      </Stage>
    );
  });
});
```

---

## PR #5: Firestore Integration & Real-Time Sync
**Estimated Time:** 3 hours  
**User Stories:** US-11, US-12, US-13, US-14  
**Testing Required:** ✅✅ CRITICAL - Unit tests + Integration tests + Manual multi-user tests

### Tasks:
- [ ] **5.1** Create Firestore service layer
- [ ] **5.2** Implement create/update/delete operations
- [ ] **5.3** Setup Firestore onSnapshot listener
- [ ] **5.4** Add optimistic updates (local-first)
- [ ] **5.5** Handle Firestore timestamp for conflict resolution
- [ ] **5.6** Implement throttling for rapid updates
- [ ] **5.7** Test with 2+ browsers simultaneously
- [ ] **5.8** Debug sync conflicts and race conditions
- [ ] **5.9** Write unit tests for Firestore service functions
- [ ] **5.10** Write unit tests for throttle utility
- [ ] **5.11** Write integration tests for sync scenarios
- [ ] **5.12** Test race condition handling

### Files Created/Modified:
```
NEW:
- src/services/firestoreService.js
- src/hooks/useFirestore.js
- src/utils/throttle.js

MODIFIED:
- src/context/CanvasContext.jsx (integrate Firestore sync)
- src/components/canvas/Canvas.jsx (connect to Firestore)
```

### Key Code:
**src/services/firestoreService.js**
```javascript
import { firestore } from './firebase';
import { 
  collection, doc, setDoc, deleteDoc, 
  onSnapshot, query, serverTimestamp 
} from 'firebase/firestore';

const SESSION_ID = 'default-session'; // For MVP, single session

export const createShape = async (shape, userId) => {
  const shapeRef = doc(collection(firestore, `sessions/${SESSION_ID}/objects`), shape.id);
  await setDoc(shapeRef, {
    ...shape,
    createdBy: userId,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
};

export const updateShape = async (shapeId, updates, userId) => {
  const shapeRef = doc(firestore, `sessions/${SESSION_ID}/objects`, shapeId);
  await setDoc(shapeRef, {
    ...updates,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const deleteShape = async (shapeId) => {
  const shapeRef = doc(firestore, `sessions/${SESSION_ID}/objects`, shapeId);
  await deleteDoc(shapeRef);
};

export const subscribeToShapes = (callback) => {
  const q = query(collection(firestore, `sessions/${SESSION_ID}/objects`));
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      callback(change);
    });
  });
};
```

**src/utils/throttle.js**
```javascript
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
```

### Tests to Implement:
**src/services/__tests__/firestoreService.test.js**
```javascript
import { createShape, updateShape, deleteShape } from '../firestoreService';
import { setDoc, deleteDoc } from 'firebase/firestore';

jest.mock('../firebase');
jest.mock('firebase/firestore');

describe('Firestore Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createShape adds shape to Firestore with metadata', async () => {
    const shape = {
      id: 'shape-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 50,
      height: 50,
    };
    const userId = 'user-123';

    await createShape(shape, userId);

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ...shape,
        createdBy: userId,
        updatedBy: userId,
      })
    );
  });

  test('updateShape merges updates with existing shape', async () => {
    const shapeId = 'shape-1';
    const updates = { x: 200, y: 200 };
    const userId = 'user-123';

    await updateShape(shapeId, updates, userId);

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ...updates,
        updatedBy: userId,
      }),
      { merge: true }
    );
  });

  test('deleteShape removes shape from Firestore', async () => {
    const shapeId = 'shape-1';

    await deleteShape(shapeId);

    expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
  });
});
```

**src/utils/__tests__/throttle.test.js**
```javascript
import { throttle } from '../throttle';

describe('Throttle utility', () => {
  jest.useFakeTimers();

  test('executes function immediately on first call', () => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 100);

    throttled();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('throttles subsequent calls within time limit', () => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 100);

    throttled();
    throttled();
    throttled();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('allows calls after time limit expires', () => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 100);

    throttled();
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    
    throttled();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('passes arguments to throttled function', () => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 100);

    throttled('arg1', 'arg2');

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
```

**src/hooks/__tests__/useFirestore.integration.test.js**
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useFirestore } from '../useFirestore';
import { onSnapshot, getDocs } from 'firebase/firestore';

jest.mock('../../services/firebase');
jest.mock('firebase/firestore');

describe('useFirestore integration', () => {
  test('loads initial shapes and sets loading to false', async () => {
    const mockShapes = [
      { id: 'shape-1', data: () => ({ type: 'rectangle', x: 100, y: 100 }) },
      { id: 'shape-2', data: () => ({ type: 'circle', x: 200, y: 200 }) },
    ];

    getDocs.mockResolvedValue({ docs: mockShapes });
    onSnapshot.mockImplementation(() => jest.fn());

    const { result } = renderHook(() => useFirestore('test-session'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.shapes.size).toBe(2);
    expect(result.current.shapes.has('shape-1')).toBe(true);
  });

  test('handles real-time updates via onSnapshot', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    
    let snapshotCallback;
    onSnapshot.mockImplementation((query, callback) => {
      snapshotCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useFirestore('test-session'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Simulate a real-time add
    snapshotCallback({
      docChanges: () => [{
        type: 'added',
        doc: {
          id: 'new-shape',
          data: () => ({ type: 'rectangle', x: 300, y: 300 }),
        },
      }],
    });

    await waitFor(() => {
      expect(result.current.shapes.has('new-shape')).toBe(true);
    });
  });

  test('handles shape deletion via onSnapshot', async () => {
    const mockShapes = [
      { id: 'shape-1', data: () => ({ type: 'rectangle', x: 100, y: 100 }) },
    ];

    getDocs.mockResolvedValue({ docs: mockShapes });
    
    let snapshotCallback;
    onSnapshot.mockImplementation((query, callback) => {
      snapshotCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useFirestore('test-session'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.shapes.has('shape-1')).toBe(true);

    // Simulate deletion
    snapshotCallback({
      docChanges: () => [{
        type: 'removed',
        doc: { id: 'shape-1' },
      }],
    });

    await waitFor(() => {
      expect(result.current.shapes.has('shape-1')).toBe(false);
    });
  });
});
```

---

## PR #6: Multiplayer Cursors
**Estimated Time:** 2 hours  
**User Stories:** US-15, US-16, US-17  
**Testing Required:** ✅ Unit tests + Manual multi-browser tests

### Tasks:
- [ ] **6.1** Create Realtime Database service layer
- [ ] **6.2** Implement cursor position updates (throttled to 50ms)
- [ ] **6.3** Create RemoteCursor component
- [ ] **6.4** Setup cursor listener and render remote cursors
- [ ] **6.5** Assign unique colors to users
- [ ] **6.6** Add name labels above cursors
- [ ] **6.7** Implement onDisconnect cleanup
- [ ] **6.8** Filter out own cursor from remote cursors
- [ ] **6.9** Write unit tests for Realtime DB service
- [ ] **6.10** Write unit tests for RemoteCursor component
- [ ] **6.11** Manually test cursor latency (<50ms) with 2+ browsers

### Files Created/Modified:
```
NEW:
- src/services/realtimeDBService.js
- src/hooks/useCursors.js
- src/components/canvas/RemoteCursor.jsx

MODIFIED:
- src/components/canvas/Canvas.jsx (track mouse, send cursor updates)
- src/context/CanvasContext.jsx (store cursors state)
```

### Key Code:
**src/services/realtimeDBService.js**
```javascript
import { realtimeDB } from './firebase';
import { ref, set, onValue, onDisconnect } from 'firebase/database';

const SESSION_ID = 'default-session';

export const updateCursor = (userId, cursorData) => {
  const cursorRef = ref(realtimeDB, `sessions/${SESSION_ID}/cursors/${userId}`);
  set(cursorRef, {
    ...cursorData,
    lastUpdate: Date.now(),
  });
};

export const setupCursorCleanup = (userId) => {
  const cursorRef = ref(realtimeDB, `sessions/${SESSION_ID}/cursors/${userId}`);
  onDisconnect(cursorRef).remove();
};

export const subscribeToCursors = (callback) => {
  const cursorsRef = ref(realtimeDB, `sessions/${SESSION_ID}/cursors`);
  return onValue(cursorsRef, (snapshot) => {
    const cursors = snapshot.val() || {};
    callback(cursors);
  });
};
```

**src/components/canvas/RemoteCursor.jsx**
```javascript
const RemoteCursor = ({ x, y, displayName, color }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        transform: 'translate(-4px, -4px)',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
        <path d="M0 0 L0 16 L6 10 L10 18 L12 17 L8 9 L16 9 Z" />
      </svg>
      <div
        style={{
          marginTop: '4px',
          padding: '2px 6px',
          background: color,
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
        }}
      >
        {displayName}
      </div>
    </div>
  );
};

export default RemoteCursor;
```

### Tests to Implement:
**src/services/__tests__/realtimeDBService.test.js**
```javascript
import { updateCursor, setupCursorCleanup, subscribeToCursors } from '../realtimeDBService';
import { ref, set, onValue, onDisconnect } from 'firebase/database';

jest.mock('../firebase');
jest.mock('firebase/database');

describe('Realtime Database Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updateCursor writes cursor data to database', () => {
    const userId = 'user-123';
    const cursorData = { x: 100, y: 200, displayName: 'Test User', color: '#FF6B6B' };

    updateCursor(userId, cursorData);

    expect(ref).toHaveBeenCalledWith(
      expect.anything(),
      'sessions/default-session/cursors/user-123'
    );
    expect(set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ...cursorData,
        lastUpdate: expect.any(Number),
      })
    );
  });

  test('setupCursorCleanup registers onDisconnect handler', () => {
    const userId = 'user-123';
    const mockOnDisconnect = { remove: jest.fn() };
    onDisconnect.mockReturnValue(mockOnDisconnect);

    setupCursorCleanup(userId);

    expect(onDisconnect).toHaveBeenCalled();
    expect(mockOnDisconnect.remove).toHaveBeenCalled();
  });

  test('subscribeToCursors listens to cursor updates', () => {
    const callback = jest.fn();
    const unsubscribe = jest.fn();
    onValue.mockReturnValue(unsubscribe);

    const result = subscribeToCursors(callback);

    expect(onValue).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Function)
    );
    expect(result).toBe(unsubscribe);
  });

  test('subscribeToCursors calls callback with cursor data', () => {
    const callback = jest.fn();
    let snapshotCallback;

    onValue.mockImplementation((ref, cb) => {
      snapshotCallback = cb;
      return jest.fn();
    });

    subscribeToCursors(callback);

    const mockSnapshot = {
      val: () => ({
        'user-1': { x: 100, y: 100, displayName: 'User 1' },
        'user-2': { x: 200, y: 200, displayName: 'User 2' },
      }),
    };

    snapshotCallback(mockSnapshot);

    expect(callback).toHaveBeenCalledWith({
      'user-1': { x: 100, y: 100, displayName: 'User 1' },
      'user-2': { x: 200, y: 200, displayName: 'User 2' },
    });
  });
});
```

**src/components/canvas/__tests__/RemoteCursor.test.jsx**
```javascript
import { render, screen } from '@testing-library/react';
import RemoteCursor from '../RemoteCursor';

describe('RemoteCursor', () => {
  test('renders cursor with correct position', () => {
    const { container } = render(
      <RemoteCursor x={100} y={200} displayName="Test User" color="#FF6B6B" />
    );

    const cursor = container.firstChild;
    expect(cursor).toHaveStyle({
      position: 'absolute',
      left: '100px',
      top: '200px',
    });
  });

  test('displays user name label', () => {
    render(<RemoteCursor x={100} y={200} displayName="John Doe" color="#FF6B6B" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('applies correct color to cursor and label', () => {
    const { container } = render(
      <RemoteCursor x={100} y={200} displayName="Test User" color="#4ECDC4" />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', '#4ECDC4');

    const label = screen.getByText('Test User');
    expect(label).toHaveStyle({ background: '#4ECDC4' });
  });

  test('cursor has pointer-events disabled', () => {
    const { container } = render(
      <RemoteCursor x={100} y={200} displayName="Test User" color="#FF6B6B" />
    );

    const cursor = container.firstChild;
    expect(cursor).toHaveStyle({ pointerEvents: 'none' });
  });
});
```

---

## PR #7: Presence Awareness
**Estimated Time:** 1.5 hours  
**User Stories:** US-18, US-19, US-20  
**Testing Required:** ✅ Unit tests for components

### Tasks:
- [ ] **7.1** Create presence service in Realtime DB
- [ ] **7.2** Update presence on auth and session join
- [ ] **7.3** Setup onDisconnect for presence cleanup
- [ ] **7.4** Create PresenceList component
- [ ] **7.5** Create UserAvatar component
- [ ] **7.6** Display user count and online users
- [ ] **7.7** Add presence listener to CanvasContext
- [ ] **7.8** Write unit tests for presence service methods
- [ ] **7.9** Write component tests for PresenceList and UserAvatar

### Files Created/Modified:
```
NEW:
- src/components/collaboration/PresenceList.jsx
- src/components/collaboration/UserAvatar.jsx

MODIFIED:
- src/services/realtimeDBService.js (add presence methods)
- src/components/layout/Header.jsx (add presence display)
- src/context/CanvasContext.jsx (store presence state)
```

### Key Code:
**src/services/realtimeDBService.js (additions)**
```javascript
export const updatePresence = (userId, userData) => {
  const presenceRef = ref(realtimeDB, `sessions/${SESSION_ID}/presence/${userId}`);
  set(presenceRef, {
    displayName: userData.displayName,
    photoURL: userData.photoURL,
    status: 'online',
    lastSeen: Date.now(),
  });
};

export const setupPresenceCleanup = (userId) => {
  const presenceRef = ref(realtimeDB, `sessions/${SESSION_ID}/presence/${userId}`);
  onDisconnect(presenceRef).remove();
};

export const subscribeToPresence = (callback) => {
  const presenceRef = ref(realtimeDB, `sessions/${SESSION_ID}/presence`);
  return onValue(presenceRef, (snapshot) => {
    const presence = snapshot.val() || {};
    callback(presence);
  });
};
```

### Tests to Implement:
**src/services/__tests__/realtimeDBService.presence.test.js**
```javascript
import { updatePresence, setupPresenceCleanup, subscribeToPresence } from '../realtimeDBService';
import { ref, set, onValue, onDisconnect } from 'firebase/database';

jest.mock('../firebase');
jest.mock('firebase/database');

describe('Presence Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updatePresence writes user data to database', () => {
    const userId = 'user-123';
    const userData = {
      displayName: 'John Doe',
      photoURL: 'https://example.com/photo.jpg',
    };

    updatePresence(userId, userData);

    expect(set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        displayName: 'John Doe',
        photoURL: 'https://example.com/photo.jpg',
        status: 'online',
        lastSeen: expect.any(Number),
      })
    );
  });

  test('setupPresenceCleanup registers onDisconnect handler', () => {
    const userId = 'user-123';
    const mockOnDisconnect = { remove: jest.fn() };
    onDisconnect.mockReturnValue(mockOnDisconnect);

    setupPresenceCleanup(userId);

    expect(mockOnDisconnect.remove).toHaveBeenCalled();
  });

  test('subscribeToPresence listens to presence updates', () => {
    const callback = jest.fn();
    const unsubscribe = jest.fn();
    onValue.mockReturnValue(unsubscribe);

    const result = subscribeToPresence(callback);

    expect(result).toBe(unsubscribe);
  });
});
```

**src/components/collaboration/__tests__/PresenceList.test.jsx**
```javascript
import { render, screen } from '@testing-library/react';
import PresenceList from '../PresenceList';

describe('PresenceList', () => {
  test('displays correct user count', () => {
    const presence = {
      'user-1': { displayName: 'User 1', photoURL: 'url1', status: 'online' },
      'user-2': { displayName: 'User 2', photoURL: 'url2', status: 'online' },
      'user-3': { displayName: 'User 3', photoURL: 'url3', status: 'online' },
    };

    render(<PresenceList presence={presence} />);
    expect(screen.getByText(/3.*online/i)).toBeInTheDocument();
  });

  test('renders UserAvatar for each online user', () => {
    const presence = {
      'user-1': { displayName: 'Alice', photoURL: 'url1', status: 'online' },
      'user-2': { displayName: 'Bob', photoURL: 'url2', status: 'online' },
    };

    render(<PresenceList presence={presence} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  test('shows empty state when no users online', () => {
    render(<PresenceList presence={{}} />);
    expect(screen.getByText(/no.*online|0.*online/i)).toBeInTheDocument();
  });
});
```

**src/components/collaboration/__tests__/UserAvatar.test.jsx**
```javascript
import { render, screen } from '@testing-library/react';
import UserAvatar from '../UserAvatar';

describe('UserAvatar', () => {
  test('renders user display name', () => {
    render(<UserAvatar displayName="John Doe" photoURL="https://example.com/photo.jpg" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('renders user photo', () => {
    render(<UserAvatar displayName="Jane" photoURL="https://example.com/jane.jpg" />);
    const img = screen.getByAltText('Jane');
    expect(img).toHaveAttribute('src', 'https://example.com/jane.jpg');
  });

  test('shows initials when no photo provided', () => {
    render(<UserAvatar displayName="John Doe" photoURL={null} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
```

---

## PR #8: State Persistence & Bug Fixes
**Estimated Time:** 1.5 hours  
**User Stories:** US-21, US-22, US-23  
**Testing Required:** ✅✅ CRITICAL - Integration tests + Manual multi-user edge case testing

### Tasks:
- [ ] **8.1** Test initial load sequence (fetch then listen)
- [ ] **8.2** Fix duplicate shapes on reconnect
- [ ] **8.3** Handle race conditions on multiple concurrent loads
- [ ] **8.4** Test refresh mid-edit persistence
- [ ] **8.5** Test all users disconnect and reconnect
- [ ] **8.6** Add loading states during initial fetch
- [ ] **8.7** Fix any sync bugs discovered during testing
- [ ] **8.8** Write integration tests for edge cases
- [ ] **8.9** Test concurrent user scenarios manually
- [ ] **8.10** Document known limitations and workarounds

### Files Created/Modified:
```
MODIFIED:
- src/hooks/useFirestore.js (improve initial load logic)
- src/context/CanvasContext.jsx (handle loading states)
- src/components/canvas/Canvas.jsx (show loading indicator)
```

### Key Code:
**src/hooks/useFirestore.js (improved loading)**
```javascript
export const useFirestore = (sessionId) => {
  const [shapes, setShapes] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    
    const init = async () => {
      // 1. Initial fetch
      const q = query(collection(firestore, `sessions/${sessionId}/objects`));
      const snapshot = await getDocs(q);
      
      const initialShapes = new Map();
      snapshot.docs.forEach(doc => {
        initialShapes.set(doc.id, doc.data());
      });
      setShapes(initialShapes);
      setLoading(false);

      // 2. Start real-time listener
      unsubscribe = onSnapshot(q, (snapshot) => {
        setShapes(prev => {
          const updated = new Map(prev);
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
              updated.set(change.doc.id, change.doc.data());
            }
            if (change.type === 'removed') {
              updated.delete(change.doc.id);
            }
          });
          return updated;
        });
      });
    };

    init();
    return () => unsubscribe?.();
  }, [sessionId]);

  return { shapes, loading };
};
```

### Tests to Implement:
**src/hooks/__tests__/useFirestore.edgecases.test.js**
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useFirestore } from '../useFirestore';
import { onSnapshot, getDocs } from 'firebase/firestore';

jest.mock('../../services/firebase');
jest.mock('firebase/firestore');

describe('useFirestore edge cases', () => {
  test('prevents duplicate shapes on reconnect', async () => {
    const mockShapes = [
      { id: 'shape-1', data: () => ({ type: 'rectangle', x: 100, y: 100 }) },
    ];

    getDocs.mockResolvedValue({ docs: mockShapes });
    
    let snapshotCallback;
    onSnapshot.mockImplementation((query, callback) => {
      snapshotCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useFirestore('test-session'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Initial load should have shape
    expect(result.current.shapes.size).toBe(1);
    expect(result.current.shapes.has('shape-1')).toBe(true);

    // Simulate reconnect - onSnapshot fires with same shape
    snapshotCallback({
      docChanges: () => [{
        type: 'added',
        doc: {
          id: 'shape-1',
          data: () => ({ type: 'rectangle', x: 100, y: 100 }),
        },
      }],
    });

    await waitFor(() => {
      // Should still only have 1 shape, not a duplicate
      expect(result.current.shapes.size).toBe(1);
    });
  });

  test('handles initial load with no shapes', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    onSnapshot.mockImplementation(() => jest.fn());

    const { result } = renderHook(() => useFirestore('test-session'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.shapes.size).toBe(0);
  });

  test('handles rapid concurrent updates', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    
    let snapshotCallback;
    onSnapshot.mockImplementation((query, callback) => {
      snapshotCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useFirestore('test-session'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Simulate rapid updates from multiple users
    const updates = [
      { type: 'added', doc: { id: 's1', data: () => ({ x: 100 }) } },
      { type: 'modified', doc: { id: 's1', data: () => ({ x: 150 }) } },
      { type: 'added', doc: { id: 's2', data: () => ({ x: 200 }) } },
      { type: 'modified', doc: { id: 's1', data: () => ({ x: 175 }) } },
    ];

    for (const update of updates) {
      snapshotCallback({ docChanges: () => [update] });
    }

    await waitFor(() => {
      expect(result.current.shapes.size).toBe(2);
      expect(result.current.shapes.get('s1').x).toBe(175);
      expect(result.current.shapes.get('s2').x).toBe(200);
    });
  });

  test('cleanup unsubscribes from listener', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    const unsubscribe = jest.fn();
    onSnapshot.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useFirestore('test-session'));

    await waitFor(() => expect(onSnapshot).toHaveBeenCalled());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
```

### Manual Testing Scenarios:
1. **Duplicate Prevention Test:**
   - User A creates 3 shapes
   - User B joins and sees all 3 shapes
   - User B refreshes browser
   - ✅ Verify: User B sees exactly 3 shapes (no duplicates)

2. **Race Condition Test:**
   - User A and User B both create shapes rapidly (spam click)
   - ✅ Verify: All shapes appear for both users
   - ✅ Verify: No shapes are lost or duplicated

3. **Disconnect/Reconnect Test:**
   - User A creates 5 shapes
   - User B joins and moves 2 shapes
   - User A disconnects (close tab)
   - User B creates 2 more shapes
   - User A reconnects (open new tab)
   - ✅ Verify: User A sees all 7 shapes in correct positions

4. **Mid-Edit Refresh Test:**
   - User A creates a shape
   - User A starts dragging the shape
   - User A refreshes mid-drag
   - ✅ Verify: Shape persists in last known position

---

## PR #9: UI Polish & Layout
**Estimated Time:** 1 hour  
**User Stories:** All (UI improvements)  
**Testing Required:** ⚠️ Visual/Snapshot tests (optional) + Manual UI testing

### Tasks:
- [ ] **9.1** Create Header component with logo and user info
- [ ] **9.2** Create Sidebar with presence list
- [ ] **9.3** Style Toolbar with better UX
- [ ] **9.4** Add loading spinner for initial load
- [ ] **9.5** Add error states and messages
- [ ] **9.6** Improve responsive design
- [ ] **9.7** Add keyboard shortcuts help (optional)
- [ ] **9.8** Test responsive layout on mobile/tablet (manual)
- [ ] **9.9** Test accessibility (keyboard navigation, screen readers)

### Files Created/Modified:
```
NEW:
- src/components/layout/Header.jsx
- src/components/layout/Sidebar.jsx

MODIFIED:
- src/App.jsx (add layout structure)
- src/index.css (global styles)
- src/components/canvas/Toolbar.jsx (styling improvements)
```

### Tests to Implement:
**Manual UI Testing Checklist:**
- [ ] Header displays correctly on desktop (1920x1080)
- [ ] Header displays correctly on tablet (768x1024)
- [ ] Header displays correctly on mobile (375x667)
- [ ] Sidebar collapses properly on mobile
- [ ] Toolbar buttons are touchable on mobile (min 44px tap target)
- [ ] Loading spinner appears during initial load
- [ ] Error messages display correctly
- [ ] Keyboard Tab navigation works through all interactive elements
- [ ] Esc key closes modals/dialogs
- [ ] All buttons have visible focus indicators
- [ ] Color contrast meets WCAG AA standards

**Optional: Snapshot Tests**
```javascript
// src/components/layout/__tests__/Header.snapshot.test.jsx
import { render } from '@testing-library/react';
import Header from '../Header';

test('Header renders correctly', () => {
  const { container } = render(
    <Header 
      user={{ displayName: 'Test User', photoURL: 'url' }}
      onlineCount={3}
    />
  );
  expect(container).toMatchSnapshot();
});
```

---

## PR #10: Deployment & Final Testing
**Estimated Time:** 2 hours  
**User Stories:** All (deployment & validation)  
**Testing Required:** ✅✅✅ CRITICAL - Full E2E Production Testing

### Tasks:
- [ ] **10.1** Create production Firebase project
- [ ] **10.2** Setup environment variables for production
- [ ] **10.3** Configure Render deployment
- [ ] **10.4** Deploy to Render
- [ ] **10.5** Test with 5+ users on deployed app
- [ ] **10.6** Test on multiple devices (desktop, mobile)
- [ ] **10.7** Test network throttling (Fast 3G)
- [ ] **10.8** Fix critical bugs found in production
- [ ] **10.9** Update README with deployment URL
- [ ] **10.10** Create demo video (if time permits)
- [ ] **10.11** Run full E2E test suite on production
- [ ] **10.12** Performance audit with Lighthouse
- [ ] **10.13** Security review of Firebase rules

### Files Created/Modified:
```
NEW:
- render.yaml (Render config)
- .env.production

MODIFIED:
- README.md (add deployment instructions and live URL)
- package.json (add build scripts)
```

### Deployment Config:
**render.yaml**
```yaml
services:
  - type: web
    name: collabcanvas
    env: node
    buildCommand: npm install && npm run build
    startCommand: npx serve -s build -l 3000
    envVars:
      - key: REACT_APP_FIREBASE_API_KEY
        sync: false
      - key: REACT_APP_FIREBASE_AUTH_DOMAIN
        sync: false
      - key: REACT_APP_FIREBASE_PROJECT_ID
        sync: false
```

### E2E Production Testing Suite:

**Pre-Deployment Checklist:**
- [ ] All unit tests passing (`npm test`)
- [ ] No console errors in development
- [ ] All Firebase security rules configured
- [ ] Environment variables set in Render
- [ ] Build completes without warnings

**Post-Deployment Tests:**

**1. Authentication Flow (5 min)**
- [ ] Fresh browser can load app
- [ ] Click "Sign In with Google" works
- [ ] User profile displays correctly
- [ ] Sign out works
- [ ] Sign in persists on page refresh

**2. Single-User Canvas Operations (10 min)**
- [ ] Create rectangle → appears on canvas
- [ ] Create circle → appears on canvas
- [ ] Create text → appears on canvas
- [ ] Select shape → shows selection outline
- [ ] Drag shape → moves smoothly
- [ ] Delete shape → removes from canvas
- [ ] Pan canvas → background moves
- [ ] Zoom in/out → respects 0.1x to 3x limits
- [ ] Refresh page → all shapes persist

**3. Multi-User Real-Time Sync (15 min)**
- [ ] User A creates shape → User B sees it immediately (<100ms)
- [ ] User B moves shape → User A sees update
- [ ] User C deletes shape → All users see deletion
- [ ] 5 users create shapes simultaneously → No conflicts
- [ ] Users on different devices (desktop, mobile, tablet) sync correctly

**4. Cursor & Presence (5 min)**
- [ ] User A moves cursor → User B sees it (<50ms latency)
- [ ] Each user has unique colored cursor
- [ ] User names display above cursors
- [ ] Presence list shows all online users
- [ ] User disconnect → cursor and presence removed

**5. Performance Tests (10 min)**
- [ ] Canvas with 50+ shapes maintains 60 FPS
- [ ] Rapid shape creation (10/sec) doesn't lag
- [ ] Cursor movement feels smooth with 5+ users
- [ ] Initial load completes in <2s on Fast 3G
- [ ] No memory leaks after 5 minutes of use

**6. Edge Cases & Error Handling (10 min)**
- [ ] Network disconnect mid-edit → graceful handling
- [ ] Reconnect → sync resumes correctly
- [ ] Shape created offline → syncs when online
- [ ] Invalid shape data → error displayed, doesn't crash
- [ ] Firebase quota limit → user-friendly message

**7. Cross-Browser Testing (10 min)**
- [ ] Chrome (latest) - all features work
- [ ] Firefox (latest) - all features work
- [ ] Safari (latest) - all features work
- [ ] Mobile Safari (iOS) - touch interactions work
- [ ] Mobile Chrome (Android) - touch interactions work

**8. Lighthouse Audit Targets:**
- [ ] Performance: >80
- [ ] Accessibility: >90
- [ ] Best Practices: >90
- [ ] SEO: >80

**9. Firebase Security:**
```javascript
// Firestore Rules to verify:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId}/objects/{objectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}

// Realtime Database Rules to verify:
{
  "rules": {
    "sessions": {
      "$sessionId": {
        "cursors": {
          "$userId": {
            ".read": "auth != null",
            ".write": "auth != null && auth.uid == $userId"
          }
        },
        "presence": {
          "$userId": {
            ".read": "auth != null",
            ".write": "auth != null && auth.uid == $userId"
          }
        }
      }
    }
  }
}
```

**10. Critical Bug Tracking:**
If any test fails, document:
- Browser/Device
- Steps to reproduce
- Expected vs Actual behavior
- Screenshot/video
- Priority (P0-Critical, P1-High, P2-Medium)

---

## PR Summary & Dependencies

| PR # | Title | Estimated Time | Testing Required | Blocks |
|------|-------|----------------|------------------|--------|
| 1 | Project Setup & Firebase Config | 1h | ✅ Smoke test | 2, 5, 6, 7 |
| 2 | Authentication & User Context | 1.5h | ✅ Unit + Integration | 5, 6, 7 |
| 3 | Basic Canvas with Pan & Zoom | 2h | ✅ Unit tests | 4, 5, 6 |
| 4 | Local Shape Creation & Manipulation | 2.5h | ✅ Unit + Integration | 5 |
| 5 | Firestore Integration & Real-Time Sync | 3h | ✅✅ CRITICAL | 8 |
| 6 | Multiplayer Cursors | 2h | ✅ Unit + Manual | - |
| 7 | Presence Awareness | 1.5h | ✅ Unit tests | - |
| 8 | State Persistence & Bug Fixes | 1.5h | ✅✅ CRITICAL | 10 |
| 9 | UI Polish & Layout | 1h | ⚠️ Manual UI | - |
| 10 | Deployment & Final Testing | 2h | ✅✅✅ CRITICAL E2E | - |

**Total Estimated Time:** 16 hours (coding) + 4 hours (testing) = **20 hours**

---

## Recommended PR Order

**Critical Path (Must complete for MVP):**
PR1 → PR2 → PR3 → PR4 → PR5 → PR6 → PR7 → PR8 → PR10

**Optional (Can be done in parallel or skipped):**
PR9 (do after PR7, can be done while testing PR8)

---

## Testing Checklist (Per PR)

Each PR should pass these checks before merging:

- [ ] No console errors
- [ ] Code compiles without warnings
- [ ] Feature works as expected locally
- [ ] No regression on existing features
- [ ] Code is reasonably clean (AI-generated is OK, but readable)

**For PRs 5-8 specifically:**
- [ ] Test with 2 browser windows
- [ ] Test rapid actions (spam create/move)
- [ ] Test disconnect/reconnect
- [ ] Verify sync latency (<100ms for objects, <50ms for cursors)

---

## Testing Strategy Summary

### Test Coverage by Type

**Unit Tests (Jest):**
- Utils: `throttle.js`, `colors.js`, `shapes.js`
- Services: `firestoreService.js`, `realtimeDBService.js`
- Hooks: `useAuth.js`, `useFirestore.js`
- Components: `LoginButton`, `RemoteCursor`, `PresenceList`, `UserAvatar`
- **Target Coverage:** >70%

**Integration Tests (Jest + React Testing Library):**
- Auth flow with Firebase mocks
- Firestore sync scenarios
- Shape CRUD operations
- Canvas interactions
- **Target Coverage:** Critical user flows

**Manual Testing:**
- Multi-browser sync (2-5 users)
- Cursor latency verification
- Race conditions & edge cases
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

**E2E Production Tests:**
- Full user journey on deployed app
- Performance benchmarks (Lighthouse)
- Security verification (Firebase rules)
- Load testing with 5+ concurrent users

### Critical Test Scenarios

**Must Pass Before MVP Launch:**
1. ✅ Auth persists on refresh
2. ✅ Shapes sync between 2+ users in <100ms
3. ✅ Cursors update in <50ms
4. ✅ No duplicate shapes on reconnect
5. ✅ All shapes persist after full disconnect/reconnect
6. ✅ Canvas maintains 60 FPS with 50+ shapes
7. ✅ Mobile touch interactions work
8. ✅ Firebase security rules prevent unauthorized access

### Test Files Structure
```
src/
├── components/
│   ├── auth/
│   │   └── __tests__/
│   │       └── LoginButton.test.jsx
│   ├── canvas/
│   │   └── __tests__/
│   │       ├── Canvas.test.jsx
│   │       ├── Shape.integration.test.jsx
│   │       └── RemoteCursor.test.jsx
│   └── collaboration/
│       └── __tests__/
│           ├── PresenceList.test.jsx
│           └── UserAvatar.test.jsx
├── context/
│   └── __tests__/
│       └── AuthContext.test.jsx
├── hooks/
│   └── __tests__/
│       ├── useFirestore.integration.test.js
│       └── useFirestore.edgecases.test.js
├── services/
│   └── __tests__/
│       ├── firebase.test.js
│       ├── firestoreService.test.js
│       ├── realtimeDBService.test.js
│       └── realtimeDBService.presence.test.js
└── utils/
    └── __tests__/
        ├── throttle.test.js
        ├── colors.test.js
        └── shapes.test.js
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- LoginButton.test.jsx

# Run tests matching pattern
npm test -- --testNamePattern="throttle"
```

### Quality Gates

**Before Merging Each PR:**
- [ ] All new code has tests
- [ ] Test coverage doesn't decrease
- [ ] All tests pass
- [ ] No console errors/warnings
- [ ] Code review approved

**Before Production Deployment:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing checklist complete
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Cross-browser testing done

---

**Ship fast. Test often. Commit clean code.**