/**
 * AIPrompt Component
 * 
 * Text input for submitting natural language commands to the AI.
 * Displays loading state while processing commands.
 */

import { useState } from 'react';
import { useAI } from '../../context/AIContext';
import './AIPrompt.css';

const AIPrompt = () => {
  const [input, setInput] = useState('');
  const { submitCommand, loading, isAvailable } = useAI();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) {
      return;
    }

    const command = input;
    setInput(''); // Clear input immediately for better UX
    
    await submitCommand(command);
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (but not Shift+Enter for future multi-line support)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isAvailable) {
    return (
      <div className="ai-prompt">
        <div className="ai-prompt__unavailable">
          <p className="ai-prompt__unavailable-title">AI Not Configured</p>
          <p className="ai-prompt__unavailable-text">
            Add <code>VITE_OPENAI_API_KEY</code> to your <code>.env.local</code> file to enable AI features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-prompt">
      <h3 className="ai-prompt__title">AI Assistant</h3>
      <form onSubmit={handleSubmit} className="ai-prompt__form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Create a blue circle at 200, 300"
          className="ai-prompt__input"
          disabled={loading}
          autoComplete="off"
        />
        <button
          type="submit"
          className="ai-prompt__button"
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <>
              <span className="ai-prompt__spinner"></span>
              Processing...
            </>
          ) : (
            'Send'
          )}
        </button>
      </form>
      <div className="ai-prompt__examples">
        <p className="ai-prompt__examples-title">Try:</p>
        <ul className="ai-prompt__examples-list">
          <li>"Create a red circle"</li>
          <li>"Add text that says Hello"</li>
          <li>"Make a blue rectangle at 100, 200"</li>
        </ul>
      </div>
    </div>
  );
};

export default AIPrompt;

