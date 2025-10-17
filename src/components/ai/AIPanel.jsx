/**
 * AI Panel Component
 * Right-side sliding panel for AI chat interface
 */

import React, { useEffect, useRef } from 'react';
import { useAI } from '../../context/AIContext';
import AIMessage from './AIMessage';
import AIPrompt from './AIPrompt';
import './AIPanel.css';

export default function AIPanel() {
  const { panelOpen, closePanel, messages, loading, clearMessages, messagesEndRef } = useAI();
  const panelRef = useRef(null);

  // Handle ESC key to close panel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && panelOpen) {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [panelOpen, closePanel]);

  // Focus trap: keep focus within panel when open
  useEffect(() => {
    if (!panelOpen) return;

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
  }, [panelOpen]);

  // Filter out system messages for display
  const displayMessages = messages.filter(m => m.role !== 'system');

  return (
    <div
      ref={panelRef}
      className={`ai-panel ${panelOpen ? 'ai-panel--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="AI Assistant"
    >
      <div className="ai-panel__header">
        <div className="ai-panel__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>AI Assistant</h2>
        </div>
        
        <div className="ai-panel__actions">
          <button
            className="ai-panel__icon-button"
            onClick={clearMessages}
            title="Clear conversation"
            aria-label="Clear conversation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <button
            className="ai-panel__close-button"
            onClick={closePanel}
            aria-label="Close AI panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="ai-panel__messages">
        {displayMessages.length === 0 ? (
          <div className="ai-panel__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>AI Canvas Assistant</h3>
            <p>Ask me to create shapes, arrange objects, or help with your canvas.</p>
            <div className="ai-panel__examples">
              <button onClick={() => document.querySelector('.ai-prompt__input')?.focus()}>
                "Create a blue circle"
              </button>
              <button onClick={() => document.querySelector('.ai-prompt__input')?.focus()}>
                "Make a 3x3 grid"
              </button>
              <button onClick={() => document.querySelector('.ai-prompt__input')?.focus()}>
                "Create a login form"
              </button>
            </div>
          </div>
        ) : (
          <>
            {displayMessages.map((message, index) => (
              <AIMessage key={index} message={message} />
            ))}
            {loading && (
              <div className="ai-panel__loading">
                <div className="ai-panel__typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="ai-panel__footer">
        <AIPrompt />
      </div>
    </div>
  );
}

