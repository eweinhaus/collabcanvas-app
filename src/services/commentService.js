/**
 * Firestore service for board-level collaborative comments
 * Path: boards/{boardId}/comments/{commentId}
 */

import {
  collection,
  doc,
  addDoc,
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
const commentsCollectionRef = (boardId = DEFAULT_BOARD_ID) =>
  collection(firestore, 'boards', boardId, 'comments');

const commentDocRef = (commentId, boardId = DEFAULT_BOARD_ID) =>
  doc(firestore, 'boards', boardId, 'comments', commentId);

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
  } = data;

  return {
    id: docSnap.id,
    text: text || '',
    authorId: authorId ?? null,
    authorName: authorName ?? 'Unknown',
    authorEmail: authorEmail ?? '',
    createdAt: createdAt?.toMillis?.() ?? null,
    updatedAt: updatedAt?.toMillis?.() ?? null,
  };
};

// CRUD operations

/**
 * Create a new comment on the board
 * @param {string} text - The comment text (max 500 chars)
 * @param {string} boardId - The board ID
 * @returns {Promise<{id: string}>} The created comment ID
 */
export async function createComment(text, boardId = DEFAULT_BOARD_ID) {
  try {
    const collectionRef = commentsCollectionRef(boardId);
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
 * Update an existing comment
 * @param {string} commentId - The comment ID to update
 * @param {string} text - The new comment text
 * @param {string} boardId - The board ID
 * @returns {Promise<{id: string}>}
 */
export async function updateComment(commentId, text, boardId = DEFAULT_BOARD_ID) {
  try {
    if (!commentId) {
      throw new Error('commentId is required');
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

    const ref = commentDocRef(commentId, boardId);
    const updatePayload = {
      text: text.trim(),
      updatedAt: serverTimestamp(),
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
 * Delete a comment
 * @param {string} commentId - The comment ID to delete
 * @param {string} boardId - The board ID
 * @returns {Promise<{id: string}>}
 */
export async function deleteComment(commentId, boardId = DEFAULT_BOARD_ID) {
  try {
    if (!commentId) {
      throw new Error('commentId is required');
    }

    const ref = commentDocRef(commentId, boardId);
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
 * Subscribe to real-time updates for board comments
 * @param {string} boardId - The board ID
 * @param {Function} callback - Callback function called with {type: 'added'|'modified'|'removed', comment}
 * @param {Function} onReady - Optional callback called when subscription is ready (even if 0 comments)
 * @returns {Function} Unsubscribe function
 */
export function subscribeToComments(boardId = DEFAULT_BOARD_ID, callback, onReady) {
  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  // Check if user is authenticated before subscribing
  const currentUser = auth.currentUser;
  if (!currentUser) {
    logger.warn('commentService: Cannot subscribe - user not authenticated', {
      boardId,
      hasAuth: !!auth.currentUser,
      timestamp: new Date().toISOString()
    });
    // Call onReady with empty result to prevent loading state
    if (onReady) {
      onReady();
    }
    // Return no-op unsubscribe
    return () => {};
  }

  logger.debug(`commentService: Subscribing to comments for board ${boardId}`, {
    boardId,
    userId: currentUser.uid,
    timestamp: new Date().toISOString()
  });

  const q = query(
    commentsCollectionRef(boardId),
    orderBy('createdAt', 'asc')
  );

  let isFirstSnapshot = true;
  let hasShownError = false;
  let retryCount = 0;
  const maxRetries = 3;

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      try {
        console.log(`[commentService] Received snapshot for board ${boardId}`, {
          changesCount: snapshot.docChanges().length,
          isFirstSnapshot,
        });
        
        logger.debug(`commentService: Received snapshot for board ${boardId}`, {
          boardId,
          changesCount: snapshot.docChanges().length,
          isFirstSnapshot,
          timestamp: new Date().toISOString()
        });

        snapshot.docChanges().forEach((change) => {
          console.log('[commentService] Processing change:', change.type, change.doc.id);
          const comment = fromFirestoreDoc(change.doc);
          console.log('[commentService] Parsed comment:', comment);
          if (!comment) return;

          if (change.type === 'added') {
            console.log('[commentService] Calling callback with added comment');
            callback({ type: 'added', comment });
          } else if (change.type === 'modified') {
            callback({ type: 'modified', comment });
          } else if (change.type === 'removed') {
            callback({ type: 'removed', comment });
          }
        });

        // Call onReady after first snapshot (even if empty)
        if (isFirstSnapshot && onReady) {
          console.log('[commentService] Calling onReady');
          isFirstSnapshot = false;
          onReady();
        }

        // Reset retry count on successful snapshot
        retryCount = 0;
      } catch (snapshotError) {
        console.error('[commentService] Error processing snapshot:', snapshotError);
        logger.error('commentService: Error processing snapshot:', snapshotError);
      }
    },
    (error) => {
      retryCount++;

      logger.error('commentService: Error in comment subscription:', error, {
        boardId,
        retryCount,
        maxRetries,
        hasAuth: !!auth.currentUser,
        userId: auth.currentUser?.uid,
        errorCode: error.code,
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      });

      // Only show error once per subscription to avoid spam, or after max retries
      if (!hasShownError && (retryCount >= maxRetries || error.code === 'permission-denied')) {
        hasShownError = true;

        // Provide more specific error messages
        if (error.code === 'permission-denied') {
          logger.error('commentService: Permission denied - check Firestore rules and authentication');
          toast.error('Unable to load comments. Please refresh the page and sign in again.');
        } else if (error.code === 'unavailable') {
          logger.warn('commentService: Firestore temporarily unavailable - will retry automatically');
          // Don't show error for transient network issues - Firestore will retry
        } else if (retryCount >= maxRetries) {
          logger.error('commentService: Max retries exceeded for comment subscription');
          toast.error('Unable to load comments. Please refresh the page and try again.');
        } else {
          logger.warn('commentService: Temporary error in comment subscription, retrying...');
          // Don't show toast for retryable errors until max retries reached
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
  commentDocRef,
  commentsCollectionRef,
  MAX_COMMENT_LENGTH,
};
