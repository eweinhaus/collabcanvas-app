/**
 * CanvasContext - Global state management for canvas
 * Manages shapes, selection, current tool, pan, and zoom
 */

import { createContext, useContext, useReducer, useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { getAllShapes, subscribeToShapes } from '../services/firestoreService';
import { createShape as fsCreateShape, createShapesBatch as fsCreateShapesBatch, updateShape as fsUpdateShape, deleteShape as fsDeleteShape, updateShapeText as fsUpdateShapeText } from '../services/firestoreServiceWithQueue';
import { throttle } from '../utils/throttle';
import { setCursorPosition, subscribeToCursors, removeCursor, registerDisconnectCleanup } from '../services/realtimeCursorService';
import { subscribeToPresence } from '../services/presenceService';
import { subscribeToDragUpdates, publishDragPosition, clearDragPosition, subscribeToTransformUpdates, publishTransform, clearTransform } from '../services/dragBroadcastService';
import { registerBeforeUnloadFlush } from '../utils/beforeUnloadFlush';
import { auth, realtimeDB } from '../services/firebase';
import { getAllEditBuffers, removeEditBuffer, registerEditBufferCleanup } from '../offline/editBuffers';
import { flush as flushOperationQueue } from '../offline/operationQueue';
import { ref, onValue } from 'firebase/database';
import toast from 'react-hot-toast';
import CommandHistory from '../utils/CommandHistory';
import { CreateShapeCommand, DeleteShapeCommand } from '../utils/commands';

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
  SET_SELECTED_IDS: 'SET_SELECTED_IDS',
  ADD_SELECTED_ID: 'ADD_SELECTED_ID',
  REMOVE_SELECTED_ID: 'REMOVE_SELECTED_ID',
  TOGGLE_SELECTED_ID: 'TOGGLE_SELECTED_ID',
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
  
  // Layer actions
  TOGGLE_LAYER_VISIBILITY: 'TOGGLE_LAYER_VISIBILITY',
  SET_HIDDEN_LAYERS: 'SET_HIDDEN_LAYERS',
};

