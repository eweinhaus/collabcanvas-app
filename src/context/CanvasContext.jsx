/**
 * CanvasContext - Global state management for canvas
 * Manages shapes, selection, current tool, pan, and zoom
 */

import { createContext, useContext, useReducer, useMemo, useEffect, useRef, useCallback } from 'react';
import { getAllShapes, subscribeToShapes, createShape as fsCreateShape, updateShape as fsUpdateShape, deleteShape as fsDeleteShape, updateShapeText as fsUpdateShapeText } from '../services/firestoreService';
import { throttle } from '../utils/throttle';
import { setCursorPosition, subscribeToCursors, removeCursor, registerDisconnectCleanup } from '../services/realtimeCursorService';
import { subscribeToPresence } from '../services/presenceService';

const DEFAULT_BOARD_ID = 'default';

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
  APPLY_SERVER_CHANGE: 'APPLY_SERVER_CHANGE',
  SET_REMOTE_CURSORS: 'SET_REMOTE_CURSORS',
  SET_ONLINE_USERS: 'SET_ONLINE_USERS',
};

// Initial state
const initialState = {
  shapes: [],
  selectedId: null,
  currentTool: null, // 'rect', 'circle', 'text', or null for select mode
  scale: 1,
  position: { x: 0, y: 0 },
  stageSize: { width: window.innerWidth, height: window.innerHeight },
  remoteCursors: [],
  onlineUsers: [],
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
    
    case CANVAS_ACTIONS.APPLY_SERVER_CHANGE: {
      const incoming = action.payload;
      const TOLERANCE_MS = 100;
      const existing = state.shapes.find(s => s.id === incoming.id);
      if (!existing) {
        return { ...state, shapes: [...state.shapes, incoming] };
      }
      const existingTs = existing.updatedAt ?? 0;
      const serverTs = incoming.updatedAt ?? 0;
      if (serverTs > existingTs + TOLERANCE_MS) {
        return {
          ...state,
          shapes: state.shapes.map(s => (s.id === incoming.id ? { ...s, ...incoming } : s)),
        };
      }
      return state;
    }
      
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

    case CANVAS_ACTIONS.SET_REMOTE_CURSORS:
      return {
        ...state,
        remoteCursors: action.payload,
      };

    case CANVAS_ACTIONS.SET_ONLINE_USERS:
      return {
        ...state,
        onlineUsers: action.payload,
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
  const unsubscribeRef = useRef(null);
  const throttledUpdatesRef = useRef({});
  const cursorUnsubscribeRef = useRef(null);
  const cursorDisconnectCancelRef = useRef(null);
  const presenceUnsubscribeRef = useRef(null);

  const setupCursorDisconnect = useCallback(({ uid, boardId = DEFAULT_BOARD_ID } = {}) => {
    if (cursorDisconnectCancelRef.current) {
      cursorDisconnectCancelRef.current();
      cursorDisconnectCancelRef.current = null;
    }
    if (!uid) {
      console.warn('[CanvasContext] setupCursorDisconnect called without uid');
      return;
    }
    console.log('[CanvasContext] Setting up cursor disconnect cleanup:', { uid, boardId });
    cursorDisconnectCancelRef.current = registerDisconnectCleanup({ uid, boardId });
  }, []);

  const publishCursor = useCallback(({ uid, boardId = DEFAULT_BOARD_ID, ...rest }) => {
    if (!uid) {
      console.warn('[CanvasContext] publishCursor called without uid');
      return Promise.resolve();
    }
    console.log('[CanvasContext] Publishing cursor:', { uid, boardId, x: rest.x, y: rest.y });
    return setCursorPosition({ uid, boardId, ...rest }).catch((err) => {
      console.error('[CanvasContext] Failed to set cursor position', err);
    });
  }, []);

  const removeCursorCallback = useCallback(({ uid, boardId = DEFAULT_BOARD_ID }) => {
    if (!uid) {
      console.warn('[CanvasContext] removeCursor called without uid');
      return Promise.resolve();
    }
    console.log('[CanvasContext] Removing cursor:', { uid, boardId });
    return removeCursor({ uid, boardId }).catch((err) => {
      console.error('[CanvasContext] Failed to remove cursor', err);
    });
  }, []);

  const stopCursorSubscription = useCallback(() => {
    console.log('[CanvasContext] Stopping cursor subscription');
    if (cursorUnsubscribeRef.current) {
      cursorUnsubscribeRef.current();
      cursorUnsubscribeRef.current = null;
    }
  }, []);

  const stopPresenceSubscription = useCallback(() => {
    console.log('[CanvasContext] Stopping presence subscription');
    if (presenceUnsubscribeRef.current) {
      presenceUnsubscribeRef.current();
      presenceUnsubscribeRef.current = null;
    }
  }, []);

  const startCursorSubscription = useCallback(({
    boardId = DEFAULT_BOARD_ID,
    uid,
    onUpdate,
    onError,
  } = {}) => {
    console.log('[CanvasContext] Starting cursor subscription:', { boardId, uid });
    stopCursorSubscription();
    const unsubscribe = subscribeToCursors({
      boardId,
      excludeUid: uid,
      onUpdate: (cursors) => {
        console.log('[CanvasContext] Received cursor update:', cursors.length, 'cursors');
        dispatch({ type: CANVAS_ACTIONS.SET_REMOTE_CURSORS, payload: cursors });
        onUpdate?.(cursors);
      },
      onError: (err) => {
        console.error('[CanvasContext] Cursor subscription error:', err);
        onError?.(err);
      },
    });
    cursorUnsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [stopCursorSubscription]);

  // Initial load then subscribe
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const initial = await getAllShapes();
        if (isMounted) {
          dispatch({ type: CANVAS_ACTIONS.SET_SHAPES, payload: initial });
        }

        // Subscribe to live updates
        unsubscribeRef.current = subscribeToShapes({
          onChange: ({ type, shape }) => {
            if (type === 'removed') {
              // Remove locally
              dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: shape.id });
              return;
            }
            dispatch({ type: CANVAS_ACTIONS.APPLY_SERVER_CHANGE, payload: shape });
          },
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize Firestore sync', err);
      }
    })();

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      stopCursorSubscription();
      stopPresenceSubscription();
      if (cursorDisconnectCancelRef.current) {
        cursorDisconnectCancelRef.current();
        cursorDisconnectCancelRef.current = null;
      }
      // cancel throttles
      Object.values(throttledUpdatesRef.current).forEach((t) => t?.cancel?.());
      throttledUpdatesRef.current = {};
    };
  }, [stopCursorSubscription, stopPresenceSubscription]);

  // Presence subscription
  const startPresenceSubscription = useCallback(({ boardId = DEFAULT_BOARD_ID, uid } = {}) => {
    console.log('[CanvasContext] Starting presence subscription:', { boardId, uid });
    if (presenceUnsubscribeRef.current) {
      presenceUnsubscribeRef.current();
      presenceUnsubscribeRef.current = null;
    }
    const unsubscribe = subscribeToPresence({
      boardId,
      excludeUid: uid,
      onUpdate: (users) => {
        console.log('[CanvasContext] Received presence update:', users.length, 'users');
        dispatch({ type: CANVAS_ACTIONS.SET_ONLINE_USERS, payload: users });
      },
      onError: (err) => {
        console.error('[CanvasContext] Presence subscription error:', err);
      },
    });
    presenceUnsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const firestoreActions = useMemo(() => {
    const ensureThrottler = (id) => {
      if (!throttledUpdatesRef.current[id]) {
        throttledUpdatesRef.current[id] = throttle((shapeId, updates) => {
          fsUpdateShape(shapeId, updates).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Failed to update shape in Firestore', err);
          });
        }, 100);
      }
      return throttledUpdatesRef.current[id];
    };

    return {
      addShape: async (shape) => {
        // optimistic
        dispatch({ type: CANVAS_ACTIONS.ADD_SHAPE, payload: { ...shape, updatedAt: Date.now() } });
        try {
          await fsCreateShape(shape);
        } catch (err) {
          // rollback
          dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: shape.id });
          // eslint-disable-next-line no-console
          console.error('Failed to create shape in Firestore', err);
        }
      },
      updateShape: (id, updates) => {
        // optimistic
        dispatch({ type: CANVAS_ACTIONS.UPDATE_SHAPE, payload: { id, updates: { ...updates, updatedAt: Date.now() } } });
        const throttler = ensureThrottler(id);
        throttler(id, updates);
      },
      updateShapeText: (id, text) => {
        // optimistic
        dispatch({ type: CANVAS_ACTIONS.UPDATE_SHAPE, payload: { id, updates: { text, updatedAt: Date.now() } } });
        fsUpdateShapeText(id, text).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Failed to update shape text in Firestore', err);
        });
      },
      deleteShape: async (id) => {
        // optimistic
        dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: id });
        try {
          await fsDeleteShape(id);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to delete shape in Firestore', err);
        }
      },
    };
  }, []);

  const value = useMemo(() => ({
    state,
    dispatch,
    firestoreActions,
    cursor: {
      publishCursor,
      startCursorSubscription,
      stopCursorSubscription,
      setupCursorDisconnect,
      removeCursor: removeCursorCallback,
    },
    presence: {
      startPresenceSubscription,
      stopPresenceSubscription,
    },
  }), [state, firestoreActions, publishCursor, startCursorSubscription, stopCursorSubscription, setupCursorDisconnect, removeCursorCallback, startPresenceSubscription, stopPresenceSubscription]);

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

