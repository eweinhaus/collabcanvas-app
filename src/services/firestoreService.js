/**
 * Firestore service for shapes
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  writeBatch,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import toast from 'react-hot-toast';

import { firestore, auth } from './firebase';

const DEFAULT_BOARD_ID = 'default';

// Collection/doc refs
const shapesCollectionRef = (boardId = DEFAULT_BOARD_ID) =>
  collection(firestore, 'boards', boardId, 'shapes');

const shapeDocRef = (shapeId, boardId = DEFAULT_BOARD_ID) =>
  doc(firestore, 'boards', boardId, 'shapes', shapeId);

// Mapping helpers: local shape <-> firestore doc
const toFirestoreDoc = (shape) => {
  const { id, type, ...rest } = shape;
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('[firestoreService] No authenticated user found when creating shape');
    toast.error('You must be signed in to create shapes. Please refresh and sign in again.');
    throw new Error('User must be authenticated to create shapes');
  }
  
  // Ensure we have a valid UID
  if (!currentUser.uid) {
    console.error('[firestoreService] Authenticated user missing UID:', currentUser);
    toast.error('Authentication error. Please refresh and sign in again.');
    throw new Error('Authenticated user missing UID');
  }
  
  const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous';
  
  const doc = {
    id,
    type,
    props: { ...rest },
    deleted: false,
    createdBy: currentUser.uid,
    createdByName: userName,
    updatedBy: currentUser.uid, // Track who created it initially
    updatedByName: userName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  // Log for debugging in production
  console.log('[firestoreService] Creating shape with auth:', {
    shapeId: id,
    userId: currentUser.uid,
    userName,
    hasCreatedBy: !!doc.createdBy,
    hasUpdatedBy: !!doc.updatedBy,
    hasCreatedByName: !!doc.createdByName,
    hasUpdatedByName: !!doc.updatedByName,
  });
  
  return doc;
};

const fromFirestoreDoc = (docSnap) => {
  const data = docSnap.data();
  if (!data) return null;

  const { 
    id, 
    type, 
    props = {}, 
    deleted = false, 
    createdBy, 
    createdByName,
    updatedBy, 
    updatedByName,
    createdAt, 
    updatedAt, 
    deletedAt 
  } = data;
  return {
    id: id ?? docSnap.id,
    type,
    ...props,
    deleted,
    createdBy: createdBy ?? null,
    createdByName: createdByName ?? 'Unknown',
    updatedBy: updatedBy ?? createdBy ?? null, // Fallback to createdBy for legacy shapes
    updatedByName: updatedByName ?? createdByName ?? 'Unknown',
    createdAt: createdAt?.toMillis?.() ?? null,
    updatedAt: updatedAt?.toMillis?.() ?? null,
    deletedAt: deletedAt?.toMillis?.() ?? null,
  };
};

// CRUD operations
export async function createShape(shape, boardId = DEFAULT_BOARD_ID) {
  try {
    const ref = shapeDocRef(shape.id, boardId);
    const payload = toFirestoreDoc(shape);
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        tx.set(ref, payload);
        return;
      }
      const existing = snap.data();
      const existingUpdatedAt = existing?.updatedAt?.toMillis?.() ?? 0;
      const now = Date.now();
      if (now > existingUpdatedAt) {
        // For updates, only send fields that should be modified
        // Never update createdBy, createdByName, or createdAt
        const updatePayload = {
          id: payload.id,
          type: payload.type,
          props: payload.props,
          deleted: payload.deleted,
          updatedBy: payload.updatedBy,
          updatedByName: payload.updatedByName,
          updatedAt: payload.updatedAt,
        };
        tx.update(ref, updatePayload);
      }
    });
    return { id: shape.id };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[firestoreService] Error creating shape:', error);
    
    // Check for permission denied (403) errors
    if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
      console.error('[firestoreService] Permission denied. Auth state:', {
        hasCurrentUser: !!auth.currentUser,
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
      });
      toast.error('Permission denied. Please refresh the page and sign in again.');
    } else {
      toast.error('Failed to create shape. Please try again.');
    }
    throw error;
  }
}

/**
 * Create multiple shapes in a single batch operation
 * Firestore batch limit is 500 operations, so we chunk if needed
 * @param {Array} shapes - Array of shape objects to create
 * @param {string} boardId - Board ID
 * @returns {Promise<Array>} Array of created shape IDs
 */
export async function createShapesBatch(shapes, boardId = DEFAULT_BOARD_ID) {
  if (!shapes || shapes.length === 0) {
    return [];
  }

  // Single shape - use regular create
  if (shapes.length === 1) {
    await createShape(shapes[0], boardId);
    return [{ id: shapes[0].id }];
  }

  try {
    const BATCH_SIZE = 500; // Firestore batch limit
    const chunks = [];
    
    // Split into chunks if needed
    for (let i = 0; i < shapes.length; i += BATCH_SIZE) {
      chunks.push(shapes.slice(i, i + BATCH_SIZE));
    }

    const results = [];

    // Process each chunk
    for (const chunk of chunks) {
      const batch = writeBatch(firestore);
      
      chunk.forEach((shape) => {
        const ref = shapeDocRef(shape.id, boardId);
        const payload = toFirestoreDoc(shape);
        batch.set(ref, payload);
      });

      await batch.commit();
      results.push(...chunk.map((s) => ({ id: s.id })));
    }

    return results;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[firestoreService] Error creating shapes batch:', error);
    
    // Check for permission denied (403) errors
    if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
      console.error('[firestoreService] Permission denied in batch. Auth state:', {
        hasCurrentUser: !!auth.currentUser,
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
      });
      toast.error('Permission denied. Please refresh the page and sign in again.');
    } else {
      toast.error(`Failed to create ${shapes.length} shapes. Please try again.`);
    }
    throw error;
  }
}

