/**
 * TextEditor Component - Inline text editor for text shapes
 * Shows an HTML textarea when editing text
 */

import { useEffect, useRef } from 'react';
import './TextEditor.css';

const TextEditor = ({ 
  value, 
  onChange, 
  onBlur, 
  x, 
  y, 
  fontSize, 
  scale,
  stagePosition 
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    // Focus and select all text when editor appears
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleKeyDown = (e) => {
    // Stop propagation to prevent canvas shortcuts
    e.stopPropagation();
    
    // Blur on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      textareaRef.current?.blur();
    }
    
    // Blur on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      textareaRef.current?.blur();
    }
  };

  // Calculate position accounting for scale and stage position
  const editorStyle = {
    position: 'absolute',
    top: `${y * scale + stagePosition.y}px`,
    left: `${x * scale + stagePosition.x}px`,
    fontSize: `${fontSize * scale}px`,
    transform: 'translate(0, 0)',
  };

  return (
    <textarea
      ref={textareaRef}
      className="text-editor"
      style={editorStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
    />
  );
};

export default TextEditor;

