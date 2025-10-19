/**
 * Comments Panel Component
 * Right-side sliding panel for board-level comments chat
 */

import { useEffect, useRef, useState } from 'react';
import { useComments } from '../../context/CommentsContext';
import { useAuth } from '../../context/AuthContext';
import './CommentsPanel.css';

/**
 * Format timestamp as relative time
 */
function formatTimestamp(timestamp) {
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
}

/**
 * Individual Comment Component
 */
function Comment({ comment, currentUserId, onDelete }) {
  const isOwnComment = comment.authorId === currentUserId;
  const [showActions, setShowActions] = useState(false);
  
  return (
    <div 
      className={`comment ${isOwnComment ? 'comment--own' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="comment__header">
        <span className="comment__author">{comment.authorName}</span>
        <span className="comment__timestamp">{formatTimestamp(comment.createdAt)}</span>
      </div>
      <div className="comment__content">{comment.text}</div>
      {isOwnComment && showActions && (
        <button
          className="comment__delete"
          onClick={() => onDelete(comment.id)}
          title="Delete comment"
          aria-label="Delete comment"
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Comments Panel
 */
export default function CommentsPanel() {
  const { isPanelOpen, closePanel, comments, addComment, removeComment, isLoading, commentCount } = useComments();
  const { user } = useAuth();
  const panelRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (messagesEndRef.current && isPanelOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isPanelOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isPanelOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPanelOpen]);

  // Handle ESC key to close panel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isPanelOpen) {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isPanelOpen, closePanel]);

  // Focus trap: keep focus within panel when open
  useEffect(() => {
    if (!isPanelOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusableElements = panel.querySelectorAll(
      'button, textarea, input, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleTab);
    return () => panel.removeEventListener('keydown', handleTab);
  }, [isPanelOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const text = inputText.trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    const success = await addComment(text);
    
    if (success) {
      setInputText('');
      inputRef.current?.focus();
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    await removeComment(commentId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      ref={panelRef}
      className={`comments-panel ${isPanelOpen ? 'comments-panel--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Comments"
    >
      <div className="comments-panel__header">
        <div className="comments-panel__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <h2>Comments</h2>
          {commentCount > 0 && (
            <span className="comments-panel__count">{commentCount}</span>
          )}
        </div>
        
        <button
          className="comments-panel__close-button"
          onClick={closePanel}
          aria-label="Close comments panel"
        >
          ✕
        </button>
      </div>

      <div className="comments-panel__messages">
        {isLoading ? (
          <div className="comments-panel__loading">
            <div className="comments-panel__spinner" />
            <p>Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-panel__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h3>No comments yet</h3>
            <p>Start a conversation about this canvas.</p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                currentUserId={user?.uid}
                onDelete={handleDelete}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="comments-panel__footer">
        <form onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className="comments-panel__input"
            placeholder="Add a comment..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            maxLength={500}
            disabled={isSubmitting}
          />
          <div className="comments-panel__actions">
            <span className="comments-panel__char-count">
              {inputText.length}/500
            </span>
            <button
              type="submit"
              className="comments-panel__send-button"
              disabled={!inputText.trim() || isSubmitting}
              aria-label="Send comment"
            >
              {isSubmitting ? (
                <div className="comments-panel__spinner--small" />
              ) : (
                '➤'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

