/**
 * Enhanced Firestore service with offline operation queue
 * Wraps firestoreService to add offline support
 */

import * as firestoreService from './firestoreService';
import { enqueue, OP_TYPES } from '../offline/operationQueue';
import { v4 as uuidv4 } from '../utils/uuid';

/**
 * Check if we should queue the operation (offline or Firebase error)
 */
function shouldQueue(error) {
  // Check if offline
  if (!navigator.onLine) {
    return true;
  }
  
  // Check for Firebase errors that indicate connectivity issues
  if (error) {
    const retryableCodes = [
      'unavailable',
      'deadline-exceeded',
      'internal',
      'resource-exhausted',
      'aborted',
    ];
    
    const errorCode = error.code?.replace('firestore/', '').replace('database/', '');
    if (retryableCodes.includes(errorCode)) {
      return true;
    }
    
    if (error.message && (
      error.message.includes('network') ||
      error.message.includes('offline') ||
      error.message.includes('fetch')
    )) {
      return true;
    }
  }
  
  return false;
}

/**
 * Create shape with offline queue support
 */
export async function createShape(shape, boardId = 'default') {
  try {
    // Try to create immediately
    return await firestoreService.createShape(shape, boardId);
  } catch (error) {
    // If offline or retryable error, queue the operation
    if (shouldQueue(error)) {
      const opId = `create-${shape.id}-${Date.now()}`;
      await enqueue({
        id: opId,
        type: OP_TYPES.CREATE_SHAPE,
        payload: { shape, boardId },
      }, boardId);
      
      // Return success to allow optimistic UI
      return { id: shape.id, queued: true };
    }
    
    // Non-retryable error, rethrow
    throw error;
  }
}

/**
 * Create multiple shapes with offline queue support
 */
export async function createShapesBatch(shapes, boardId = 'default') {
  try {
    // Try to create immediately
    return await firestoreService.createShapesBatch(shapes, boardId);
  } catch (error) {
    // If offline or retryable error, queue individual operations
    if (shouldQueue(error)) {
      const results = [];
      
      for (const shape of shapes) {
        const opId = `create-${shape.id}-${Date.now()}`;
        await enqueue({
          id: opId,
          type: OP_TYPES.CREATE_SHAPE,
          payload: { shape, boardId },
        }, boardId);
        
        results.push({ id: shape.id, queued: true });
      }
      
      return results;
    }
    
    // Non-retryable error, rethrow
    throw error;
  }
}

/**
 * Update shape with offline queue support
 */
export async function updateShape(shapeId, updates, boardId = 'default') {
  try {
    // Try to update immediately
    return await firestoreService.updateShape(shapeId, updates, boardId);
  } catch (error) {
    // If offline or retryable error, queue the operation
    if (shouldQueue(error)) {
      const opId = `update-${shapeId}-${Date.now()}`;
      await enqueue({
        id: opId,
        type: OP_TYPES.UPDATE_SHAPE,
        payload: { shapeId, updates, boardId },
      }, boardId);
      
      // Return success to allow optimistic UI
      return { id: shapeId, queued: true };
    }
    
    // Non-retryable error, rethrow
    throw error;
  }
}

/**
 * Update shape text with offline queue support
 */
export async function updateShapeText(shapeId, text, boardId = 'default') {
  // Delegate to updateShape with text update
  return updateShape(shapeId, { text }, boardId);
}

/**
 * Delete shape with offline queue support
 */
export async function deleteShape(shapeId, boardId = 'default') {
  try {
    // Try to delete immediately
    return await firestoreService.deleteShape(shapeId, boardId);
  } catch (error) {
    // If offline or retryable error, queue the operation
    if (shouldQueue(error)) {
      const opId = `delete-${shapeId}-${Date.now()}`;
      await enqueue({
        id: opId,
        type: OP_TYPES.DELETE_SHAPE,
        payload: { shapeId, boardId },
      }, boardId);
      
      // Return success to allow optimistic UI
      return { id: shapeId, queued: true };
    }
    
    // Non-retryable error, rethrow
    throw error;
  }
}

// Re-export read operations directly (no need to queue reads)
export const { 
  getShape, 
  getAllShapes, 
  subscribeToShapes,
  __testables 
} = firestoreService;

