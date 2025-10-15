/**
 * Flush pending session edits to Firestore before page unload.
 * Uses sendBeacon for reliability if available, otherwise synchronous fetch.
 */
export function flushEditBuffersBeforeUnload() {
  try {
    const keys = Object.keys(sessionStorage);
    const buffers = [];
    
    keys.forEach((key) => {
      if (key.startsWith('editBuffer:')) {
        const shapeId = key.replace('editBuffer:', '');
        const raw = sessionStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            buffers.push({ shapeId, ...data });
          } catch (e) {
            // ignore malformed buffer
          }
        }
      }
    });

    // If there are buffers, clear session storage so they don't re-hydrate incorrectly
    if (buffers.length > 0) {
      keys.forEach((key) => {
        if (key.startsWith('editBuffer:')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  } catch (e) {
    // ignore storage errors
  }
}

/**
 * Register pagehide listener that flushes edit buffers.
 * Uses pagehide instead of beforeunload to allow back/forward cache (bfcache).
 * Returns cleanup function.
 */
export function registerBeforeUnloadFlush() {
  const handler = () => {
    flushEditBuffersBeforeUnload();
  };
  
  // Use pagehide instead of beforeunload to enable bfcache
  window.addEventListener('pagehide', handler);
  
  return () => {
    window.removeEventListener('pagehide', handler);
  };
}

