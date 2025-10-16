/**
 * Operation Queue for offline persistence
 * Queues operations when offline and flushes when reconnected
 */

import { get, set, del } from 'idb-keyval';
import { createShape, updateShape, deleteShape } from '../services/firestoreService';
import { setCursorPosition } from '../services/realtimeCursorService';
import { setPresence } from '../services/presenceService';

const QUEUE_KEY_PREFIX = 'opQueue:';
const MAX_RETRY_ATTEMPTS = 5;
const INITIAL_BACKOFF_MS = 1000; // 1 second
const MAX_BACKOFF_MS = 32000; // 32 seconds

/**
 * Operation types
 */
export const OP_TYPES = {
  CREATE_SHAPE: 'createShape',
  UPDATE_SHAPE: 'updateShape',
  DELETE_SHAPE: 'deleteShape',
  UPDATE_CURSOR: 'updateCursor',
  UPDATE_PRESENCE: 'updatePresence',
};

/**
 * Get queue key for a board
 */
const getQueueKey = (boardId = 'default') => `${QUEUE_KEY_PREFIX}${boardId}`;

/**
 * Get queue for a board
 */
export async function getQueue(boardId = 'default') {
  try {
    const queue = await get(getQueueKey(boardId));
    return queue || [];
  } catch (error) {
    console.error('[OperationQueue] Error reading queue:', error);
    return [];
  }
}

/**
 * Save queue for a board
 */
async function saveQueue(queue, boardId = 'default') {
  try {
    await set(getQueueKey(boardId), queue);
  } catch (error) {
    console.error('[OperationQueue] Error saving queue:', error);
  }
}

/**
 * Enqueue an operation
 * @param {Object} operation - Operation to enqueue
 * @param {string} operation.id - Unique operation ID
 * @param {string} operation.type - Operation type (OP_TYPES)
 * @param {Object} operation.payload - Operation payload
 * @param {string} boardId - Board ID
 */
export async function enqueue(operation, boardId = 'default') {
  try {
    const queue = await getQueue(boardId);
    
    // Check for duplicate operation (idempotency)
    const existingIndex = queue.findIndex(op => op.id === operation.id);
    if (existingIndex !== -1) {
      // Update existing operation instead of adding duplicate
      queue[existingIndex] = {
        ...operation,
        timestamp: Date.now(),
        attempts: operation.attempts || 0,
        nextRetry: operation.nextRetry || Date.now(),
      };
    } else {
      // Add new operation
      queue.push({
        ...operation,
        timestamp: Date.now(),
        attempts: 0,
        nextRetry: Date.now(),
      });
    }
    
    await saveQueue(queue, boardId);
    
    // eslint-disable-next-line no-console
    console.log(`[OperationQueue] Enqueued ${operation.type}:`, operation.id);
    
    return true;
  } catch (error) {
    console.error('[OperationQueue] Error enqueueing operation:', error);
    return false;
  }
}

/**
 * Execute a single operation
 */
async function executeOperation(operation) {
  const { type, payload } = operation;
  
  switch (type) {
    case OP_TYPES.CREATE_SHAPE:
      await createShape(payload.shape, payload.boardId);
      break;
      
    case OP_TYPES.UPDATE_SHAPE:
      await updateShape(payload.shapeId, payload.updates, payload.boardId);
      break;
      
    case OP_TYPES.DELETE_SHAPE:
      await deleteShape(payload.shapeId, payload.boardId);
      break;
      
    case OP_TYPES.UPDATE_CURSOR:
      await setCursorPosition(payload);
      break;
      
    case OP_TYPES.UPDATE_PRESENCE:
      await setPresence(payload);
      break;
      
    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
  if (!error) return false;
  
  const retryableCodes = [
    'unavailable',
    'deadline-exceeded',
    'internal',
    'resource-exhausted',
    'aborted',
  ];
  
  // Check Firebase error code
  if (error.code && retryableCodes.includes(error.code.replace('firestore/', '').replace('database/', ''))) {
    return true;
  }
  
  // Check for network errors
  if (error.message && (
    error.message.includes('network') ||
    error.message.includes('offline') ||
    error.message.includes('fetch')
  )) {
    return true;
  }
  
  return false;
}

/**
 * Calculate next retry time with exponential backoff
 */
function calculateNextRetry(attempts) {
  const backoff = Math.min(
    INITIAL_BACKOFF_MS * Math.pow(2, attempts),
    MAX_BACKOFF_MS
  );
  return Date.now() + backoff;
}

/**
 * Flush queue - execute all pending operations
 * @param {string} boardId - Board ID
 * @returns {Object} { success: number, failed: number, retrying: number }
 */
export async function flush(boardId = 'default') {
  try {
    const queue = await getQueue(boardId);
    
    if (queue.length === 0) {
      return { success: 0, failed: 0, retrying: 0 };
    }
    
    // eslint-disable-next-line no-console
    console.log(`[OperationQueue] Flushing ${queue.length} operations...`);
    
    const now = Date.now();
    const results = {
      success: 0,
      failed: 0,
      retrying: 0,
    };
    
    const remainingQueue = [];
    
    // Sort by timestamp to maintain order
    const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const operation of sortedQueue) {
      // Skip if not ready for retry
      if (operation.nextRetry > now) {
        remainingQueue.push(operation);
        results.retrying++;
        continue;
      }
      
      try {
        await executeOperation(operation);
        results.success++;
        // eslint-disable-next-line no-console
        console.log(`[OperationQueue] Executed ${operation.type}:`, operation.id);
      } catch (error) {
        console.error(`[OperationQueue] Failed to execute ${operation.type}:`, operation.id, error);
        
        // Check if retryable
        if (isRetryableError(error) && operation.attempts < MAX_RETRY_ATTEMPTS) {
          // Re-queue with incremented attempt count
          remainingQueue.push({
            ...operation,
            attempts: operation.attempts + 1,
            nextRetry: calculateNextRetry(operation.attempts + 1),
            lastError: error.message,
          });
          results.retrying++;
        } else {
          // Non-retryable or max attempts reached
          results.failed++;
          // eslint-disable-next-line no-console
          console.error(`[OperationQueue] Dropped operation after ${operation.attempts} attempts:`, operation.id);
        }
      }
    }
    
    // Save remaining queue
    await saveQueue(remainingQueue, boardId);
    
    // eslint-disable-next-line no-console
    console.log('[OperationQueue] Flush complete:', results);
    
    return results;
  } catch (error) {
    console.error('[OperationQueue] Error flushing queue:', error);
    return { success: 0, failed: 0, retrying: 0 };
  }
}

/**
 * Check if there are pending operations
 */
export async function hasPending(boardId = 'default') {
  const queue = await getQueue(boardId);
  return queue.length > 0;
}

/**
 * Clear queue (for testing or manual intervention)
 */
export async function clearQueue(boardId = 'default') {
  try {
    await del(getQueueKey(boardId));
    return true;
  } catch (error) {
    console.error('[OperationQueue] Error clearing queue:', error);
    return false;
  }
}

/**
 * Get queue statistics
 */
export async function getStats(boardId = 'default') {
  const queue = await getQueue(boardId);
  const now = Date.now();
  
  return {
    total: queue.length,
    readyForRetry: queue.filter(op => op.nextRetry <= now).length,
    waitingRetry: queue.filter(op => op.nextRetry > now).length,
    byType: queue.reduce((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1;
      return acc;
    }, {}),
  };
}

// Export for testing
export const __testables = {
  getQueueKey,
  executeOperation,
  isRetryableError,
  calculateNextRetry,
};

