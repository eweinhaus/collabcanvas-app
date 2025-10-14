/**
 * Toast Hook for displaying temporary notifications
 * Simple implementation for AI feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(0);

  const show = useCallback((message, type = TOAST_TYPES.INFO, duration = 3000) => {
    const id = nextIdRef.current++;
    
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return show(message, TOAST_TYPES.SUCCESS, duration);
  }, [show]);

  const error = useCallback((message, duration) => {
    return show(message, TOAST_TYPES.ERROR, duration);
  }, [show]);

  const info = useCallback((message, duration) => {
    return show(message, TOAST_TYPES.INFO, duration);
  }, [show]);

  return {
    toasts,
    show,
    dismiss,
    success,
    error,
    info,
  };
};

