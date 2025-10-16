import { useState, useEffect, useRef } from 'react';
import { useComments } from '../../context/CommentsContext';
import { auth } from '../../services/firebase';
import CommentInput from './CommentInput';
import UserAvatar from './UserAvatar';
import './CommentThread.css';

/**
 * CommentThread - Side panel displaying all comments for a shape
 * Features: scrollable list, edit/delete for own comments, real-time updates
 */
function CommentThread() {
  const { currentThread, closeThread, getShapeComments, addComment, editComment, removeComment, isLoading } = useComments();
  const [editingCommentId, setEditingCommentId] = useState(null);
  const panelRef = useRef(null);
  const commentsEndRef = useRef(null);

  const { isOpen, shapeId } = currentThread;
  const comments = isOpen && shapeId ? getShapeComments(shapeId) : [];
  const loading = isOpen && shapeId ? isLoading(shapeId) : false;
  const currentUser = auth.currentUser;

  // Close panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeThread();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeThread]);

  // Focus trap
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll(
        'button, textarea, input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (comments.length > 0 && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length]);

  const handleAddComment = async (text) => {
    const success = await addComment(shapeId, text);
    return success;
  };

  const handleEditComment = async (text) => {
    const success = await editComment(shapeId, editingCommentId, text);
    if (success) {
      setEditingCommentId(null);
    }
    return success;
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await removeComment(shapeId, commentId);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const getAvatarColor = (userId) => {
    // Generate consistent color from userId
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="comment-thread-backdrop"
        onClick={closeThread}
        aria-hidden="true"
      />

      {/* Panel */}
      <div 
        ref={panelRef}
        className="comment-thread"
        role="dialog"
        aria-labelledby="comment-thread-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="comment-thread__header">
          <h2 id="comment-thread-title" className="comment-thread__title">
            Comments {comments.length > 0 && `(${comments.length})`}
          </h2>
          <button
            className="comment-thread__close"
            onClick={closeThread}
            aria-label="Close comments"
          >
            ×
          </button>
        </div>

        {/* Comments List */}
        <div className="comment-thread__content">
          {loading && comments.length === 0 ? (
            <div className="comment-thread__loading">
              <div className="comment-thread__spinner" />
              <p>Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="comment-thread__empty">
              <p>No comments yet</p>
              <p className="comment-thread__empty-hint">Be the first to comment!</p>
            </div>
          ) : (
            <div className="comment-thread__list">
              {comments.map((comment) => {
                // Allow all authenticated users to edit/delete any comment
                const canEdit = !!currentUser;
                const isEditing = editingCommentId === comment.id;

                if (isEditing) {
                  return (
                    <div key={comment.id} className="comment-thread__item">
                      <CommentInput
                        initialValue={comment.text}
                        onSubmit={handleEditComment}
                        onCancel={() => setEditingCommentId(null)}
                        submitLabel="Save"
                        placeholder="Edit your comment..."
                        autoFocus
                      />
                    </div>
                  );
                }

                return (
                  <div key={comment.id} className="comment-thread__item">
                    <div className="comment-thread__item-header">
                      <UserAvatar 
                        name={comment.authorName} 
                        color={getAvatarColor(comment.authorId)}
                        size={32}
                      />
                      <div className="comment-thread__item-meta">
                        <span className="comment-thread__item-author">
                          {comment.authorName}
                        </span>
                        <span className="comment-thread__item-time">
                          {formatTime(comment.createdAt)}
                          {comment.edited && ' (edited)'}
                        </span>
                      </div>
                      {canEdit && (
                        <div className="comment-thread__item-actions">
                          <button
                            className="comment-thread__action-button"
                            onClick={() => setEditingCommentId(comment.id)}
                            aria-label="Edit comment"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="comment-thread__action-button"
                            onClick={() => handleDeleteComment(comment.id)}
                            aria-label="Delete comment"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="comment-thread__item-text">
                      {comment.text}
                    </div>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="comment-thread__footer">
          <CommentInput
            onSubmit={handleAddComment}
            placeholder="Add a comment..."
            submitLabel="Post"
          />
        </div>
      </div>
    </>
  );
}

export default CommentThread;

