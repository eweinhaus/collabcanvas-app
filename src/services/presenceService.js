import { ref, onValue, set, remove, onDisconnect, serverTimestamp } from 'firebase/database';
import toast from 'react-hot-toast';
import { realtimeDB } from './firebase';
import { logger } from '../utils/logger';

const DEFAULT_BOARD_ID = 'default';

const presenceRef = (uid, boardId = DEFAULT_BOARD_ID) =>
  ref(realtimeDB, `boards/${boardId}/presence/${uid}`);

const presencesRef = (boardId = DEFAULT_BOARD_ID) =>
  ref(realtimeDB, `boards/${boardId}/presence`);

export function setPresence({
  uid,
  boardId = DEFAULT_BOARD_ID,
  name = null,
  color = null,
  lastActive = serverTimestamp(),
} = {}) {
  if (!uid) {
    return Promise.resolve();
  }
  const payload = {
    uid,
    name,
    color,
    lastActive,
    status: 'online',
    updatedAt: serverTimestamp(),
  };
  return set(presenceRef(uid, boardId), payload).catch((err) => {
    logger.error('presenceService: Error setting presence:', err);
    toast.error('Failed to update presence status.');
    throw err;
  });
}

export function subscribeToPresence({
  boardId = DEFAULT_BOARD_ID,
  excludeUid,
  onUpdate,
  onError,
} = {}) {
  const refToUse = presencesRef(boardId);
  const unsubscribe = onValue(
    refToUse,
    (snapshot) => {
      const users = [];
      snapshot.forEach((child) => {
        const value = child.val();
        if (!value) return;
        if (excludeUid && child.key === excludeUid) return;
        users.push({ uid: child.key, ...value });
      });
      onUpdate?.(users);
    },
    (error) => {
      logger.error('presenceService: Subscription error:', error);
      toast.error('Failed to load online users.');
      onError?.(error);
    }
  );

  return () => {
    unsubscribe();
  };
}

export function removePresence({ uid, boardId = DEFAULT_BOARD_ID } = {}) {
  if (!uid) {
    return Promise.resolve();
  }
  return remove(presenceRef(uid, boardId)).catch((err) => {
    logger.error('presenceService: Error removing presence:', err);
    throw err;
  });
}

export function registerDisconnectCleanup({ uid, boardId = DEFAULT_BOARD_ID } = {}) {
  if (!uid) {
    return () => {};
  }
  const refToUse = presenceRef(uid, boardId);
  const disconnect = onDisconnect(refToUse);
  disconnect.remove().catch((err) => {
    logger.error('presenceService: Error setting disconnect handler:', err);
  });
  return () => {
    disconnect.cancel().catch(() => {});
  };
}

// Optional heartbeat to keep RTDB connection alive for backgrounded tabs
let heartbeatInterval = null;
export function startPresenceHeartbeat({ uid, boardId = DEFAULT_BOARD_ID, name = null, color = null, intervalMs = 30000 } = {}) {
  if (!uid) return () => {};
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    setPresence({ uid, boardId, name, color });
  }, intervalMs);
  return () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };
}

export const __testables = {
  DEFAULT_BOARD_ID,
  presenceRef,
  presencesRef,
};



