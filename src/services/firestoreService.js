/**
 * Firestore service for shapes
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
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
    throw new Error('User must be authenticated to create shapes');
  }
  return {
    id,
    type,
    props: { ...rest },
    deleted: false,
    createdBy: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
};

const fromFirestoreDoc = (docSnap) => {
  const data = docSnap.data();
  if (!data) return null;

  const { id, type, props = {}, deleted = false, createdAt, updatedAt, deletedAt } = data;
  return {
    id: id ?? docSnap.id,
    type,
    ...props,
    deleted,
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
        tx.update(ref, payload);
      }
    });
    return { id: shape.id };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[firestoreService] Error creating shape:', error);
    toast.error('Failed to create shape. Please try again.');
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
  const updatePayload = { updatedAt: serverTimestamp() };

  Object.keys(updates || {}).forEach((key) => {
    if (key === 'id' || key === 'type') return;
    updatePayload[`props.${key}`] = updates[key];
  });

  await updateDoc(ref, updatePayload);
  return { id: shapeId };
}

export async function updateShapeText(shapeId, text, boardId = DEFAULT_BOARD_ID) {
  const ref = shapeDocRef(shapeId, boardId);
  await updateDoc(ref, { 'props.text': text, updatedAt: serverTimestamp() });
  return { id: shapeId };
}

export async function deleteShape(shapeId, boardId = DEFAULT_BOARD_ID) {
  const ref = shapeDocRef(shapeId, boardId);
  await updateDoc(ref, {
    deleted: true,
    deletedAt: serverTimestamp(),
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

