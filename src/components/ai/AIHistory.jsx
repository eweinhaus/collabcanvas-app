/**
 * AIHistory Component
 * 
 * Displays the history of AI commands and their execution results.
 * Shows user commands, AI responses, tool executions, and errors.
 */

import React, { useState, useEffect, useRef } from 'react';
import './AIHistory.css';

/**
 * Format timestamp to readable time
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time string
 */
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Format latency to human-readable string
 * @param {number} latency - Latency in milliseconds
 * @returns {string} Formatted latency string
 */
const formatLatency = (latency) => {
  if (latency < 1000) {
    return `${Math.round(latency)}ms`;
  } else {
    return `${(latency / 1000).toFixed(2)}s`;
  }
};

/**
 * HistoryEntry Component
 * Displays a single entry in the command history
 */
const HistoryEntry = ({ entry, index }) => {
  const [expanded, setExpanded] = useState(false);

  // User message
  if (entry.role === 'user') {
    return (
      <div className="history-entry history-entry--user" data-testid={`history-entry-${index}`}>
        <div className="history-entry__header">
          <span className="history-entry__icon">👤</span>
          <span className="history-entry__role">You</span>
          <span className="history-entry__timestamp">{formatTime(entry.timestamp)}</span>
        </div>
        <div className="history-entry__content">{entry.content}</div>
      </div>
    );
  }

  // Assistant message
  if (entry.role === 'assistant') {
    const hasToolCalls = entry.toolCalls && entry.toolCalls.length > 0;
    const successCount = hasToolCalls
      ? entry.toolCalls.filter((tc) => tc.result.success).length
      : 0;
    const failCount = hasToolCalls ? entry.toolCalls.length - successCount : 0;

    return (
      <div className="history-entry history-entry--assistant" data-testid={`history-entry-${index}`}>
        <div className="history-entry__header">
          <span className="history-entry__icon">🤖</span>
          <span className="history-entry__role">AI Assistant</span>
          <span className="history-entry__timestamp">{formatTime(entry.timestamp)}</span>
          {entry.latency && (
            <span className="history-entry__latency" title="Response time">
              ⚡ {formatLatency(entry.latency)}
            </span>
          )}
        </div>
        
        {entry.content && (
          <div className="history-entry__content">{entry.content}</div>
        )}

        {hasToolCalls && (
          <div className="history-entry__tools">
            <div className="history-entry__tools-summary">
              <span className="tools-count">
                {entry.toolCalls.length} action(s)
              </span>
              {successCount > 0 && (
                <span className="tools-success">✅ {successCount}</span>
              )}
              {failCount > 0 && (
                <span className="tools-fail">❌ {failCount}</span>
              )}
              <button
                className="tools-toggle"
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? 'Collapse details' : 'Expand details'}
              >
                {expanded ? '▼' : '▶'}
              </button>
            </div>

            {expanded && (
              <div className="history-entry__tools-details">
                {entry.toolCalls.map((toolCall, idx) => (
                  <div
                    key={idx}
                    className={`tool-call ${toolCall.result.success ? 'tool-call--success' : 'tool-call--error'}`}
                  >
                    <div className="tool-call__name">
                      {toolCall.result.success ? '✓' : '✗'} {toolCall.toolName}
                    </div>
                    <div className="tool-call__message">{toolCall.result.message}</div>
                    {!toolCall.result.success && toolCall.result.error && (
                      <div className="tool-call__error">Error: {toolCall.result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Error message
  if (entry.role === 'error') {
    return (
      <div className="history-entry history-entry--error" data-testid={`history-entry-${index}`}>
        <div className="history-entry__header">
          <span className="history-entry__icon">⚠️</span>
          <span className="history-entry__role">Error</span>
          <span className="history-entry__timestamp">{formatTime(entry.timestamp)}</span>
        </div>
        <div className="history-entry__content history-entry__content--error">
          {entry.content}
        </div>
      </div>
    );
  }

  return null;
};

/**
 * AIHistory Component
 * Main component that displays the full command history
 */
const AIHistory = ({ history, onClear }) => {
  const entriesRef = useRef(null);

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (entriesRef.current && history && history.length > 0) {
      entriesRef.current.scrollTop = entriesRef.current.scrollHeight;
    }
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="ai-history ai-history--empty" data-testid="ai-history">
        <div className="ai-history__empty-state">
          <p className="empty-state__icon">💭</p>
          <p className="empty-state__text">No commands yet</p>
          <p className="empty-state__hint">
            Try: "Create a blue circle" or "Move the shape to 500, 300"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-history" data-testid="ai-history">
      <div className="ai-history__header">
        <h3 className="ai-history__title">
          Command History
          <span className="ai-history__count">({history.length})</span>
        </h3>
        {onClear && (
          <button
            className="ai-history__clear"
            onClick={onClear}
            aria-label="Clear history"
            title="Clear all history"
          >
            🗑️ Clear
          </button>
        )}
      </div>

      <div 
        className="ai-history__entries" 
        data-testid="ai-history-entries"
        ref={entriesRef}
      >
        {history.map((entry, index) => (
          <HistoryEntry key={index} entry={entry} index={index} />
        ))}
      </div>
    </div>
  );
};

export default AIHistory;

