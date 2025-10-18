import { useState, useRef, useEffect } from 'react';
import './CommentInput.css';

const MAX_CHARS = 500;

/**
 * CommentInput - Text input for creating/editing comments
 * Features: character counter, max length validation, loading state
 */
function CommentInput({ 
  onSubmit, 
  onCancel, 
  initialValue = '', 
  placeholder = 'Add a comment...', 
  submitLabel = 'Post',
  autoFocus = false,
}) {
  const [text, setText] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const charsRemaining = MAX_CHARS - text.length;
  const isOverLimit = charsRemaining < 0;
  const isEmpty = text.trim().length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isEmpty || isOverLimit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await onSubmit(text.trim());
      if (success) {
        setText('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setText(initialValue);
    onCancel?.();
  };

  const handleChange = (e) => {
    setText(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e) => {
    // Allow new line on Cmd/Ctrl+Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Allow default behavior (new line)
      return;
    }
    // Submit on Enter (without modifier keys)
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
    // Cancel on Escape
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <form className="comment-input" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="comment-input__textarea"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSubmitting}
        rows={2}
        aria-label="Comment text"
      />
      
      <div className="comment-input__footer">
        <div 
          className={`comment-input__counter ${isOverLimit ? 'comment-input__counter--over' : ''} ${charsRemaining < 50 ? 'comment-input__counter--warning' : ''}`}
        >
          {charsRemaining} / {MAX_CHARS}
        </div>
        
        <div className="comment-input__actions">
          {onCancel && (
            <button
              type="button"
              className="comment-input__button comment-input__button--cancel"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="comment-input__button comment-input__button--submit"
            disabled={isEmpty || isOverLimit || isSubmitting}
          >
            {isSubmitting ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CommentInput;

