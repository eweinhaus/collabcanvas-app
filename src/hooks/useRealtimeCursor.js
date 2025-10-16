import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { useAuth } from '../context/AuthContext';
import { throttle } from '../utils/throttle';
import { getColorForUser, getInitials } from '../utils/cursorColors';

// Cursor update throttle - configurable via env for production tuning
const THROTTLE_MS = Number(import.meta.env.VITE_CURSOR_THROTTLE_MS) || 35;

export function useRealtimeCursor({ boardId } = {}) {
  const { user } = useAuth();
  const {
    state: { scale, remoteCursors },
    cursor: { publishCursor, startCursorSubscription, stopCursorSubscription, setupCursorDisconnect, removeCursor },
  } = useCanvas();

  const localCursorRef = useRef(null);
  const throttledPublishRef = useRef(null);

  const cleanup = useCallback(() => {
    throttledPublishRef.current?.cancel?.();
    throttledPublishRef.current = null;
    stopCursorSubscription();
  }, [stopCursorSubscription]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const ensureThrottledPublish = useCallback(() => {
    if (!throttledPublishRef.current) {
      throttledPublishRef.current = throttle(async (payload) => {
        await publishCursor(payload);
      }, THROTTLE_MS);
    }
    return throttledPublishRef.current;
  }, [publishCursor]);

  const publishLocalCursor = useCallback(
    ({ x, y, scaleOverride }) => {
      if (!user?.uid) {
        return;
      }
      const color = getColorForUser(user.uid);
      const name = getInitials(user.displayName, user.email);
      const cursorPayload = {
        uid: user.uid,
        boardId,
        x,
        y,
        scale: scaleOverride ?? scale,
        name,
        color,
      };
      localCursorRef.current = cursorPayload;
      const throttledFn = ensureThrottledPublish();
      throttledFn(cursorPayload);
    },
    [boardId, ensureThrottledPublish, scale, user]
  );

  const clearLocalCursor = useCallback(async () => {
    throttledPublishRef.current?.cancel?.();
    if (user?.uid) {
      await removeCursor({ uid: user.uid, boardId });
    }
    localCursorRef.current = null;
  }, [boardId, removeCursor, user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }
    setupCursorDisconnect({ uid: user.uid, boardId });
    startCursorSubscription({ boardId, uid: user.uid });
    return () => {
      stopCursorSubscription();
      removeCursor({ uid: user.uid, boardId }).catch(() => {});
    };
  }, [boardId, removeCursor, setupCursorDisconnect, startCursorSubscription, stopCursorSubscription, user?.uid]);

  const value = useMemo(
    () => ({
      remoteCursors,
      publishLocalCursor,
      clearLocalCursor,
      localCursor: localCursorRef.current,
    }),
    [clearLocalCursor, publishLocalCursor, remoteCursors]
  );

  return value;
}


