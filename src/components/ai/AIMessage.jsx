/**
 * AI Message Component
 * Displays individual message bubbles in the AI chat
 */

import React from 'react';
import './AIMessage.css';

/**
 * Format timestamp as relative time
 * @param {number} timestamp
 * @returns {string}
 */
function formatTimestamp(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * AIMessage Component
 */
export default function AIMessage({ message }) {
  const { role, content, timestamp } = message;
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const isSystem = role === 'system';

  // Don't render system messages
  if (isSystem) {
    return null;
  }

  return (
    <div className={`ai-message ${isUser ? 'ai-message--user' : 'ai-message--assistant'}`}>
      <div className="ai-message__bubble">
        <div className="ai-message__content">
          {content}
        </div>
        {timestamp && (
          <div className="ai-message__timestamp">
            {formatTimestamp(timestamp)}
          </div>
        )}
      </div>
      {isAssistant && (
        <div className="ai-message__avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}

