/**
 * Firestore service for collaborative comments on shapes
 * Path: boards/{boardId}/shapes/{shapeId}/comments/{commentId}
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import toast from 'react-hot-toast';

import { firestore, auth } from './firebase';
import { logger } from '../utils/logger';

const DEFAULT_BOARD_ID = 'default';
const MAX_COMMENT_LENGTH = 500;

// Collection/doc refs
const commentsCollectionRef = (shapeId, boardId = DEFAULT_BOARD_ID) =>
  collection(firestore, 'boards', boardId, 'shapes', shapeId, 'comments');

const commentDocRef = (shapeId, commentId, boardId = DEFAULT_BOARD_ID) =>
  doc(firestore, 'boards', boardId, 'shapes', shapeId, 'comments', commentId);

// Mapping helpers: local comment <-> firestore doc
const toFirestoreDoc = (text) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    logger.error('commentService: No authenticated user found when creating comment');
    toast.error('You must be signed in to comment. Please refresh and sign in again.');
    throw new Error('User must be authenticated to create comments');
  }
  
  // Ensure we have a valid UID
  if (!currentUser.uid) {
    logger.error('commentService: Authenticated user missing UID:', currentUser);
    toast.error('Authentication error. Please refresh and sign in again.');
    throw new Error('Authenticated user missing UID');
  }

  // Validate text length
  if (!text || typeof text !== 'string') {
    toast.error('Comment text is required');
    throw new Error('Comment text must be a non-empty string');
  }

  if (text.length > MAX_COMMENT_LENGTH) {
    toast.error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
    throw new Error(`Comment text exceeds maximum length of ${MAX_COMMENT_LENGTH}`);
  }
  
  const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous';
  
  const commentDoc = {
    text: text.trim(),
    authorId: currentUser.uid,
    authorName: userName,
    authorEmail: currentUser.email || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    edited: false,
  };
  
  logger.debug('commentService: Creating comment with auth:', {
    userId: currentUser.uid,
    userName,
    textLength: text.length,
    hasAuthorId: !!commentDoc.authorId,
    hasAuthorName: !!commentDoc.authorName,
  });
  
  return commentDoc;
};

const fromFirestoreDoc = (docSnap) => {
  const data = docSnap.data();
  if (!data) return null;

  const { 
    text,
    authorId, 
    authorName,
    authorEmail,
    createdAt, 
    updatedAt,
    edited = false,
  } = data;

  return {
    id: docSnap.id,
    text: text || '',
    authorId: authorId ?? null,
    authorName: authorName ?? 'Unknown',
    authorEmail: authorEmail ?? '',
    createdAt: createdAt?.toMillis?.() ?? null,
    updatedAt: updatedAt?.toMillis?.() ?? null,
    edited,
  };
};

// Verify current user is the author of a comment
const verifyAuthor = async (shapeId, commentId, boardId = DEFAULT_BOARD_ID) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated');
  }

  const ref = commentDocRef(shapeId, commentId, boardId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) {
    throw new Error('Comment not found');
  }

  const comment = snap.data();
  if (comment.authorId !== currentUser.uid) {
    toast.error('You can only edit or delete your own comments');
    throw new Error('Unauthorized: You can only modify your own comments');
  }

  return true;
};

// CRUD operations

/**
 * Create a new comment on a shape
 * @param {string} shapeId - The shape ID to comment on
 * @param {string} text - The comment text (max 500 chars)
 * @param {string} boardId - The board ID
 * @returns {Promise<{id: string}>} The created comment ID
 */
export async function createComment(shapeId, text, boardId = DEFAULT_BOARD_ID) {
  try {
    if (!shapeId) {
      throw new Error('shapeId is required');
    }

    const collectionRef = commentsCollectionRef(shapeId, boardId);
    const payload = toFirestoreDoc(text);
    const docRef = await addDoc(collectionRef, payload);
    
    logger.debug('commentService: Comment created successfully:', docRef.id);
    return { id: docRef.id };
  } catch (error) {
    logger.error('commentService: Error creating comment:', error);
    
    // Check for permission denied (403) errors
    if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
      logger.error('commentService: Permission denied. Auth state:', {
        hasCurrentUser: !!auth.currentUser,
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
      });
      toast.error('Permission denied. Please refresh the page and sign in again.');
    } else if (!error.message?.includes('characters or less') && !error.message?.includes('required')) {
      // Don't show generic error if we already showed specific validation error
      toast.error('Failed to create comment. Please try again.');
    }
    throw error;
  }
}

/**
 * Update an existing comment (author only)
 * @param {string} shapeId - The shape ID
 * @param {string} commentId - The comment ID to update
 * @param {string} text - The new comment text
 * @param {string} boardId - The board ID
 * @returns {Promise<{id: string}>}
 */
