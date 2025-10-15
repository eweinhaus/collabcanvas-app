/**
 * CanvasContext - Global state management for canvas
 * Manages shapes, selection, current tool, pan, and zoom
 */

import { createContext, useContext, useReducer, useMemo, useEffect, useRef, useCallback } from 'react';
import { getAllShapes, subscribeToShapes, createShape as fsCreateShape, createShapesBatch as fsCreateShapesBatch, updateShape as fsUpdateShape, deleteShape as fsDeleteShape, updateShapeText as fsUpdateShapeText } from '../services/firestoreService';
import { throttle } from '../utils/throttle';
import { setCursorPosition, subscribeToCursors, removeCursor, registerDisconnectCleanup } from '../services/realtimeCursorService';
import { subscribeToPresence } from '../services/presenceService';
import { subscribeToDragUpdates, publishDragPosition, clearDragPosition, subscribeToTransformUpdates, publishTransform, clearTransform } from '../services/dragBroadcastService';
import { registerBeforeUnloadFlush } from '../utils/beforeUnloadFlush';
import { auth } from '../services/firebase';

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
  SET_LOADING_SHAPES: 'SET_LOADING_SHAPES',
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
  loadingShapes: true,
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

    case CANVAS_ACTIONS.SET_LOADING_SHAPES:
      return {
        ...state,
        loadingShapes: action.payload,
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
  const dragUnsubscribeRef = useRef(null);
  const transformUnsubscribeRef = useRef(null);
  const firstSnapshotReceivedRef = useRef(false);

  const setupCursorDisconnect = useCallback(({ uid, boardId = DEFAULT_BOARD_ID } = {}) => {
    if (cursorDisconnectCancelRef.current) {
      cursorDisconnectCancelRef.current();
      cursorDisconnectCancelRef.current = null;
    }
    if (!uid) {
      return;
    }
    cursorDisconnectCancelRef.current = registerDisconnectCleanup({ uid, boardId });
  }, []);

  const publishCursor = useCallback(({ uid, boardId = DEFAULT_BOARD_ID, ...rest }) => {
    if (!uid) {
      return Promise.resolve();
    }
    return setCursorPosition({ uid, boardId, ...rest }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[CanvasContext] Failed to set cursor position', err);
    });
  }, []);

  const removeCursorCallback = useCallback(({ uid, boardId = DEFAULT_BOARD_ID }) => {
    if (!uid) {
      return Promise.resolve();
    }
    return removeCursor({ uid, boardId }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[CanvasContext] Failed to remove cursor', err);
    });
  }, []);

  const stopCursorSubscription = useCallback(() => {
    if (cursorUnsubscribeRef.current) {
      cursorUnsubscribeRef.current();
      cursorUnsubscribeRef.current = null;
    }
  }, []);

  const stopPresenceSubscription = useCallback(() => {
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
    stopCursorSubscription();
    const unsubscribe = subscribeToCursors({
      boardId,
      excludeUid: uid,
      onUpdate: (cursors) => {
        dispatch({ type: CANVAS_ACTIONS.SET_REMOTE_CURSORS, payload: cursors });
        onUpdate?.(cursors);
      },
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error('[CanvasContext] Cursor subscription error:', err);
        onError?.(err);
      },
    });
    cursorUnsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [stopCursorSubscription]);

  // Drag broadcasting callbacks
  const stopDragSubscription = useCallback(() => {
    if (dragUnsubscribeRef.current) {
      dragUnsubscribeRef.current();
      dragUnsubscribeRef.current = null;
    }
  }, []);

  const startDragSubscription = useCallback(({
    boardId = DEFAULT_BOARD_ID,
    excludeUserId,
  } = {}) => {
    stopDragSubscription();
    const unsubscribe = subscribeToDragUpdates({
      boardId,
      excludeUserId,
      onUpdate: (updates) => {
        // Apply drag updates as temporary position changes
        updates.forEach((update) => {
          dispatch({
            type: CANVAS_ACTIONS.UPDATE_SHAPE,
            payload: {
              id: update.shapeId,
              updates: {
                x: update.x,
                y: update.y,
              },
            },
          });
        });
      },
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error('[CanvasContext] Drag subscription error:', err);
      },
    });
    dragUnsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [stopDragSubscription]);

  const publishDrag = useCallback(({ boardId = DEFAULT_BOARD_ID, shapeId, x, y }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return Promise.resolve();
    }
    return publishDragPosition({
      boardId,
      shapeId,
      x,
      y,
      userId: currentUser.uid,
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[CanvasContext] Failed to publish drag position', err);
    });
  }, []);

  const clearDrag = useCallback(({ boardId = DEFAULT_BOARD_ID, shapeId }) => {
    return clearDragPosition({ boardId, shapeId }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[CanvasContext] Failed to clear drag position', err);
    });
  }, []);

  // Transform broadcasting callbacks
  const stopTransformSubscription = useCallback(() => {
    if (transformUnsubscribeRef.current) {
      transformUnsubscribeRef.current();
      transformUnsubscribeRef.current = null;
    }
  }, []);

  const startTransformSubscription = useCallback(({
    boardId = DEFAULT_BOARD_ID,
    excludeUserId,
  } = {}) => {
    stopTransformSubscription();
    const unsubscribe = subscribeToTransformUpdates({
      boardId,
      excludeUserId,
      onUpdate: (updates) => {
        // Apply transform updates as temporary changes
        updates.forEach((update) => {
          dispatch({
            type: CANVAS_ACTIONS.UPDATE_SHAPE,
            payload: {
              id: update.shapeId,
              updates: {
                x: update.x,
                y: update.y,
                scaleX: update.scaleX,
                scaleY: update.scaleY,
                rotation: update.rotation,
              },
            },
          });
        });
      },
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error('[CanvasContext] Transform subscription error:', err);
      },
    });
    transformUnsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [stopTransformSubscription]);

  const publishTransformUpdate = useCallback(({ boardId = DEFAULT_BOARD_ID, shapeId, x, y, scaleX, scaleY, rotation }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return Promise.resolve();
    }
    return publishTransform({
      boardId,
      shapeId,
      x,
      y,
      scaleX,
      scaleY,
      rotation,
      userId: currentUser.uid,
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[CanvasContext] Failed to publish transform', err);
    });
  }, []);

  const clearTransformUpdate = useCallback(({ boardId = DEFAULT_BOARD_ID, shapeId }) => {
    return clearTransform({ boardId, shapeId }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[CanvasContext] Failed to clear transform', err);
    });
  }, []);

  // Beforeunload flush
  useEffect(() => {
    const cleanup = registerBeforeUnloadFlush();
    return cleanup;
  }, []);

  // Periodic shape reconciliation (self-healing for missed updates)
  useEffect(() => {
    const RECONCILE_INTERVAL_MS = 10000; // 10 seconds
    const RECONCILE_ENABLED = import.meta.env.VITE_ENABLE_RECONCILE !== 'false'; // default true
    
    if (!RECONCILE_ENABLED) {
      return undefined;
    }

    let intervalId = null;
    let isLeader = false;

    // Simple leader election: lowest UID becomes leader
    const checkLeadership = () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        isLeader = false;
        return;
      }

      // If we're the only online user, we're the leader
      const onlineUserIds = state.onlineUsers.map((u) => u.uid);
      if (onlineUserIds.length === 0) {
        isLeader = true;
        return;
      }

      // Leader is the user with the lowest UID (deterministic)
      const sortedIds = [...onlineUserIds].sort();
      isLeader = sortedIds[0] === currentUser.uid;
    };

    const reconcile = async () => {
      // Only reconcile if tab is visible and we're the leader
      if (document.hidden || !isLeader) {
        return;
      }

      try {
        const serverShapes = await getAllShapes();
        const serverShapeMap = new Map(serverShapes.map((s) => [s.id, s]));
        const localShapeMap = new Map(state.shapes.map((s) => [s.id, s]));

        let needsUpdate = false;

        // Check for missing or outdated shapes
        serverShapes.forEach((serverShape) => {
          const localShape = localShapeMap.get(serverShape.id);
          if (!localShape) {
            needsUpdate = true;
          } else {
            // Check if server version is newer
            const serverTs = serverShape.updatedAt ?? 0;
            const localTs = localShape.updatedAt ?? 0;
            if (serverTs > localTs + 100) {
              // 100ms tolerance
              needsUpdate = true;
            }
          }
        });

        // Check for shapes that exist locally but not on server
        state.shapes.forEach((localShape) => {
          if (!serverShapeMap.has(localShape.id)) {
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          // eslint-disable-next-line no-console
          console.log('[CanvasContext] Reconciliation: syncing shapes from server');
          dispatch({ type: CANVAS_ACTIONS.SET_SHAPES, payload: serverShapes });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[CanvasContext] Reconciliation error:', error);
      }
    };

    // Check leadership and start interval
    checkLeadership();
    intervalId = setInterval(() => {
      checkLeadership();
      reconcile();
    }, RECONCILE_INTERVAL_MS);

    // Re-check leadership when online users change
    const leadershipCheckTimeout = setTimeout(checkLeadership, 100);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      clearTimeout(leadershipCheckTimeout);
    };
  }, [state.shapes, state.onlineUsers]);

  // Initial load then subscribe - WAIT FOR AUTH FIRST
  useEffect(() => {
    let isMounted = true;

    // Wait for auth to be ready before loading shapes
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // User not authenticated, clear shapes and wait
        dispatch({ type: CANVAS_ACTIONS.SET_LOADING_SHAPES, payload: false });
        return;
      }

      // User is authenticated, proceed with loading shapes
      try {
        dispatch({ type: CANVAS_ACTIONS.SET_LOADING_SHAPES, payload: true });
        let initial = await getAllShapes();
        try {
          initial = initial.map((s) => {
            const bufRaw = sessionStorage.getItem(`editBuffer:${s.id}`);
            if (!bufRaw) return s;
            const buf = JSON.parse(bufRaw);
            if (!buf || typeof buf.x !== 'number' || typeof buf.y !== 'number') return s;
            return { ...s, x: buf.x, y: buf.y, updatedAt: Math.max(Date.now(), s.updatedAt ?? 0) };
          });
        } catch (_) {}
        if (isMounted) {
          dispatch({ type: CANVAS_ACTIONS.SET_SHAPES, payload: initial });
        }

        // Subscribe to live updates
        unsubscribeRef.current = subscribeToShapes({
          onChange: ({ type, shape }) => {
            if (!firstSnapshotReceivedRef.current) {
              firstSnapshotReceivedRef.current = true;
              dispatch({ type: CANVAS_ACTIONS.SET_LOADING_SHAPES, payload: false });
            }
            if (type === 'removed') {
              // Remove locally
              dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: shape.id });
              return;
            }
            dispatch({ type: CANVAS_ACTIONS.APPLY_SERVER_CHANGE, payload: shape });
          },
          onReady: () => {
            if (!firstSnapshotReceivedRef.current) {
              firstSnapshotReceivedRef.current = true;
              dispatch({ type: CANVAS_ACTIONS.SET_LOADING_SHAPES, payload: false });
            }
          },
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize Firestore sync', err);
        dispatch({ type: CANVAS_ACTIONS.SET_LOADING_SHAPES, payload: false });
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      firstSnapshotReceivedRef.current = false;
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
    if (presenceUnsubscribeRef.current) {
      presenceUnsubscribeRef.current();
      presenceUnsubscribeRef.current = null;
    }
    const unsubscribe = subscribeToPresence({
      boardId,
      excludeUid: null, // Include current user to show "(You)" label
      onUpdate: (users) => {
        dispatch({ type: CANVAS_ACTIONS.SET_ONLINE_USERS, payload: users });
      },
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error('[CanvasContext] Presence subscription error:', err);
      },
    });
    presenceUnsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const firestoreActions = useMemo(() => {
    // Shape update throttle - configurable via env for production tuning
    const SHAPE_UPDATE_THROTTLE_MS = Number(import.meta.env.VITE_SHAPE_UPDATE_THROTTLE_MS) || 50;
    
    const ensureThrottler = (id) => {
      if (!throttledUpdatesRef.current[id]) {
        throttledUpdatesRef.current[id] = throttle((shapeId, updates) => {
          fsUpdateShape(shapeId, updates).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Failed to update shape in Firestore', err);
          });
        }, SHAPE_UPDATE_THROTTLE_MS);
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
      addShapesBatch: async (shapes) => {
        // optimistic - add all shapes locally first
        shapes.forEach((shape) => {
          dispatch({ type: CANVAS_ACTIONS.ADD_SHAPE, payload: { ...shape, updatedAt: Date.now() } });
        });
        try {
          await fsCreateShapesBatch(shapes);
        } catch (err) {
          // rollback all shapes on error
          shapes.forEach((shape) => {
            dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: shape.id });
          });
          // eslint-disable-next-line no-console
          console.error('Failed to create shapes batch in Firestore', err);
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
    drag: {
      publishDrag,
      clearDrag,
      startDragSubscription,
      stopDragSubscription,
    },
    transform: {
      publishTransform: publishTransformUpdate,
      clearTransform: clearTransformUpdate,
      startTransformSubscription,
      stopTransformSubscription,
    },
  }), [state, firestoreActions, publishCursor, startCursorSubscription, stopCursorSubscription, setupCursorDisconnect, removeCursorCallback, startPresenceSubscription, stopPresenceSubscription, publishDrag, clearDrag, startDragSubscription, stopDragSubscription, publishTransformUpdate, clearTransformUpdate, startTransformSubscription, stopTransformSubscription]);

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

