/**
 * Firestore service for shapes
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

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
    // eslint-disable-next-line no-console
    console.log('[firestoreService] Creating shape:', { shapeId: shape.id, uid: auth.currentUser?.uid, payload });
    await setDoc(ref, payload);
    // eslint-disable-next-line no-console
    console.log('[firestoreService] Shape created successfully:', shape.id);
    return { id: shape.id };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[firestoreService] Error creating shape:', error);
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
  onError,
} = {}) {
  const q = shapesCollectionRef(boardId);
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
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

