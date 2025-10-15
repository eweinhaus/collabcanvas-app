/**
 * useConnectionStatus hook
 * Monitors network and Firebase connectivity, plus operation queue status
 */

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDB } from '../services/firebase';
import { hasPending, getStats } from '../offline/operationQueue';

export const CONNECTION_STATUS = {
  OFFLINE: 'offline',
  RECONNECTING: 'reconnecting',
  SYNCING: 'syncing',
  CONNECTED: 'connected',
};

/**
 * Hook to monitor connection status
 * @param {string} boardId - Board ID for operation queue check
 * @returns {Object} { status, isOnline, isFirebaseConnected, pendingOps, queueStats }
 */
export function useConnectionStatus(boardId = 'default') {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [pendingOps, setPendingOps] = useState(0);
  const [queueStats, setQueueStats] = useState(null);
  const [status, setStatus] = useState(CONNECTION_STATUS.CONNECTED);

  // Monitor browser online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Firebase connectivity
  useEffect(() => {
    if (!isOnline) {
      setIsFirebaseConnected(false);
      return undefined;
    }

    let isMounted = true;
    let unsubscribe;

    const setupFirebaseListener = async () => {
      try {
        const connectedRef = ref(realtimeDB, '.info/connected');
        
        unsubscribe = onValue(connectedRef, (snapshot) => {
          if (!isMounted) return;
          const connected = snapshot.val();
          setIsFirebaseConnected(connected === true);
        }, (error) => {
          if (!isMounted) return;
          console.warn('[useConnectionStatus] Firebase connection error:', error);
          setIsFirebaseConnected(false);
        });
      } catch (error) {
        if (!isMounted) return;
        console.warn('[useConnectionStatus] Error setting up Firebase listener:', error);
        setIsFirebaseConnected(false);
      }
    };

    setupFirebaseListener();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isOnline]);

  // Monitor operation queue
  useEffect(() => {
    let mounted = true;
    let intervalId;

    const checkQueue = async () => {
      if (!mounted) return;
      
      try {
        const pending = await hasPending(boardId);
        const stats = await getStats(boardId);
        
        if (mounted) {
          setPendingOps(stats.total);
          setQueueStats(stats);
        }
      } catch (error) {
        console.error('[useConnectionStatus] Error checking queue:', error);
      }
    };

    // Check immediately
    checkQueue();

    // Check every 2 seconds
    intervalId = setInterval(checkQueue, 2000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [boardId]);

  // Determine overall status
  useEffect(() => {
    if (!isOnline) {
      setStatus(CONNECTION_STATUS.OFFLINE);
    } else if (!isFirebaseConnected) {
      setStatus(CONNECTION_STATUS.RECONNECTING);
    } else if (pendingOps > 0) {
      setStatus(CONNECTION_STATUS.SYNCING);
    } else {
      setStatus(CONNECTION_STATUS.CONNECTED);
    }
  }, [isOnline, isFirebaseConnected, pendingOps]);

  return {
    status,
    isOnline,
    isFirebaseConnected,
    pendingOps,
    queueStats,
  };
}

