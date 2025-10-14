/**
 * Integration tests for Canvas Context and Toolbar
 * Tests state management and tool selection
 */

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock Konva to avoid rendering issues in tests
jest.mock('react-konva', () => ({
  Stage: ({ children }) => <div data-testid="konva-stage">{children}</div>,
  Layer: ({ children }) => <div data-testid="konva-layer">{children}</div>,
  Rect: () => <div data-testid="konva-rect" />,
  Circle: () => <div data-testid="konva-circle" />,
  Text: () => <div data-testid="konva-text" />,
  Transformer: () => <div data-testid="konva-transformer" />,
  Line: () => <div data-testid="konva-line" />,
}));

// Mock firebase config to avoid import.meta.env in tests
jest.mock('../../../services/firebase', () => ({
  auth: {
    onAuthStateChanged: (callback) => {
      // Immediately call with a mock user to simulate authenticated state
      callback({ uid: 'test-user-123' });
      return jest.fn(); // Return unsubscribe function
    }
  },
  firestore: {},
  realtimeDB: {},
  googleProvider: {},
}));

// Mock hooks that require AuthProvider
jest.mock('../../../hooks/useRealtimeCursor', () => ({
  useRealtimeCursor: () => ({
    remoteCursors: [],
    publishLocalCursor: () => {},
    clearLocalCursor: () => {},
  }),
}));

jest.mock('../../../hooks/useRealtimePresence', () => ({
  useRealtimePresence: () => {},
}));

import { render, screen, fireEvent, act } from '@testing-library/react';
import { CanvasProvider, useCanvas, useCanvasActions, CANVAS_ACTIONS } from '../../../context/CanvasContext';
import Toolbar from '../Toolbar';
import Canvas from '../Canvas';
import { SHAPE_TYPES } from '../../../utils/shapes';
import { useEffect, useRef } from 'react';

const renderWithProvider = (component) => {
  return render(<CanvasProvider>{component}</CanvasProvider>);
};

// Test component to access context - updates ref to avoid stale closure issues
const TestComponent = ({ stateRef }) => {
  const { state } = useCanvas();
  const actions = useCanvasActions();
  
  useEffect(() => {
    if (stateRef) {
      stateRef.current = { state, actions };
    }
  });
  
  return null;
};

