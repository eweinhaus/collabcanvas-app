/**
 * Drag Broadcast Service - Real-time shape position updates during drag
 * Uses RTDB for low-latency updates while dragging, then syncs to Firestore on dragEnd
 */

import { ref, set, remove, onValue, onDisconnect } from 'firebase/database';
import { realtimeDB } from './firebase';
import { logger } from '../utils/logger';

const DEFAULT_BOARD_ID = 'default';

/**
 * Get reference to active edits for a specific shape
 */
const activeEditRef = (boardId, shapeId) =>
  ref(realtimeDB, `boards/${boardId}/activeEdits/${shapeId}`);

/**
 * Get reference to all active edits for a board
 */
const activeEditsRef = (boardId) =>
  ref(realtimeDB, `boards/${boardId}/activeEdits`);

/**
 * Get reference to active transforms for a specific shape
 */
const activeTransformRef = (boardId, shapeId) =>
  ref(realtimeDB, `boards/${boardId}/activeTransforms/${shapeId}`);

/**
 * Get reference to all active transforms for a board
 */
const activeTransformsRef = (boardId) =>
  ref(realtimeDB, `boards/${boardId}/activeTransforms`);

/**
 * Publish shape position during drag (throttled by caller)
 * @param {Object} params
 * @param {string} params.boardId - Board ID
 * @param {string} params.shapeId - Shape ID
 * @param {number} params.x - X position
 * @param {number} params.y - Y position
 * @param {string} params.userId - User ID making the edit
 */
export async function publishDragPosition({
  boardId = DEFAULT_BOARD_ID,
  shapeId,
  x,
  y,
  userId,
}) {
  if (!shapeId || !userId) {
    return Promise.resolve();
  }

  const refToUse = activeEditRef(boardId, shapeId);
  const payload = {
    x,
    y,
    userId,
    timestamp: Date.now(),
  };

  try {
    await set(refToUse, payload);
    // Setup disconnect cleanup
    const disconnect = onDisconnect(refToUse);
    await disconnect.remove();
  } catch (error) {
    logger.error('dragBroadcastService: Error publishing drag:', error);
    throw error;
  }
}

/**
 * Remove shape from active edits (call on dragEnd)
 * @param {Object} params
 * @param {string} params.boardId - Board ID
 * @param {string} params.shapeId - Shape ID
 */
export async function clearDragPosition({ boardId = DEFAULT_BOARD_ID, shapeId }) {
  if (!shapeId) {
    return Promise.resolve();
  }

  const refToUse = activeEditRef(boardId, shapeId);
  
  try {
    await remove(refToUse);
  } catch (error) {
    logger.error('dragBroadcastService: Error clearing drag:', error);
    throw error;
  }
}

/**
 * Subscribe to all active drag updates for a board
 * @param {Object} params
 * @param {string} params.boardId - Board ID
 * @param {string} params.excludeUserId - Don't emit updates from this user
 * @param {Function} params.onUpdate - Callback with shape updates
 * @param {Function} params.onError - Error callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToDragUpdates({
  boardId = DEFAULT_BOARD_ID,
  excludeUserId,
  onUpdate,
  onError,
}) {
  const refToUse = activeEditsRef(boardId);

  const unsubscribe = onValue(
    refToUse,
    (snapshot) => {
      const updates = [];
      snapshot.forEach((child) => {
        const value = child.val();
        if (!value) return;
        
        // Skip updates from the current user
        if (excludeUserId && value.userId === excludeUserId) return;

        updates.push({
          shapeId: child.key,
          x: value.x,
          y: value.y,
          userId: value.userId,
          timestamp: value.timestamp,
        });
      });

      if (onUpdate && updates.length > 0) {
        onUpdate(updates);
      }
    },
    (error) => {
      logger.error('dragBroadcastService: Subscription error:', error);
      if (onError) {
        onError(error);
      }
    }
  );

  return unsubscribe;
}

/**
 * Publish shape transform during active transformation (throttled by caller)
 * @param {Object} params
 * @param {string} params.boardId - Board ID
 * @param {string} params.shapeId - Shape ID
 * @param {number} params.x - X position
 * @param {number} params.y - Y position
 * @param {number} params.scaleX - Scale X
 * @param {number} params.scaleY - Scale Y
 * @param {number} params.rotation - Rotation in degrees
 * @param {string} params.userId - User ID making the transform
 */
export async function publishTransform({
  boardId = DEFAULT_BOARD_ID,
  shapeId,
  x,
  y,
  scaleX,
  scaleY,
  rotation,
  userId,
}) {
  if (!shapeId || !userId) {
    return Promise.resolve();
  }

  const refToUse = activeTransformRef(boardId, shapeId);
  const payload = {
    x,
    y,
    scaleX,
    scaleY,
    rotation,
    userId,
    timestamp: Date.now(),
  };

  try {
    await set(refToUse, payload);
    // Setup disconnect cleanup
    const disconnect = onDisconnect(refToUse);
    await disconnect.remove();
  } catch (error) {
    logger.error('dragBroadcastService: Error publishing transform:', error);
    throw error;
  }
}

/**
 * Remove shape from active transforms (call on transformEnd)
 * @param {Object} params
 * @param {string} params.boardId - Board ID
 * @param {string} params.shapeId - Shape ID
 */
export async function clearTransform({ boardId = DEFAULT_BOARD_ID, shapeId }) {
  if (!shapeId) {
    return Promise.resolve();
  }

  const refToUse = activeTransformRef(boardId, shapeId);
  
  try {
    await remove(refToUse);
  } catch (error) {
    logger.error('dragBroadcastService: Error clearing transform:', error);
    throw error;
  }
}

/**
 * Subscribe to all active transform updates for a board
 * @param {Object} params
 * @param {string} params.boardId - Board ID
 * @param {string} params.excludeUserId - Don't emit updates from this user
 * @param {Function} params.onUpdate - Callback with transform updates
 * @param {Function} params.onError - Error callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTransformUpdates({
  boardId = DEFAULT_BOARD_ID,
  excludeUserId,
  onUpdate,
  onError,
}) {
  const refToUse = activeTransformsRef(boardId);

  const unsubscribe = onValue(
    refToUse,
    (snapshot) => {
      const updates = [];
      snapshot.forEach((child) => {
        const value = child.val();
        if (!value) return;
        
        // Skip updates from the current user
        if (excludeUserId && value.userId === excludeUserId) return;

        updates.push({
          shapeId: child.key,
          x: value.x,
          y: value.y,
          scaleX: value.scaleX,
          scaleY: value.scaleY,
          rotation: value.rotation,
          userId: value.userId,
          timestamp: value.timestamp,
        });
      });

      if (onUpdate && updates.length > 0) {
        onUpdate(updates);
      }
    },
    (error) => {
      logger.error('dragBroadcastService: Transform subscription error:', error);
      if (onError) {
        onError(error);
      }
    }
  );

  return unsubscribe;
}

export const __testables = {
  DEFAULT_BOARD_ID,
  activeEditRef,
  activeEditsRef,
  activeTransformRef,
  activeTransformsRef,
};

