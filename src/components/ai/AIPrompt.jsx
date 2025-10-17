/**
 * AI Prompt Component
 * Input area for sending messages to the AI
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../../context/AIContext';
import './AIPrompt.css';

export default function AIPrompt() {
  const { sendMessage, loading, cancelRequest } = useAI();
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) {
      return;
    }

    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCancel = () => {
    cancelRequest();
  };

  return (
    <div className="ai-prompt">
      <form onSubmit={handleSubmit} className="ai-prompt__form">
        <textarea
          ref={textareaRef}
          className="ai-prompt__input"
          placeholder="Ask me to create shapes, move objects, or arrange elements..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={1}
          aria-label="AI prompt input"
        />
        
        <div className="ai-prompt__actions">
          {loading ? (
            <button
              type="button"
              className="ai-prompt__button ai-prompt__button--cancel"
              onClick={handleCancel}
              aria-label="Cancel request"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              className="ai-prompt__button ai-prompt__button--send"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </form>

      <div className="ai-prompt__hint">
        Press <kbd>Enter</kbd> to send • <kbd>Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}

