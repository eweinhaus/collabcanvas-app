import { useCallback, useEffect } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { useAuth } from '../context/AuthContext';
import { setPresence, removePresence, registerDisconnectCleanup } from '../services/presenceService';
import { getColorForUser, getInitials } from '../utils/cursorColors';

export function useRealtimePresence({ boardId = 'default' } = {}) {
  const { user } = useAuth();
  const { presence: { startPresenceSubscription, stopPresenceSubscription } } = useCanvas();

  const setup = useCallback(async () => {
    if (!user?.uid) return;
    const color = getColorForUser(user.uid);
    const name = user.displayName || getInitials(user.displayName, user.email);
    await setPresence({ uid: user.uid, boardId, name, color });
    registerDisconnectCleanup({ uid: user.uid, boardId });
    startPresenceSubscription({ boardId, uid: user.uid });
  }, [boardId, startPresenceSubscription, user?.displayName, user?.email, user?.uid]);

  useEffect(() => {
    setup();
    return () => {
      stopPresenceSubscription();
      if (user?.uid) {
        removePresence({ uid: user.uid, boardId }).catch(() => {});
      }
    };
  }, [boardId, setup, stopPresenceSubscription, user?.uid]);
}


