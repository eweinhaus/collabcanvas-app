/**
 * Integration tests for Canvas multi-select and copy/paste functionality
 */

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock Konva
jest.mock('react-konva', () => ({
  Stage: ({ children, onClick, onMouseDown, onMouseMove, onMouseUp }) => (
    <div 
      data-testid="konva-stage"
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {children}
    </div>
  ),
  Layer: ({ children }) => <div data-testid="konva-layer">{children}</div>,
  Rect: ({ onClick }) => <div data-testid="konva-rect" onClick={onClick} />,
  Circle: ({ onClick }) => <div data-testid="konva-circle" onClick={onClick} />,
  Text: ({ onClick }) => <div data-testid="konva-text" onClick={onClick} />,
  Transformer: () => <div data-testid="konva-transformer" />,
  Line: ({ onClick }) => <div data-testid="konva-line" onClick={onClick} />,
}));

// Mock firebase
jest.mock('../../../services/firebase', () => ({
  auth: {
    onAuthStateChanged: (callback) => {
      callback({ uid: 'test-user-123' });
      return jest.fn();
    }
  },
  firestore: {},
  realtimeDB: {},
  googleProvider: {},
}));

// Mock hooks
jest.mock('../../../hooks/useRealtimeCursor', () => ({
  useRealtimeCursor: () => ({
    remoteCursors: [],
    publishLocalCursor: jest.fn(),
    clearLocalCursor: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useRealtimePresence', () => ({
  useRealtimePresence: jest.fn(),
}));

import { render, screen, act, fireEvent } from '@testing-library/react';
import { CanvasProvider, useCanvas, useCanvasActions } from '../../../context/CanvasContext';
import Canvas from '../Canvas';
import { useEffect } from 'react';

const TestComponent = ({ stateRef }) => {
  const { state } = useCanvas();
  const actions = useCanvasActions();
  
  useEffect(() => {
    if (stateRef) {
      stateRef.current = { state, actions };
    }
  });
  
  return <Canvas boardId="test-board" />;
};

const renderWithProvider = (component) => {
  return render(<CanvasProvider>{component}</CanvasProvider>);
};

describe('Canvas Multi-Select Integration Tests', () => {
  let mockIdCounter = 0;
  
  beforeEach(() => {
    mockIdCounter = 0;
    // Mock crypto.randomUUID
    global.crypto = {
      ...global.crypto,
      randomUUID: jest.fn(() => {
        mockIdCounter++;
        return `test-id-${mockIdCounter}`;
      }),
    };
  });

  describe('Multi-Select Selection', () => {
    it('should select multiple shapes', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      // Add shapes
      act(() => {
        stateRef.current.actions.addShape({ id: 'shape-1', type: 'rect', x: 0, y: 0 });
        stateRef.current.actions.addShape({ id: 'shape-2', type: 'rect', x: 100, y: 100 });
      });

      // Select multiple shapes
      act(() => {
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2']);
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-1', 'shape-2']);
    });

    it('should show transformer when shapes are selected', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.addShape({ id: 'shape-1', type: 'rect', x: 0, y: 0 });
        stateRef.current.actions.setSelectedIds(['shape-1']);
      });

      // Transformer should be visible
      expect(screen.getByTestId('konva-transformer')).toBeInTheDocument();
    });

    it('should not show transformer when no shapes are selected', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.addShape({ id: 'shape-1', type: 'rect', x: 0, y: 0 });
      });

      // Transformer should not be visible
      expect(screen.queryByTestId('konva-transformer')).not.toBeInTheDocument();
    });
  });

  describe('Copy/Paste Functionality', () => {
    it('should copy and paste a single shape', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      // Add a shape
      act(() => {
        stateRef.current.actions.addShape({ 
          id: 'shape-1', 
          type: 'rect', 
          x: 100, 
          y: 100, 
          width: 50, 
          height: 50,
          fill: '#ff0000'
        });
        stateRef.current.actions.setSelectedIds(['shape-1']);
      });

      // Simulate Cmd+C (copy)
      act(() => {
        fireEvent.keyDown(window, { 
          key: 'c', 
          metaKey: true, 
          code: 'KeyC'
        });
      });

      // Simulate Cmd+V (paste)
      act(() => {
        fireEvent.keyDown(window, { 
          key: 'v', 
          metaKey: true, 
          code: 'KeyV'
        });
      });

      // Should have 2 shapes now
      expect(stateRef.current.state.shapes).toHaveLength(2);
      
      // New shape should be offset
      const newShape = stateRef.current.state.shapes.find(s => s.id !== 'shape-1');
      expect(newShape).toBeDefined();
      expect(newShape.x).toBe(120);
      expect(newShape.y).toBe(120);
      expect(newShape.fill).toBe('#ff0000');
    });

    it('should copy and paste multiple shapes', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      // Add multiple shapes
      act(() => {
        stateRef.current.actions.addShape({ 
          id: 'shape-1', 
          type: 'rect', 
          x: 0, 
          y: 0 
        });
        stateRef.current.actions.addShape({ 
          id: 'shape-2', 
          type: 'circle', 
          x: 100, 
          y: 100 
        });
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2']);
      });

      // Copy
      act(() => {
        fireEvent.keyDown(window, { key: 'c', metaKey: true });
      });

      // Paste
      act(() => {
        fireEvent.keyDown(window, { key: 'v', metaKey: true });
      });

      // Should have 4 shapes now
      expect(stateRef.current.state.shapes).toHaveLength(4);
      
      // New shapes should be selected (the last 2 shapes created)
      expect(stateRef.current.state.selectedIds).toHaveLength(2);
      // Verify they are different from the original shapes
      expect(stateRef.current.state.selectedIds).not.toContain('shape-1');
      expect(stateRef.current.state.selectedIds).not.toContain('shape-2');
    });
  });

  describe('Duplicate Functionality', () => {
    it('should duplicate a single shape with Cmd+D', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.addShape({ 
          id: 'shape-1', 
          type: 'rect', 
          x: 50, 
          y: 50 
        });
        stateRef.current.actions.setSelectedIds(['shape-1']);
      });

      // Simulate Cmd+D (duplicate)
      act(() => {
        fireEvent.keyDown(window, { key: 'd', metaKey: true });
      });

      // Should have 2 shapes
      expect(stateRef.current.state.shapes).toHaveLength(2);
      
      // New shape should be selected (1 new shape)
      expect(stateRef.current.state.selectedIds).toHaveLength(1);
      expect(stateRef.current.state.selectedIds[0]).not.toBe('shape-1');
    });

    it('should duplicate multiple shapes', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.addShape({ id: 'shape-1', type: 'rect', x: 0, y: 0 });
        stateRef.current.actions.addShape({ id: 'shape-2', type: 'rect', x: 100, y: 100 });
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2']);
      });

      act(() => {
        fireEvent.keyDown(window, { key: 'd', metaKey: true });
      });

      expect(stateRef.current.state.shapes).toHaveLength(4);
      // 2 new shapes should be selected
      expect(stateRef.current.state.selectedIds).toHaveLength(2);
      expect(stateRef.current.state.selectedIds).not.toContain('shape-1');
      expect(stateRef.current.state.selectedIds).not.toContain('shape-2');
    });
  });

  describe('Delete Multiple Shapes', () => {
    it('should delete multiple selected shapes', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.addShape({ id: 'shape-1', type: 'rect', x: 0, y: 0 });
        stateRef.current.actions.addShape({ id: 'shape-2', type: 'rect', x: 100, y: 100 });
        stateRef.current.actions.addShape({ id: 'shape-3', type: 'rect', x: 200, y: 200 });
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2']);
      });

      act(() => {
        fireEvent.keyDown(window, { key: 'Delete' });
      });

      expect(stateRef.current.state.shapes).toHaveLength(1);
      expect(stateRef.current.state.shapes[0].id).toBe('shape-3');
    });
  });

  describe('Arrow Key Movement', () => {
    it('should move multiple selected shapes with arrow keys', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.addShape({ id: 'shape-1', type: 'rect', x: 100, y: 100 });
        stateRef.current.actions.addShape({ id: 'shape-2', type: 'rect', x: 200, y: 200 });
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2']);
      });

      // Move right
      act(() => {
        fireEvent.keyDown(window, { key: 'ArrowRight' });
      });

      const shape1 = stateRef.current.state.shapes.find(s => s.id === 'shape-1');
      const shape2 = stateRef.current.state.shapes.find(s => s.id === 'shape-2');
      
      expect(shape1.x).toBe(110); // moved 10px right
      expect(shape2.x).toBe(210); // moved 10px right
    });

    it('should move shapes 1px with Shift + Arrow', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.addShape({ id: 'shape-1', type: 'rect', x: 100, y: 100 });
        stateRef.current.actions.setSelectedIds(['shape-1']);
      });

      act(() => {
        fireEvent.keyDown(window, { key: 'ArrowDown', shiftKey: true });
      });

      const shape1 = stateRef.current.state.shapes.find(s => s.id === 'shape-1');
      expect(shape1.y).toBe(101); // moved 1px down
    });
  });
});

