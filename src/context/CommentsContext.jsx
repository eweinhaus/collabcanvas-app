/**
 * CommentsContext - Global state management for collaborative comments
 * Manages comment threads, counts, and real-time subscriptions
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  createComment,
  updateComment,
  deleteComment,
  subscribeToComments,
} from '../services/commentService';
import toast from 'react-hot-toast';

const CommentsContext = createContext(null);

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within CommentsProvider');
  }
  return context;
};

const DEFAULT_BOARD_ID = 'default';

export function CommentsProvider({ children, boardId = DEFAULT_BOARD_ID }) {
  // Thread panel state
  const [currentThread, setCurrentThread] = useState({
    isOpen: false,
    shapeId: null,
  });

  // Comments data { [shapeId]: Comment[] }
  const [commentsMap, setCommentsMap] = useState({});
  
  // Comment counts { [shapeId]: number }
  const [commentCounts, setCommentCounts] = useState({});
  
  // Loading states { [shapeId]: boolean }
  const [loadingStates, setLoadingStates] = useState({});

  // Track active subscriptions to prevent duplicates
  const subscriptionsRef = useRef({});

  // Subscribe to comments for a specific shape
  const subscribeToShape = useCallback((shapeId) => {
    if (subscriptionsRef.current[shapeId]) {
      return; // Already subscribed
    }

    console.log(`[CommentsContext] Subscribing to comments for shape: ${shapeId}`);
    
    setLoadingStates(prev => ({ ...prev, [shapeId]: true }));

    const unsubscribe = subscribeToComments(
      shapeId, 
      boardId, 
      ({ type, comment }) => {
        // Process the change and update both comments and counts
        setCommentsMap(prev => {
          const existing = prev[shapeId] || [];
          let newComments;
          let shouldUpdate = true;
          
          if (type === 'added') {
            // Avoid duplicates
            if (existing.find(c => c.id === comment.id)) {
              shouldUpdate = false;
              newComments = existing;
            } else {
              newComments = [...existing, comment].sort((a, b) => a.createdAt - b.createdAt);
            }
          } else if (type === 'modified') {
            newComments = existing.map(c => c.id === comment.id ? comment : c);
          } else if (type === 'removed') {
            newComments = existing.filter(c => c.id !== comment.id);
          } else {
            shouldUpdate = false;
            newComments = existing;
          }
          
          // Always update count based on actual array length, even if comments didn't change
          setCommentCounts(prevCounts => ({
            ...prevCounts,
            [shapeId]: newComments.length,
          }));
          
          if (!shouldUpdate) {
            return prev;
          }
          
          return {
            ...prev,
            [shapeId]: newComments,
          };
        });
      },
      // onReady callback - clear loading state when subscription is established
      () => {
        setLoadingStates(prev => ({ ...prev, [shapeId]: false }));
        
        // Ensure count is initialized (even if 0 comments)
        setCommentCounts(prevCounts => {
          // Only update if not already set to avoid race conditions
          if (prevCounts[shapeId] === undefined) {
            return { ...prevCounts, [shapeId]: 0 };
          }
          return prevCounts;
        });
      }
    );

    subscriptionsRef.current[shapeId] = unsubscribe;
  }, [boardId]);

  // Unsubscribe from a shape
  const unsubscribeFromShape = useCallback((shapeId) => {
    const unsubscribe = subscriptionsRef.current[shapeId];
    if (unsubscribe) {
      console.log(`[CommentsContext] Unsubscribing from comments for shape: ${shapeId}`);
      unsubscribe();
      delete subscriptionsRef.current[shapeId];
    }
  }, []);

  // Open comment thread for a shape
  const openThread = useCallback((shapeId) => {
    if (!shapeId) {
      console.warn('[CommentsContext] Cannot open thread: shapeId is required');
      return;
    }

    console.log(`[CommentsContext] Opening thread for shape: ${shapeId}`);
    setCurrentThread({ isOpen: true, shapeId });
    
    // Subscribe if not already subscribed
    subscribeToShape(shapeId);
  }, [subscribeToShape]);

  // Close comment thread
  const closeThread = useCallback(() => {
    console.log('[CommentsContext] Closing thread');
    setCurrentThread({ isOpen: false, shapeId: null });
  }, []);

  // Create a new comment
  const addComment = useCallback(async (shapeId, text) => {
    try {
      await createComment(shapeId, text, boardId);
      toast.success('Comment added');
      return true;
    } catch (error) {
      console.error('[CommentsContext] Error adding comment:', error);
      // Error toast already shown by commentService
      return false;
    }
  }, [boardId]);

  // Update an existing comment
  const editComment = useCallback(async (shapeId, commentId, text) => {
    try {
      await updateComment(shapeId, commentId, text, boardId);
      toast.success('Comment updated');
      return true;
    } catch (error) {
      console.error('[CommentsContext] Error updating comment:', error);
      return false;
    }
  }, [boardId]);

  // Delete a comment
  const removeComment = useCallback(async (shapeId, commentId) => {
    try {
      await deleteComment(shapeId, commentId, boardId);
      toast.success('Comment deleted');
      return true;
    } catch (error) {
      console.error('[CommentsContext] Error deleting comment:', error);
      return false;
    }
  }, [boardId]);

  // Get comments for a specific shape
  const getShapeComments = useCallback((shapeId) => {
    return commentsMap[shapeId] || [];
  }, [commentsMap]);

  // Get comment count for a shape
  const getCommentCount = useCallback((shapeId) => {
    return commentCounts[shapeId] || 0;
  }, [commentCounts]);

  // Check if comments are loading for a shape
  const isLoading = useCallback((shapeId) => {
    return loadingStates[shapeId] || false;
  }, [loadingStates]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      console.log('[CommentsContext] Cleaning up all subscriptions');
      Object.keys(subscriptionsRef.current).forEach(shapeId => {
        subscriptionsRef.current[shapeId]?.();
      });
      subscriptionsRef.current = {};
    };
  }, []);

  const value = useMemo(
    () => ({
      // Thread state
      currentThread,
      openThread,
      closeThread,
      
      // Comment operations
      addComment,
      editComment,
      removeComment,
      
      // Data getters
      getShapeComments,
      getCommentCount,
      isLoading,
      
      // Subscription management
      subscribeToShape,
      unsubscribeFromShape,
    }),
    [
      currentThread,
      openThread,
      closeThread,
      addComment,
      editComment,
      removeComment,
      getShapeComments,
      getCommentCount,
      isLoading,
      subscribeToShape,
      unsubscribeFromShape,
    ]
  );

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
}