/**
 * Create multiple shapes in a single batch operation
 * Firestore batch limit is 500 operations, so we chunk if needed
 * @param {Array} shapes - Array of shape objects to create
 * @param {string} boardId - Board ID
 * @returns {Promise<Array>} Array of created shape IDs
 */
export async function createShapesBatch(shapes, boardId = DEFAULT_BOARD_ID) {
  if (!shapes || shapes.length === 0) {
    return [];
  }

  // Single shape - use regular create
  if (shapes.length === 1) {
    await createShape(shapes[0], boardId);
    return [{ id: shapes[0].id }];
  }

  try {
    const BATCH_SIZE = 500; // Firestore batch limit
    const chunks = [];
    
    // Split into chunks if needed
    for (let i = 0; i < shapes.length; i += BATCH_SIZE) {
      chunks.push(shapes.slice(i, i + BATCH_SIZE));
    }

    const results = [];

    // Process each chunk
    for (const chunk of chunks) {
      const batch = writeBatch(firestore);
      
      chunk.forEach((shape) => {
        const ref = shapeDocRef(shape.id, boardId);
        const payload = toFirestoreDoc(shape);
        batch.set(ref, payload);
      });

      await batch.commit();
      results.push(...chunk.map((s) => ({ id: s.id })));
    }

    return results;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[firestoreService] Error creating shapes batch:', error);
    toast.error(`Failed to create ${shapes.length} shapes. Please try again.`);
    throw error;
  }
}

export async function getShape(shapeId, boardId = DEFAULT_BOARD_ID) {
  const ref = shapeDocRef(shapeId, boardId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const shape = fromFirestoreDoc(snap);
  if (shape?.deleted) return null;
  return shape;
}

export async function getAllShapes(boardId = DEFAULT_BOARD_ID) {
  const q = query(shapesCollectionRef(boardId), where('deleted', '==', false));
  const snaps = await getDocs(q);
  const shapes = [];
  snaps.forEach((docSnap) => {
    const shape = fromFirestoreDoc(docSnap);
    if (shape) shapes.push(shape);
  });
  return shapes;
}

export async function updateShape(shapeId, updates, boardId = DEFAULT_BOARD_ID) {
  const ref = shapeDocRef(shapeId, boardId);
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to update shapes');
  }

  const updatePayload = {
    updatedBy: currentUser.uid,
    updatedByName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
    updatedAt: serverTimestamp(),
  };

  Object.keys(updates || {}).forEach((key) => {
    if (key === 'id' || key === 'type') return;
    updatePayload[`props.${key}`] = updates[key];
  });

  await updateDoc(ref, updatePayload);
  return { id: shapeId };
}

export async function updateShapeText(shapeId, text, boardId = DEFAULT_BOARD_ID) {
  const ref = shapeDocRef(shapeId, boardId);
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to update shapes');
  }

  await updateDoc(ref, {
    'props.text': text,
    updatedBy: currentUser.uid,
    updatedByName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
    updatedAt: serverTimestamp(),
  });
  return { id: shapeId };
}

export async function deleteShape(shapeId, boardId = DEFAULT_BOARD_ID) {
  const ref = shapeDocRef(shapeId, boardId);
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to delete shapes');
  }

  await updateDoc(ref, {
    deleted: true,
    deletedAt: serverTimestamp(),
    updatedBy: currentUser.uid, // Track who deleted it
    updatedByName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
    updatedAt: serverTimestamp(),
  });
  return { id: shapeId };
}

// Real-time listener
export function subscribeToShapes({
  boardId = DEFAULT_BOARD_ID,
  onChange,
  onReady,
  onError,
} = {}) {
  const q = shapesCollectionRef(boardId);
  let readyFired = false;
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (!readyFired) {
        readyFired = true;
        onReady?.();
      }
      snapshot.docChanges().forEach((change) => {
        const shape = fromFirestoreDoc(change.doc);
        if (!shape) return;

        if (shape.deleted) {
          onChange?.({ type: 'removed', shape });
        } else if (change.type === 'added') {
          onChange?.({ type: 'added', shape });
        } else if (change.type === 'modified') {
          onChange?.({ type: 'modified', shape });
        } else if (change.type === 'removed') {
          // Hard deletes are not expected, treat as removed
          onChange?.({ type: 'removed', shape });
        }
      });
    },
    (err) => onError?.(err)
  );

  return unsubscribe;
}

export const __testables = {
  toFirestoreDoc,
  fromFirestoreDoc,
  shapeDocRef,
  shapesCollectionRef,
};

