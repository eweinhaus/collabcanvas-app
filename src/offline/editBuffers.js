/**
 * Edit Buffers for mid-operation state preservation
 * Stores full shape properties in IndexedDB with fallback to SessionStorage
 */

import { get, set, del, keys } from 'idb-keyval';

const BUFFER_KEY_PREFIX = 'editBuffer:';
const SESSION_FALLBACK_PREFIX = 'editBuffer:';

/**
 * Check if IndexedDB is available
 */
let idbAvailable = true;
async function checkIDBAvailability() {
  try {
    await set('__idb_test__', 'test');
    await del('__idb_test__');
    return true;
  } catch {
    return false;
  }
}

// Initialize IDB availability check
checkIDBAvailability().then(available => {
  idbAvailable = available;
  if (!available) {
    console.warn('[EditBuffers] IndexedDB not available, falling back to SessionStorage');
  }
});

/**
 * Get buffer key for a shape
 */
const getBufferKey = (shapeId) => `${BUFFER_KEY_PREFIX}${shapeId}`;

/**
 * Set edit buffer for a shape (throttled externally)
 * @param {string} shapeId - Shape ID
 * @param {Object} shapeData - Full shape properties
 */
export async function setEditBuffer(shapeId, shapeData) {
  const key = getBufferKey(shapeId);
  const data = {
    ...shapeData,
    updatedAt: Date.now(),
    bufferedAt: Date.now(),
  };
  
  try {
    if (idbAvailable) {
      await set(key, data);
    } else {
      // Fallback to SessionStorage
      sessionStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error('[EditBuffers] Error setting buffer:', error);
    // Try SessionStorage as fallback
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (fallbackError) {
      console.error('[EditBuffers] SessionStorage fallback also failed:', fallbackError);
    }
  }
}

/**
 * Get edit buffer for a shape
 * @param {string} shapeId - Shape ID
 * @returns {Object|null} Buffered shape data or null
 */
export async function getEditBuffer(shapeId) {
  const key = getBufferKey(shapeId);
  
  try {
    if (idbAvailable) {
      const data = await get(key);
      return data || null;
    } else {
      // Fallback to SessionStorage
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }
  } catch (error) {
    console.error('[EditBuffers] Error getting buffer:', error);
    // Try SessionStorage as fallback
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (fallbackError) {
      return null;
    }
  }
}

/**
 * Remove edit buffer for a shape
 * @param {string} shapeId - Shape ID
 */
export async function removeEditBuffer(shapeId) {
  const key = getBufferKey(shapeId);
  
  try {
    if (idbAvailable) {
      await del(key);
    } else {
      sessionStorage.removeItem(key);
    }
  } catch (error) {
    console.error('[EditBuffers] Error removing buffer:', error);
  }
}

/**
 * Get all edit buffers
 * @returns {Array} Array of { shapeId, data } objects
 */
export async function getAllEditBuffers() {
  const buffers = [];
  
  try {
    if (idbAvailable) {
      const allKeys = await keys();
      const bufferKeys = allKeys.filter(k => 
        typeof k === 'string' && k.startsWith(BUFFER_KEY_PREFIX)
      );
      
      for (const key of bufferKeys) {
        const shapeId = key.replace(BUFFER_KEY_PREFIX, '');
        const data = await get(key);
        if (data) {
          buffers.push({ shapeId, data });
        }
      }
    } else {
      // Fallback to SessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(SESSION_FALLBACK_PREFIX)) {
          const shapeId = key.replace(SESSION_FALLBACK_PREFIX, '');
          const raw = sessionStorage.getItem(key);
          if (raw) {
            try {
              const data = JSON.parse(raw);
              buffers.push({ shapeId, data });
            } catch (e) {
              // Ignore malformed data
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[EditBuffers] Error getting all buffers:', error);
  }
  
  return buffers;
}

/**
 * Clear all edit buffers
 */
export async function clearAllEditBuffers() {
  try {
    if (idbAvailable) {
      const allKeys = await keys();
      const bufferKeys = allKeys.filter(k => 
        typeof k === 'string' && k.startsWith(BUFFER_KEY_PREFIX)
      );
      
      for (const key of bufferKeys) {
        await del(key);
      }
    } else {
      // Fallback to SessionStorage
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(SESSION_FALLBACK_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
  } catch (error) {
    console.error('[EditBuffers] Error clearing all buffers:', error);
  }
}

/**
 * Flush buffers before page unload
 * This is a lighter version that just clears old buffers
 */
export function flushEditBuffersBeforeUnload() {
  try {
    // Clear SessionStorage buffers (IDB will persist)
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(SESSION_FALLBACK_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (e) {
    // Ignore errors during unload
  }
}

/**
 * Register pagehide listener for buffer cleanup
 */
export function registerEditBufferCleanup() {
  const handler = () => {
    flushEditBuffersBeforeUnload();
  };
  
  window.addEventListener('pagehide', handler);
  
  return () => {
    window.removeEventListener('pagehide', handler);
  };
}

// Export for testing
export const __testables = {
  getBufferKey,
  checkIDBAvailability,
};

