/**
 * CommentsContext - Global state management for board-level comments
 * Manages a single chat for the entire board
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import {
  createComment,
  updateComment,
  deleteComment,
  subscribeToComments,
} from '../services/commentService';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  
  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Comments data (array sorted by creation time)
  const [comments, setComments] = useState([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to board comments - only when user is authenticated
  useEffect(() => {
    if (!user) {
      console.log('[CommentsContext] Waiting for user authentication before subscribing');
      setIsLoading(false);
      return;
    }

    console.log('[CommentsContext] User authenticated, subscribing to comments:', user.uid);
    setIsLoading(true);

    const unsubscribe = subscribeToComments(
      boardId,
      ({ type, comment }) => {
        console.log('[CommentsContext] Received comment update:', { type, comment });
        setComments(prev => {
          console.log('[CommentsContext] Current comments:', prev);
          let newComments;
          
          if (type === 'added') {
            // Avoid duplicates
            if (prev.find(c => c.id === comment.id)) {
              console.log('[CommentsContext] Skipping duplicate comment:', comment.id);
              return prev;
            }
            newComments = [...prev, comment].sort((a, b) => a.createdAt - b.createdAt);
            console.log('[CommentsContext] Added comment, new array:', newComments);
          } else if (type === 'modified') {
            newComments = prev.map(c => c.id === comment.id ? comment : c);
          } else if (type === 'removed') {
            newComments = prev.filter(c => c.id !== comment.id);
          } else {
            return prev;
          }
          
          return newComments;
        });
      },
      // onReady callback - clear loading state when subscription is established
      () => {
        setIsLoading(false);
      }
    );

    return () => {
      console.log('[CommentsContext] Unsubscribing from comments');
      unsubscribe();
    };
  }, [boardId, user]);

  // Open comment panel
  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  // Close comment panel
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  // Toggle panel
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  // Create a new comment
  const addComment = useCallback(async (text) => {
    try {
      console.log('[CommentsContext] Creating comment:', { text, boardId });
      const result = await createComment(text, boardId);
      console.log('[CommentsContext] Comment created successfully:', result);
      return true;
    } catch (error) {
      console.error('[CommentsContext] Error adding comment:', error);
      // Error toast already shown by commentService
      return false;
    }
  }, [boardId]);

  // Update an existing comment
  const editComment = useCallback(async (commentId, text) => {
    try {
      await updateComment(commentId, text, boardId);
      return true;
    } catch (error) {
      console.error('[CommentsContext] Error updating comment:', error);
      return false;
    }
  }, [boardId]);

  // Delete a comment
  const removeComment = useCallback(async (commentId) => {
    try {
      await deleteComment(commentId, boardId);
      return true;
    } catch (error) {
      console.error('[CommentsContext] Error deleting comment:', error);
      return false;
    }
  }, [boardId]);

  const value = useMemo(
    () => ({
      // Panel state
      isPanelOpen,
      openPanel,
      closePanel,
      togglePanel,
      
      // Comment operations
      addComment,
      editComment,
      removeComment,
      
      // Data
      comments,
      commentCount: comments.length,
      isLoading,
    }),
    [
      isPanelOpen,
      openPanel,
      closePanel,
      togglePanel,
      addComment,
      editComment,
      removeComment,
      comments,
      isLoading,
    ]
  );

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
}
