/**
 * Unit tests for multi-select functionality in CanvasContext
 * Tests selectedIds state management and multi-select actions
 */

// Mock firebase config
jest.mock('../../services/firebase', () => ({
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
jest.mock('../../hooks/useRealtimeCursor', () => ({
  useRealtimeCursor: () => ({
    remoteCursors: [],
    publishLocalCursor: () => {},
    clearLocalCursor: () => {},
  }),
}));

jest.mock('../../hooks/useRealtimePresence', () => ({
  useRealtimePresence: () => {},
}));

import { render, act } from '@testing-library/react';
import { CanvasProvider, useCanvas, useCanvasActions } from '../CanvasContext';
import { useEffect } from 'react';

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

const renderWithProvider = (component) => {
  return render(<CanvasProvider>{component}</CanvasProvider>);
};

describe('Multi-Select Functionality Tests', () => {
  describe('Initial State', () => {
    it('should initialize with empty selectedIds array', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      expect(stateRef.current.state.selectedIds).toEqual([]);
      expect(stateRef.current.state.selectedId).toBe(null);
    });
  });

  describe('Single Selection', () => {
    it('should select a single shape using setSelectedId', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedId('shape-1');
      });

      expect(stateRef.current.state.selectedId).toBe('shape-1');
      expect(stateRef.current.state.selectedIds).toEqual(['shape-1']);
    });

    it('should clear selection when setSelectedId is called with null', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedId('shape-1');
      });

      act(() => {
        stateRef.current.actions.setSelectedId(null);
      });

      expect(stateRef.current.state.selectedId).toBe(null);
      expect(stateRef.current.state.selectedIds).toEqual([]);
    });
  });

  describe('Multi Selection', () => {
    it('should select multiple shapes using setSelectedIds', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2', 'shape-3']);
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-1', 'shape-2', 'shape-3']);
      expect(stateRef.current.state.selectedId).toBe(null); // null when multiple selected
    });

    it('should set selectedId when only one shape is in selectedIds', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedIds(['shape-1']);
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-1']);
      expect(stateRef.current.state.selectedId).toBe('shape-1');
    });

    it('should add shape to selection using addSelectedId', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedId('shape-1');
      });

      act(() => {
        stateRef.current.actions.addSelectedId('shape-2');
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-1', 'shape-2']);
      expect(stateRef.current.state.selectedId).toBe(null); // null when multiple selected
    });

    it('should not add duplicate shape when addSelectedId is called', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2']);
      });

      act(() => {
        stateRef.current.actions.addSelectedId('shape-1');
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-1', 'shape-2']);
    });

    it('should remove shape from selection using removeSelectedId', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2', 'shape-3']);
      });

      act(() => {
        stateRef.current.actions.removeSelectedId('shape-2');
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-1', 'shape-3']);
    });

    it('should update selectedId when removing down to one shape', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2']);
      });

      act(() => {
        stateRef.current.actions.removeSelectedId('shape-2');
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-1']);
      expect(stateRef.current.state.selectedId).toBe('shape-1');
    });
  });

  describe('Toggle Selection', () => {
    it('should add shape when toggling unselected shape', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.toggleSelectedId('shape-1');
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-1']);
    });

    it('should remove shape when toggling selected shape', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2']);
      });

      act(() => {
        stateRef.current.actions.toggleSelectedId('shape-1');
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-2']);
    });

    it('should work with empty selection', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.toggleSelectedId('shape-1');
      });

      act(() => {
        stateRef.current.actions.toggleSelectedId('shape-2');
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-1', 'shape-2']);
    });
  });

  describe('Clear Selection', () => {
    it('should clear all selections', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2', 'shape-3']);
      });

      act(() => {
        stateRef.current.actions.clearSelection();
      });

      expect(stateRef.current.state.selectedIds).toEqual([]);
      expect(stateRef.current.state.selectedId).toBe(null);
    });
  });

  describe('Tool Changes', () => {
    it('should clear selection when tool is changed', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      act(() => {
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2']);
      });

      act(() => {
        stateRef.current.actions.setCurrentTool('rect');
      });

      expect(stateRef.current.state.selectedIds).toEqual([]);
      expect(stateRef.current.state.selectedId).toBe(null);
      expect(stateRef.current.state.currentTool).toBe('rect');
    });
  });

  describe('Shape Deletion', () => {
    it('should remove deleted shape from selectedIds', () => {
      const stateRef = { current: null };
      renderWithProvider(<TestComponent stateRef={stateRef} />);

      // Add shapes
      act(() => {
        stateRef.current.actions.addShape({ id: 'shape-1', type: 'rect', x: 0, y: 0 });
        stateRef.current.actions.addShape({ id: 'shape-2', type: 'rect', x: 0, y: 0 });
        stateRef.current.actions.addShape({ id: 'shape-3', type: 'rect', x: 0, y: 0 });
      });

      // Select all shapes
      act(() => {
        stateRef.current.actions.setSelectedIds(['shape-1', 'shape-2', 'shape-3']);
      });

      // Delete one shape
      act(() => {
        stateRef.current.actions.deleteShape('shape-2');
      });

      expect(stateRef.current.state.selectedIds).toEqual(['shape-1', 'shape-3']);
      expect(stateRef.current.state.shapes).toHaveLength(2);
    });
  });
});