export async function updateComment(shapeId, commentId, text, boardId = DEFAULT_BOARD_ID) {
  try {
    if (!shapeId || !commentId) {
      throw new Error('shapeId and commentId are required');
    }

    // Validate text
    if (!text || typeof text !== 'string') {
      toast.error('Comment text is required');
      throw new Error('Comment text must be a non-empty string');
    }

    if (text.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
      throw new Error(`Comment text exceeds maximum length of ${MAX_COMMENT_LENGTH}`);
    }

    const ref = commentDocRef(shapeId, commentId, boardId);
    const updatePayload = {
      text: text.trim(),
      updatedAt: serverTimestamp(),
      edited: true,
    };

    await updateDoc(ref, updatePayload);
    logger.debug('commentService: Comment updated successfully:', commentId);
    return { id: commentId };
  } catch (error) {
    logger.error('commentService: Error updating comment:', error);
    
    if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
      toast.error('Permission denied. Please refresh and try again.');
    } else if (!error.message?.includes('characters or less') && 
               !error.message?.includes('required')) {
      toast.error('Failed to update comment. Please try again.');
    }
    throw error;
  }
}

/**
 * Delete a comment (author only)
 * @param {string} shapeId - The shape ID
 * @param {string} commentId - The comment ID to delete
 * @param {string} boardId - The board ID
 * @returns {Promise<{id: string}>}
 */
export async function deleteComment(shapeId, commentId, boardId = DEFAULT_BOARD_ID) {
  try {
    if (!shapeId || !commentId) {
      throw new Error('shapeId and commentId are required');
    }

    const ref = commentDocRef(shapeId, commentId, boardId);
    await deleteDoc(ref);
    
    logger.debug('commentService: Comment deleted successfully:', commentId);
    return { id: commentId };
  } catch (error) {
    logger.error('commentService: Error deleting comment:', error);
    
    if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
      toast.error('Permission denied. Please refresh and try again.');
    } else {
      toast.error('Failed to delete comment. Please try again.');
    }
    throw error;
  }
}

/**
 * Get all comments for a shape (one-time fetch)
 * @param {string} shapeId - The shape ID
 * @param {string} boardId - The board ID
 * @returns {Promise<Array>} Array of comments sorted by creation time (oldest first)
 */
export async function getComments(shapeId, boardId = DEFAULT_BOARD_ID) {
  try {
    if (!shapeId) {
      throw new Error('shapeId is required');
    }

    const q = query(
      commentsCollectionRef(shapeId, boardId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const comments = [];
    
    snapshot.forEach((docSnap) => {
      const comment = fromFirestoreDoc(docSnap);
      if (comment) {
        comments.push(comment);
      }
    });
    
    logger.debug(`commentService: Fetched ${comments.length} comments for shape ${shapeId}`);
    return comments;
  } catch (error) {
    logger.error('commentService: Error fetching comments:', error);
    toast.error('Failed to load comments. Please try again.');
    throw error;
  }
}

/**
 * Subscribe to real-time updates for comments on a shape
 * @param {string} shapeId - The shape ID
 * @param {string} boardId - The board ID
 * @param {Function} callback - Callback function called with {type: 'added'|'modified'|'removed', comment}
 * @param {Function} onReady - Optional callback called when subscription is ready (even if 0 comments)
 * @returns {Function} Unsubscribe function
 */
export function subscribeToComments(shapeId, boardId = DEFAULT_BOARD_ID, callback, onReady) {
  if (!shapeId) {
    throw new Error('shapeId is required');
  }

  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  // Check if user is authenticated before subscribing
  const currentUser = auth.currentUser;
  if (!currentUser) {
    logger.warn('commentService: Cannot subscribe - user not authenticated');
    // Call onReady with empty result to prevent loading state
    if (onReady) {
      onReady();
    }
    // Return no-op unsubscribe
    return () => {};
  }

  logger.debug(`commentService: Subscribing to comments for shape ${shapeId}`);

  const q = query(
    commentsCollectionRef(shapeId, boardId),
    orderBy('createdAt', 'asc')
  );

  let isFirstSnapshot = true;
  let hasShownError = false;

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const comment = fromFirestoreDoc(change.doc);
        if (!comment) return;

        if (change.type === 'added') {
          callback({ type: 'added', comment });
        } else if (change.type === 'modified') {
          callback({ type: 'modified', comment });
        } else if (change.type === 'removed') {
          callback({ type: 'removed', comment });
        }
      });

      // Call onReady after first snapshot (even if empty)
      if (isFirstSnapshot && onReady) {
        isFirstSnapshot = false;
        onReady();
      }
    },
    (error) => {
      logger.error('commentService: Error in comment subscription:', error);
      logger.error('commentService: Error details:', {
        code: error.code,
        message: error.message,
        shapeId,
        boardId,
        hasAuth: !!auth.currentUser,
        userId: auth.currentUser?.uid,
      });

      // Only show error once per subscription to avoid spam
      if (!hasShownError) {
        hasShownError = true;
        
        // Provide more specific error messages
        if (error.code === 'permission-denied') {
          logger.error('commentService: Permission denied - check Firestore rules and authentication');
          toast.error('Unable to load comments. Please refresh the page and sign in again.');
        } else if (error.code === 'unavailable') {
          logger.warn('commentService: Firestore temporarily unavailable - will retry automatically');
          // Don't show error for transient network issues - Firestore will retry
        } else {
          toast.error('Unable to load comments. Please refresh the page.');
        }
      }
    }
  );

  return unsubscribe;
}

// Export for testing
export const __testables = {
  toFirestoreDoc,
  fromFirestoreDoc,
  verifyAuthor,
  commentDocRef,
  commentsCollectionRef,
  MAX_COMMENT_LENGTH,
};