// Initial state
const initialState = {
  shapes: [],
  selectedId: null, // Keep for backward compatibility
  selectedIds: [], // Multi-select support
  currentTool: null, // 'rect', 'circle', 'text', or null for select mode
  scale: 1,
  position: { x: 0, y: 0 },
  stageSize: { width: window.innerWidth, height: window.innerHeight },
  remoteCursors: [],
  onlineUsers: [],
  loadingShapes: true,
  hiddenLayers: new Set(), // Set of shape IDs that are hidden
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
        selectedIds: state.selectedIds.filter(id => id !== action.payload),
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
        selectedIds: action.payload ? [action.payload] : [],
      };
      
    case CANVAS_ACTIONS.SET_SELECTED_IDS:
      return {
        ...state,
        selectedIds: action.payload,
        selectedId: action.payload.length === 1 ? action.payload[0] : null,
      };
      
    case CANVAS_ACTIONS.ADD_SELECTED_ID:
      if (state.selectedIds.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        selectedIds: [...state.selectedIds, action.payload],
        selectedId: null, // Clear single selection when multi-selecting
      };
      
    case CANVAS_ACTIONS.REMOVE_SELECTED_ID:
      const newSelectedIds = state.selectedIds.filter(id => id !== action.payload);
      return {
        ...state,
        selectedIds: newSelectedIds,
        selectedId: newSelectedIds.length === 1 ? newSelectedIds[0] : null,
      };
      
    case CANVAS_ACTIONS.TOGGLE_SELECTED_ID:
      if (state.selectedIds.includes(action.payload)) {
        const filtered = state.selectedIds.filter(id => id !== action.payload);
        return {
          ...state,
          selectedIds: filtered,
          selectedId: filtered.length === 1 ? filtered[0] : null,
        };
      } else {
        return {
          ...state,
          selectedIds: [...state.selectedIds, action.payload],
          selectedId: null,
        };
      }
      
    case CANVAS_ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedId: null,
        selectedIds: [],
      };
      
    case CANVAS_ACTIONS.SET_CURRENT_TOOL:
      return {
        ...state,
        currentTool: action.payload,
        selectedId: null, // Clear selection when changing tools
        selectedIds: [],
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
    
    case CANVAS_ACTIONS.TOGGLE_LAYER_VISIBILITY: {
      const newHiddenLayers = new Set(state.hiddenLayers);
      if (newHiddenLayers.has(action.payload)) {
        newHiddenLayers.delete(action.payload);
      } else {
        newHiddenLayers.add(action.payload);
      }
      return {
        ...state,
        hiddenLayers: newHiddenLayers,
      };
    }
    
    case CANVAS_ACTIONS.SET_HIDDEN_LAYERS:
      return {
        ...state,
        hiddenLayers: new Set(action.payload),
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
  const stageRef = useRef(null); // Shared stage ref for export functionality
  const setIsExportingRef = useRef(null); // Callback to set export mode in Canvas
  const recentlyCreatedShapesRef = useRef(new Map()); // Track shapes created recently to skip redundant updates
  const lastCreationTimeRef = useRef(0);
  const CREATED_SHAPE_GRACE_MS = 10000; // 10 second grace period (was 5s)

  const pruneRecentlyCreatedShapes = useCallback(() => {
    const now = Date.now();
    const entries = recentlyCreatedShapesRef.current;
    const expiredIds = [];
    entries.forEach((timestamp, id) => {
      if (now - timestamp > CREATED_SHAPE_GRACE_MS) {
        expiredIds.push(id);
      }
    });

    expiredIds.forEach((id) => entries.delete(id));

    if (entries.size === 0) {
      lastCreationTimeRef.current = 0;
    }
  }, []);

  const trackRecentlyCreatedShape = useCallback((shapeId) => {
    const now = Date.now();
    recentlyCreatedShapesRef.current.set(shapeId, now);
    lastCreationTimeRef.current = now;
    pruneRecentlyCreatedShapes();
    console.log(`[CanvasContext] Tracking newly created shape ${shapeId}`);
  }, [pruneRecentlyCreatedShapes]);

  const hasRecentLocalCreations = useCallback(() => {
    pruneRecentlyCreatedShapes();

    if (recentlyCreatedShapesRef.current.size === 0) {
      return false;
    }

    const now = Date.now();
    if (now - lastCreationTimeRef.current >= CREATED_SHAPE_GRACE_MS) {
      recentlyCreatedShapesRef.current.clear();
      lastCreationTimeRef.current = 0;
      return false;
    }

    for (const [, timestamp] of recentlyCreatedShapesRef.current.entries()) {
      if (now - timestamp < CREATED_SHAPE_GRACE_MS) {
        return true;
      }
    }

    return false;
  }, [pruneRecentlyCreatedShapes]);

  const shouldIgnoreServerShape = useCallback((shapeId, context) => {
    const timestamp = recentlyCreatedShapesRef.current.get(shapeId);
    if (!timestamp) {
      return false;
    }

    const age = Date.now() - timestamp;
    if (age < CREATED_SHAPE_GRACE_MS) {
      console.log(`[CanvasContext] Ignoring shape ${shapeId} from ${context} (age ${age}ms < ${CREATED_SHAPE_GRACE_MS})`);
      return true;
    }

    // Grace period passed, remove tracking entry
    recentlyCreatedShapesRef.current.delete(shapeId);
    return false;
  }, [CREATED_SHAPE_GRACE_MS]);
  
  // Command history for undo/redo
  const [commandHistory] = useState(() => new CommandHistory());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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

  // Beforeunload flush for edit buffers
  useEffect(() => {
    const cleanup = registerBeforeUnloadFlush();
    const cleanupBuffers = registerEditBufferCleanup();
    return () => {
      cleanup();
      cleanupBuffers();
    };
  }, []);

  // Operation queue flush on online/reconnect
  useEffect(() => {
    let reconnectUnsubscribe;

    const handleOnline = async () => {
      // eslint-disable-next-line no-console
      //console.log('[CanvasContext] Network online, flushing operation queue...');
      const results = await flushOperationQueue(DEFAULT_BOARD_ID);
      if (results.success > 0) {
        toast.success(`Synced ${results.success} operation${results.success === 1 ? '' : 's'}`);
      }
      if (results.failed > 0) {
        toast.error(`Failed to sync ${results.failed} operation${results.failed === 1 ? '' : 's'}`);
      }
    };

    const setupFirebaseReconnectListener = async () => {
      try {
        const connectedRef = ref(realtimeDB, '.info/connected');
        reconnectUnsubscribe = onValue(connectedRef, async (snapshot) => {
          const isConnected = snapshot.val();
          if (isConnected) {
            // eslint-disable-next-line no-console
            //console.log('[CanvasContext] Firebase connected, flushing operation queue...');
            const results = await flushOperationQueue(DEFAULT_BOARD_ID);
            if (results.success > 0) {
              toast.success(`Synced ${results.success} operation${results.success === 1 ? '' : 's'}`);
            }
          }
        });
      } catch (error) {
        console.error('[CanvasContext] Error setting up reconnect listener:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    setupFirebaseReconnectListener();

    return () => {
      window.removeEventListener('online', handleOnline);
      if (reconnectUnsubscribe) reconnectUnsubscribe();
    };
  }, []);

  // Periodic shape reconciliation (self-healing for missed updates)
  useEffect(() => {
    const RECONCILE_INTERVAL_MS = 3000; // 3 seconds (reduced from 10s for faster recovery)
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
        if (hasRecentLocalCreations()) {
          //console.log('[CanvasContext] Reconciliation skipped due to recent local creations');
          return;
        }

        const serverShapes = await getAllShapes();
        const serverShapeMap = new Map(serverShapes.map((s) => [s.id, s]));
        const localShapeMap = new Map(state.shapes.map((s) => [s.id, s]));

        let hasChanges = false;

        // Apply individual shape updates instead of replacing entire array
        serverShapes.forEach((serverShape) => {
          if (shouldIgnoreServerShape(serverShape.id, 'reconciliation')) {
            return;
          }

          const localShape = localShapeMap.get(serverShape.id);
          if (!localShape) {
            // New shape from server
            hasChanges = true;
            console.log(`[CanvasContext] Reconciliation: Adding new shape ${serverShape.id}`);
            dispatch({ type: CANVAS_ACTIONS.APPLY_SERVER_CHANGE, payload: serverShape });
          } else {
            // Check if server version is newer
            const serverTs = serverShape.updatedAt ?? 0;
            const localTs = localShape.updatedAt ?? 0;
            if (serverTs > localTs + 100) {
              // 100ms tolerance - server has newer version
              hasChanges = true;
              console.log(`[CanvasContext] Reconciliation: Updating shape ${serverShape.id} (server: ${serverTs}, local: ${localTs})`);
              dispatch({ type: CANVAS_ACTIONS.APPLY_SERVER_CHANGE, payload: serverShape });
            } else {
              // Server version is older or same - skip to avoid flicker
              //console.log(`[CanvasContext] Reconciliation: Skipping update for ${serverShape.id} (server: ${serverTs}, local: ${localTs})`);
              return;
            }
          }
        });

        // Check for shapes that exist locally but not on server (deleted remotely)
        state.shapes.forEach((localShape) => {
          if (shouldIgnoreServerShape(localShape.id, 'server-missing')) {
            return;
          }

          if (!serverShapeMap.has(localShape.id)) {
            hasChanges = true;
            dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: localShape.id });
          }
        });

        if (hasChanges) {
          // eslint-disable-next-line no-console
          //console.log('[CanvasContext] Reconciliation: applied granular updates');
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

    // Instant reconciliation on Firebase reconnect
    let reconnectUnsubscribe;
    let lastReconcileTime = 0;
    let wasConnected = false;
    const MIN_RECONCILE_INTERVAL = 3000; // 3 second debounce to avoid thrashing

    const setupReconnectReconcile = async () => {
      try {
        if (!realtimeDB) {
          return;
        }

        const connectedRef = ref(realtimeDB, '.info/connected');
        reconnectUnsubscribe = onValue(connectedRef, async (snapshot) => {
          const isConnected = snapshot.val();
          const now = Date.now();

          // Only reconcile on transition from disconnected -> connected
          if (isConnected && !wasConnected && now - lastReconcileTime > MIN_RECONCILE_INTERVAL) {
            lastReconcileTime = now;
            //console.log('[CanvasContext] Firebase reconnected, triggering instant reconciliation');
            reconcile();
          }

          wasConnected = isConnected;
        });
      } catch (error) {
        console.error('[CanvasContext] Error setting up reconnect reconciliation:', error);
      }
    };

    setupReconnectReconcile();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      clearTimeout(leadershipCheckTimeout);
      if (reconnectUnsubscribe) reconnectUnsubscribe();
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
        
        // Merge edit buffers from IndexedDB (full props, not just x,y)
        try {
          const buffers = await getAllEditBuffers();
          const bufferMap = new Map(buffers.map(b => [b.shapeId, b.data]));
          
          initial = initial.map((serverShape) => {
            const buffer = bufferMap.get(serverShape.id);
            if (!buffer) return serverShape;
            
            // Only apply buffer if it's newer than server shape
            const bufferTime = buffer.bufferedAt || buffer.updatedAt || 0;
            const serverTime = serverShape.updatedAt || 0;
            
            if (bufferTime > serverTime) {
              // eslint-disable-next-line no-console
              console.log(`[CanvasContext] Restoring buffered state for shape ${serverShape.id}`);
              // Remove buffer after merging
              removeEditBuffer(serverShape.id);
              
              // Merge buffer with server shape (buffer takes precedence)
              return {
                ...serverShape,
                ...buffer,
                id: serverShape.id, // Preserve ID
                type: serverShape.type, // Preserve type
                updatedAt: Math.max(bufferTime, serverTime),
              };
            }
            
            // Buffer is older, discard it
            removeEditBuffer(serverShape.id);
            return serverShape;
          });
        } catch (error) {
          console.error('[CanvasContext] Error merging edit buffers:', error);
        }
        
        if (isMounted) {
          dispatch({ type: CANVAS_ACTIONS.SET_SHAPES, payload: initial });
        }

        // Subscribe to live updates
        unsubscribeRef.current = subscribeToShapes({
          onChange: ({ type, shape }) => {
            if (shouldIgnoreServerShape(shape.id, 'live-update')) {
              return;
            }

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
            pruneRecentlyCreatedShapes();
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

  // Update undo/redo state
  const updateUndoRedoState = useCallback(() => {
    setCanUndo(commandHistory.canUndo());
    setCanRedo(commandHistory.canRedo());
  }, [commandHistory]);

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
        const localTimestamp = Date.now();
        trackRecentlyCreatedShape(shape.id);

        // optimistic
        dispatch({
          type: CANVAS_ACTIONS.ADD_SHAPE,
          payload: {
            ...shape,
            createdAt: localTimestamp,
            updatedAt: localTimestamp,
            _isOptimistic: true,
          },
        });

        try {
          await fsCreateShape(shape);
        } catch (err) {
          // rollback
          recentlyCreatedShapesRef.current.delete(shape.id);
          dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: shape.id });
          // eslint-disable-next-line no-console
          console.error('Failed to create shape in Firestore', err);
        }
      },
      addShapesBatch: async (shapes) => {
        const localTimestamp = Date.now();
        shapes.forEach((shape) => trackRecentlyCreatedShape(shape.id));

        // optimistic - add all shapes locally first
        shapes.forEach((shape) => {
          dispatch({
            type: CANVAS_ACTIONS.ADD_SHAPE,
            payload: {
              ...shape,
              createdAt: localTimestamp,
              updatedAt: localTimestamp,
              _isOptimistic: true,
            },
          });
        });
        try {
          await fsCreateShapesBatch(shapes);
        } catch (err) {
          // rollback all shapes on error
          shapes.forEach((shape) => {
            recentlyCreatedShapesRef.current.delete(shape.id);
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
      updateZIndex: async (id, zIndex) => {
        // optimistic update
        dispatch({ type: CANVAS_ACTIONS.UPDATE_SHAPE, payload: { id, updates: { zIndex, updatedAt: Date.now() } } });
        try {
          const { updateZIndex: fsUpdateZIndex } = await import('../services/firestoreService');
          await fsUpdateZIndex(id, zIndex);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to update zIndex in Firestore', err);
        }
      },
      batchUpdateZIndex: async (updates) => {
        // optimistic update for all shapes
        updates.forEach(({ id, zIndex }) => {
          dispatch({ type: CANVAS_ACTIONS.UPDATE_SHAPE, payload: { id, updates: { zIndex, updatedAt: Date.now() } } });
        });
        try {
          const { batchUpdateZIndex: fsBatchUpdateZIndex } = await import('../services/firestoreService');
          await fsBatchUpdateZIndex(updates);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to batch update zIndex in Firestore', err);
        }
      },
      batchUpdatePosition: async (updates) => {
        // optimistic update for all shapes positions
        updates.forEach(({ id, x, y }) => {
          const positionUpdates = { updatedAt: Date.now() };
          if (x !== undefined) positionUpdates.x = x;
          if (y !== undefined) positionUpdates.y = y;
          dispatch({ type: CANVAS_ACTIONS.UPDATE_SHAPE, payload: { id, updates: positionUpdates } });
        });
        try {
          const { batchUpdatePosition: fsBatchUpdatePosition } = await import('../services/firestoreService');
          await fsBatchUpdatePosition(updates);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to batch update positions in Firestore', err);
        }
      },
    };
  }, []);

  // Command history actions
  const commandActions = useMemo(() => ({
    executeCommand: async (command) => {
      await commandHistory.execute(command);
      updateUndoRedoState();
    },
    undo: async () => {
      try {
        await commandHistory.undo();
        updateUndoRedoState();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to undo:', err);
      }
    },
    redo: async () => {
      try {
        await commandHistory.redo();
        updateUndoRedoState();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to redo:', err);
      }
    },
    canUndo,
    canRedo,
  }), [commandHistory, updateUndoRedoState, canUndo, canRedo]);

  const value = useMemo(() => ({
    state,
    dispatch,
    firestoreActions,
    commandActions,
    stageRef,
    setIsExportingRef,
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
  }), [state, firestoreActions, commandActions, publishCursor, startCursorSubscription, stopCursorSubscription, setupCursorDisconnect, removeCursorCallback, startPresenceSubscription, stopPresenceSubscription, publishDrag, clearDrag, startDragSubscription, stopDragSubscription, publishTransformUpdate, clearTransformUpdate, startTransformSubscription, stopTransformSubscription]);

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
    setSelectedIds: (ids) => dispatch({ type: CANVAS_ACTIONS.SET_SELECTED_IDS, payload: ids }),
    addSelectedId: (id) => dispatch({ type: CANVAS_ACTIONS.ADD_SELECTED_ID, payload: id }),
    removeSelectedId: (id) => dispatch({ type: CANVAS_ACTIONS.REMOVE_SELECTED_ID, payload: id }),
    toggleSelectedId: (id) => dispatch({ type: CANVAS_ACTIONS.TOGGLE_SELECTED_ID, payload: id }),
    clearSelection: () => dispatch({ type: CANVAS_ACTIONS.CLEAR_SELECTION }),
    setCurrentTool: (tool) => dispatch({ type: CANVAS_ACTIONS.SET_CURRENT_TOOL, payload: tool }),
    setScale: (scale) => dispatch({ type: CANVAS_ACTIONS.SET_SCALE, payload: scale }),
    setPosition: (position) => dispatch({ type: CANVAS_ACTIONS.SET_POSITION, payload: position }),
    setStageSize: (size) => dispatch({ type: CANVAS_ACTIONS.SET_STAGE_SIZE, payload: size }),
  }), [dispatch]);
};