describe('Canvas Context Integration Tests', () => {
  describe('CanvasContext State Management', () => {
    it('should initialize with default state', () => {
      const stateRef = { current: null };
      renderWithProvider(
        <TestComponent stateRef={stateRef} />
      );

      expect(stateRef.current.state.shapes).toEqual([]);
      expect(stateRef.current.state.selectedId).toBe(null);
      expect(stateRef.current.state.currentTool).toBe(null);
      expect(stateRef.current.state.scale).toBe(1);
    });

    it('should add shapes to state', () => {
      const stateRef = { current: null };
      renderWithProvider(
        <TestComponent stateRef={stateRef} />
      );

      const newShape = { id: '123', type: 'rect', x: 100, y: 100 };
      
      act(() => {
        stateRef.current.actions.addShape(newShape);
      });

      expect(stateRef.current.state.shapes).toContainEqual(newShape);
    });

    it('should update shape in state', () => {
      const stateRef = { current: null };
      renderWithProvider(
        <TestComponent stateRef={stateRef} />
      );

      const shape = { id: '123', type: 'rect', x: 100, y: 100 };
      
      act(() => {
        stateRef.current.actions.addShape(shape);
        stateRef.current.actions.updateShape('123', { x: 200 });
      });

      const updatedShape = stateRef.current.state.shapes.find(s => s.id === '123');
      expect(updatedShape.x).toBe(200);
    });

    it('should delete shape from state', () => {
      const stateRef = { current: null };
      renderWithProvider(
        <TestComponent stateRef={stateRef} />
      );

      const shape = { id: '123', type: 'rect', x: 100, y: 100 };
      
      act(() => {
        stateRef.current.actions.addShape(shape);
        stateRef.current.actions.deleteShape('123');
      });

      expect(stateRef.current.state.shapes).not.toContainEqual(shape);
      expect(stateRef.current.state.shapes.length).toBe(0);
    });

    it('should set selected ID', () => {
      const stateRef = { current: null };
      renderWithProvider(
        <TestComponent stateRef={stateRef} />
      );

      act(() => {
        stateRef.current.actions.setSelectedId('shape-123');
      });

      expect(stateRef.current.state.selectedId).toBe('shape-123');
    });

    it('should set current tool', () => {
      const stateRef = { current: null };
      renderWithProvider(
        <TestComponent stateRef={stateRef} />
      );

      act(() => {
        stateRef.current.actions.setCurrentTool(SHAPE_TYPES.RECT);
      });

      expect(stateRef.current.state.currentTool).toBe(SHAPE_TYPES.RECT);
    });
  });

  describe('Toolbar Component', () => {
    it('should render all tool buttons', () => {
      renderWithProvider(<Toolbar />);

      expect(screen.getByTitle(/Select and move/)).toBeInTheDocument();
      expect(screen.getByTitle('Draw rectangle')).toBeInTheDocument();
      expect(screen.getByTitle('Draw circle')).toBeInTheDocument();
      expect(screen.getByTitle('Add text')).toBeInTheDocument();
    });

    it('should highlight active tool', () => {
      renderWithProvider(<Toolbar />);

      const rectButton = screen.getByTitle('Draw rectangle');
      fireEvent.click(rectButton);

      expect(rectButton).toHaveClass('active');
    });

    it('should switch between tools', () => {
      renderWithProvider(<Toolbar />);

      const rectButton = screen.getByTitle('Draw rectangle');
      const circleButton = screen.getByTitle('Draw circle');

      fireEvent.click(rectButton);
      expect(rectButton).toHaveClass('active');

      fireEvent.click(circleButton);
      expect(circleButton).toHaveClass('active');
      expect(rectButton).not.toHaveClass('active');
    });

    it('should display appropriate hint for each tool', () => {
      renderWithProvider(<Toolbar />);

      fireEvent.click(screen.getByTitle('Draw rectangle'));
      expect(screen.getByText(/Click on canvas to add rect/)).toBeInTheDocument();

      fireEvent.click(screen.getByTitle(/Select and move/));
      expect(screen.getByText(/Select and drag shapes/)).toBeInTheDocument();
    });
  });

  describe('Canvas Component', () => {
    it('should render stage and layers', () => {
      renderWithProvider(<Canvas />);

      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      expect(screen.getAllByTestId('konva-layer').length).toBeGreaterThan(0);
    });

    it('should render grid when showGrid is true', () => {
      const { container } = renderWithProvider(<Canvas showGrid={true} />);

      const layers = container.querySelectorAll('[data-testid="konva-layer"]');
      // Should have at least 2 layers (grid + main)
      expect(layers.length).toBeGreaterThanOrEqual(2);
    });

    it('should not render extra grid layer when showGrid is false', () => {
      const { container } = renderWithProvider(<Canvas showGrid={false} />);

      const layers = container.querySelectorAll('[data-testid="konva-layer"]');
      // Without grid, we still render main + remote cursor layer
      expect(layers.length).toBe(2);
    });
  });

  describe('Integration: Toolbar + Canvas Context', () => {
    it('should update canvas context when tool is selected', () => {
      const stateRef = { current: null };
      renderWithProvider(
        <>
          <TestComponent stateRef={stateRef} />
          <Toolbar />
        </>
      );

      const rectButton = screen.getByTitle('Draw rectangle');
      
      act(() => {
        fireEvent.click(rectButton);
      });

      expect(stateRef.current.state.currentTool).toBe(SHAPE_TYPES.RECT);
    });

    it('should clear selection when changing tools', () => {
      const stateRef = { current: null };
      renderWithProvider(
        <>
          <TestComponent stateRef={stateRef} />
          <Toolbar />
        </>
      );

      // Set a selected ID
      act(() => {
        stateRef.current.actions.setSelectedId('shape-123');
      });

      expect(stateRef.current.state.selectedId).toBe('shape-123');
      
      // Change tool
      const rectButton = screen.getByTitle('Draw rectangle');
      act(() => {
        fireEvent.click(rectButton);
      });

      expect(stateRef.current.state.selectedId).toBe(null);
    });
  });
});

