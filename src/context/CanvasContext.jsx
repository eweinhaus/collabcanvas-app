/**
 * CanvasContext - Global state management for canvas
 * Manages shapes, selection, current tool, pan, and zoom
 */

import { createContext, useContext, useReducer, useMemo } from 'react';

const CanvasContext = createContext(null);

// Action types
export const CANVAS_ACTIONS = {
  // Shape actions
  ADD_SHAPE: 'ADD_SHAPE',
  UPDATE_SHAPE: 'UPDATE_SHAPE',
  DELETE_SHAPE: 'DELETE_SHAPE',
  SET_SHAPES: 'SET_SHAPES',
  
  // Selection actions
  SET_SELECTED_ID: 'SET_SELECTED_ID',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  
  // Tool actions
  SET_CURRENT_TOOL: 'SET_CURRENT_TOOL',
  
  // View actions
  SET_SCALE: 'SET_SCALE',
  SET_POSITION: 'SET_POSITION',
  SET_STAGE_SIZE: 'SET_STAGE_SIZE',
};

// Initial state
const initialState = {
  shapes: [],
  selectedId: null,
  currentTool: null, // 'rect', 'circle', 'text', or null for select mode
  scale: 1,
  position: { x: 0, y: 0 },
  stageSize: { width: window.innerWidth, height: window.innerHeight },
};

// Reducer
const canvasReducer = (state, action) => {
  switch (action.type) {
    case CANVAS_ACTIONS.ADD_SHAPE:
      return {
        ...state,
        shapes: [...state.shapes, action.payload],
      };
      
    case CANVAS_ACTIONS.UPDATE_SHAPE:
      return {
        ...state,
        shapes: state.shapes.map(shape =>
          shape.id === action.payload.id
            ? { ...shape, ...action.payload.updates }
            : shape
        ),
      };
      
    case CANVAS_ACTIONS.DELETE_SHAPE:
      return {
        ...state,
        shapes: state.shapes.filter(shape => shape.id !== action.payload),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
      };
      
    case CANVAS_ACTIONS.SET_SHAPES:
      return {
        ...state,
        shapes: action.payload,
      };
      
    case CANVAS_ACTIONS.SET_SELECTED_ID:
      return {
        ...state,
        selectedId: action.payload,
      };
      
    case CANVAS_ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedId: null,
      };
      
    case CANVAS_ACTIONS.SET_CURRENT_TOOL:
      return {
        ...state,
        currentTool: action.payload,
        selectedId: null, // Clear selection when changing tools
      };
      
    case CANVAS_ACTIONS.SET_SCALE:
      return {
        ...state,
        scale: action.payload,
      };
      
    case CANVAS_ACTIONS.SET_POSITION:
      return {
        ...state,
        position: action.payload,
      };
      
    case CANVAS_ACTIONS.SET_STAGE_SIZE:
      return {
        ...state,
        stageSize: action.payload,
      };
      
    default:
      return state;
  }
};

/**
 * CanvasProvider component
 * Wraps the application to provide canvas state
 */
export const CanvasProvider = ({ children }) => {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};

/**
 * Custom hook to use canvas context
 * @returns {Object} { state, dispatch }
 */
export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};

/**
 * Helper hooks for common operations
 */
export const useCanvasActions = () => {
  const { dispatch } = useCanvas();

  return useMemo(() => ({
    addShape: (shape) => dispatch({ type: CANVAS_ACTIONS.ADD_SHAPE, payload: shape }),
    updateShape: (id, updates) => dispatch({ type: CANVAS_ACTIONS.UPDATE_SHAPE, payload: { id, updates } }),
    deleteShape: (id) => dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: id }),
    setSelectedId: (id) => dispatch({ type: CANVAS_ACTIONS.SET_SELECTED_ID, payload: id }),
    clearSelection: () => dispatch({ type: CANVAS_ACTIONS.CLEAR_SELECTION }),
    setCurrentTool: (tool) => dispatch({ type: CANVAS_ACTIONS.SET_CURRENT_TOOL, payload: tool }),
    setScale: (scale) => dispatch({ type: CANVAS_ACTIONS.SET_SCALE, payload: scale }),
    setPosition: (position) => dispatch({ type: CANVAS_ACTIONS.SET_POSITION, payload: position }),
    setStageSize: (size) => dispatch({ type: CANVAS_ACTIONS.SET_STAGE_SIZE, payload: size }),
  }), [dispatch]);
};

