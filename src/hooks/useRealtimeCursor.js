import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { useAuth } from '../context/AuthContext';
import { throttle } from '../utils/throttle';
import { getColorForUser, getInitials } from '../utils/cursorColors';

const THROTTLE_MS = 50;

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
        console.warn('[useRealtimeCursor] Cannot publish cursor: no user.uid');
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
      console.log('[useRealtimeCursor] Publishing local cursor:', { x, y, boardId, uid: user.uid });
      localCursorRef.current = cursorPayload;
      const throttledFn = ensureThrottledPublish();
      throttledFn(cursorPayload);
    },
    [boardId, ensureThrottledPublish, scale, user]
  );

  const clearLocalCursor = useCallback(async () => {
    console.log('[useRealtimeCursor] Clearing local cursor');
    throttledPublishRef.current?.cancel?.();
    if (user?.uid) {
      await removeCursor({ uid: user.uid, boardId });
    }
    localCursorRef.current = null;
  }, [boardId, removeCursor, user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      console.log('[useRealtimeCursor] No user.uid, skipping cursor setup');
      return undefined;
    }
    console.log('[useRealtimeCursor] Setting up cursor for user:', user.uid, 'boardId:', boardId);
    setupCursorDisconnect({ uid: user.uid, boardId });
    startCursorSubscription({ boardId, uid: user.uid });
    return () => {
      console.log('[useRealtimeCursor] Cleaning up cursor for user:', user.uid);
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


