import { ref, onValue, set, remove, onDisconnect, serverTimestamp } from 'firebase/database';
import { realtimeDB } from './firebase';
import { logger } from '../utils/logger';

const DEFAULT_BOARD_ID = 'default';

const cursorRef = (uid, boardId = DEFAULT_BOARD_ID) =>
  ref(realtimeDB, `boards/${boardId}/cursors/${uid}`);

const cursorsRef = (boardId = DEFAULT_BOARD_ID) =>
  ref(realtimeDB, `boards/${boardId}/cursors`);

export function setCursorPosition({
  uid,
  boardId = DEFAULT_BOARD_ID,
  x,
  y,
  scale = 1,
  name = null,
  color = null,
  lastActive = serverTimestamp(),
} = {}) {
  if (!uid) {
    return Promise.resolve();
  }
  const payload = {
    uid,
    x,
    y,
    scale,
    name,
    color,
    lastActive,
    updatedAt: serverTimestamp(),
  };
  return set(cursorRef(uid, boardId), payload).catch((err) => {
    logger.error('realtimeCursorService: Error setting cursor position:', err);
    throw err;
  });
}

export function subscribeToCursors({
  boardId = DEFAULT_BOARD_ID,
  excludeUid,
  onUpdate,
  onError,
} = {}) {
  const refToUse = cursorsRef(boardId);
  const unsubscribe = onValue(
    refToUse,
    (snapshot) => {
      const cursors = [];
      snapshot.forEach((child) => {
        const value = child.val();
        if (!value) return;
        if (excludeUid && child.key === excludeUid) return;
        cursors.push({ uid: child.key, ...value });
      });
      onUpdate?.(cursors);
    },
    (error) => {
      logger.error('realtimeCursorService: Subscription error:', error);
      onError?.(error);
    }
  );

  return () => {
    unsubscribe();
  };
}

export function removeCursor({ uid, boardId = DEFAULT_BOARD_ID } = {}) {
  if (!uid) {
    return Promise.resolve();
  }
  return remove(cursorRef(uid, boardId)).catch((err) => {
    logger.error('realtimeCursorService: Error removing cursor:', err);
    throw err;
  });
}

export function registerDisconnectCleanup({ uid, boardId = DEFAULT_BOARD_ID } = {}) {
  if (!uid) {
    return () => {};
  }
  const refToUse = cursorRef(uid, boardId);
  const disconnect = onDisconnect(refToUse);
  disconnect.remove().catch((err) => {
    logger.error('realtimeCursorService: Error setting disconnect handler:', err);
  });
  return () => {
    disconnect.cancel().catch(() => {});
  };
}

export const __testables = {
  DEFAULT_BOARD_ID,
  cursorRef,
  cursorsRef,
};


