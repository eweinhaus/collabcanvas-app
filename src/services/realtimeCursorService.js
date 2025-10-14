import { ref, onValue, set, remove, onDisconnect, serverTimestamp } from 'firebase/database';
import { realtimeDB } from './firebase';

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
    console.warn('[realtimeCursorService] setCursorPosition called without uid');
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
  console.log('[realtimeCursorService] Setting cursor position:', { uid, boardId, x, y });
  return set(cursorRef(uid, boardId), payload).catch((err) => {
    console.error('[realtimeCursorService] Error setting cursor position:', err);
    throw err;
  });
}

export function subscribeToCursors({
  boardId = DEFAULT_BOARD_ID,
  excludeUid,
  onUpdate,
  onError,
} = {}) {
  console.log('[realtimeCursorService] Subscribing to cursors:', { boardId, excludeUid });
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
      console.log('[realtimeCursorService] Cursor update received:', cursors.length, 'cursors');
      onUpdate?.(cursors);
    },
    (error) => {
      console.error('[realtimeCursorService] Subscription error:', error);
      onError?.(error);
    }
  );

  return () => {
    console.log('[realtimeCursorService] Unsubscribing from cursors');
    unsubscribe();
  };
}

export function removeCursor({ uid, boardId = DEFAULT_BOARD_ID } = {}) {
  if (!uid) {
    console.warn('[realtimeCursorService] removeCursor called without uid');
    return Promise.resolve();
  }
  console.log('[realtimeCursorService] Removing cursor:', { uid, boardId });
  return remove(cursorRef(uid, boardId)).catch((err) => {
    console.error('[realtimeCursorService] Error removing cursor:', err);
    throw err;
  });
}

export function registerDisconnectCleanup({ uid, boardId = DEFAULT_BOARD_ID } = {}) {
  if (!uid) {
    console.warn('[realtimeCursorService] registerDisconnectCleanup called without uid');
    return () => {};
  }
  console.log('[realtimeCursorService] Registering disconnect cleanup:', { uid, boardId });
  const refToUse = cursorRef(uid, boardId);
  const disconnect = onDisconnect(refToUse);
  disconnect.remove().catch((err) => {
    console.error('[realtimeCursorService] Error setting disconnect handler:', err);
  });
  return () => {
    console.log('[realtimeCursorService] Cancelling disconnect cleanup:', { uid, boardId });
    disconnect.cancel().catch(() => {});
  };
}

export const __testables = {
  DEFAULT_BOARD_ID,
  cursorRef,
  cursorsRef,
};


