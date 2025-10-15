/**
 * Batch Shape Creation Utility
 * 
 * Handles efficient batch creation of multiple shapes with Firestore batch writes.
 * Optimized for creating large numbers of shapes (e.g., grids) efficiently.
 */

import { writeBatch, doc } from 'firebase/firestore';
import { firestore, auth } from '../services/firebase';
import { createShape } from './shapes';
import { normalizeColor } from './colorNormalizer';
import toast from 'react-hot-toast';

const DEFAULT_BOARD_ID = 'default';

/**
 * Firestore batch write limit is 500 operations
 * We use a conservative limit to be safe
 */
const FIRESTORE_BATCH_LIMIT = 250;

/**
 * Convert shape config to Firestore document data
 * Similar to toFirestoreDoc in firestoreService but without relying on it
 * @param {Object} shape - Shape object with id, type, and properties
 * @returns {Object} Firestore document data
 */
const toFirestoreDoc = (shape) => {
  const { id, type, ...rest } = shape;
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('User must be authenticated to create shapes');
  }

  return {
    id,
    type,
    props: { ...rest },
    deleted: false,
    createdBy: currentUser.uid,
    createdAt: new Date(), // Use Date.now() for client-side timestamp
    updatedAt: new Date(),
  };
};

/**
 * Create multiple shapes in batches using Firestore batch writes
 * @param {Array<Object>} shapeConfigs - Array of shape configurations (from gridGenerator)
 * @param {string} boardId - Board ID (default: 'default')
 * @param {Function} onProgress - Optional progress callback (current, total)
 * @returns {Promise<Array<Object>>} Array of created shapes with IDs
 */
export const batchCreateShapes = async (shapeConfigs, boardId = DEFAULT_BOARD_ID, onProgress = null) => {
  if (!Array.isArray(shapeConfigs) || shapeConfigs.length === 0) {
    throw new Error('shapeConfigs must be a non-empty array');
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to create shapes');
  }

  // Total number of shapes to create
  const totalShapes = shapeConfigs.length;

  // Validate total count against Firestore limits
  if (totalShapes > 500) {
    throw new Error(`Cannot create more than 500 shapes at once (requested: ${totalShapes})`);
  }

  try {
    // Step 1: Create actual shape objects from configs (adds IDs)
    const shapes = shapeConfigs.map((config) => {
      // Normalize color if present
      const normalizedColor = config.color ? normalizeColor(config.color) : undefined;
      
      // Create shape object using shapes utility
      const overrides = {
        ...config,
        fill: normalizedColor,
      };
      
      // Remove metadata that shouldn't be in shape
      delete overrides.color;
      delete overrides.type;
      delete overrides.x;
      delete overrides.y;
      
      return createShape(config.type, config.x, config.y, overrides);
    });

    // Step 2: Split into batches for Firestore
    const batches = [];
    for (let i = 0; i < shapes.length; i += FIRESTORE_BATCH_LIMIT) {
      batches.push(shapes.slice(i, i + FIRESTORE_BATCH_LIMIT));
    }

    // Step 3: Execute batch writes
    let processedCount = 0;
    
    for (const batch of batches) {
      const firestoreBatch = writeBatch(firestore);
      
      // Add all shapes in this batch
      batch.forEach((shape) => {
        const docRef = doc(firestore, 'boards', boardId, 'shapes', shape.id);
        const docData = toFirestoreDoc(shape);
        firestoreBatch.set(docRef, docData);
      });
      
      // Commit this batch
      await firestoreBatch.commit();
      
      processedCount += batch.length;
      
      // Report progress
      if (onProgress) {
        onProgress(processedCount, totalShapes);
      }
    }

    return shapes;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[batchCreateShapes] Error creating shapes:', error);
    toast.error(`Failed to create shapes: ${error.message}`);
    throw error;
  }
};

/**
 * Estimate time to create shapes (for UI feedback)
 * @param {number} shapeCount - Number of shapes to create
 * @returns {number} Estimated time in milliseconds
 */
export const estimateCreationTime = (shapeCount) => {
  // Rough estimate: ~50ms per batch + 10ms per shape
  const batchCount = Math.ceil(shapeCount / FIRESTORE_BATCH_LIMIT);
  return (batchCount * 50) + (shapeCount * 10);
};

/**
 * Check if batch creation is safe (won't exceed limits)
 * @param {number} shapeCount - Number of shapes to create
 * @returns {Object} { safe: boolean, maxAllowed: number, reason?: string }
 */
export const validateBatchSize = (shapeCount) => {
  const MAX_SHAPES = 500;
  
  if (shapeCount > MAX_SHAPES) {
    return {
      safe: false,
      maxAllowed: MAX_SHAPES,
      reason: `Cannot create ${shapeCount} shapes. Maximum allowed: ${MAX_SHAPES}`,
    };
  }
  
  return {
    safe: true,
    maxAllowed: MAX_SHAPES,
  };
};

export default {
  batchCreateShapes,
  estimateCreationTime,
  validateBatchSize,
  FIRESTORE_BATCH_LIMIT,
};

