/**
 * TextFormatToolbar Component - Formatting options for text shapes
 * Shows Bold, Italic, and Underline controls when editing text
 */

import './TextFormatToolbar.css';

const TextFormatToolbar = ({ 
  fontStyle,
  textDecoration, 
  x, 
  y, 
  scale, 
  stagePosition, 
  onFormatChange 
}) => {
  const toolbarStyle = {
    position: 'absolute',
    top: `${y * scale + stagePosition.y - 45}px`, // Above the text editor
    left: `${x * scale + stagePosition.x}px`,
    zIndex: 1000,
  };

  // Prevent mouseDown from blurring the text editor
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const toggleBold = () => {
    const currentStyle = fontStyle || 'normal';
    const isBold = currentStyle.includes('bold');
    
    if (isBold) {
      // Remove bold
      const newStyle = currentStyle.replace('bold', '').trim();
      onFormatChange({ fontStyle: newStyle || 'normal' });
    } else {
      // Add bold
      const newStyle = currentStyle === 'italic' ? 'bold italic' : 'bold';
      onFormatChange({ fontStyle: newStyle });
    }
  };

  const toggleItalic = () => {
    const currentStyle = fontStyle || 'normal';
    const isItalic = currentStyle.includes('italic');
    
    if (isItalic) {
      // Remove italic
      const newStyle = currentStyle.replace('italic', '').trim();
      onFormatChange({ fontStyle: newStyle || 'normal' });
    } else {
      // Add italic
      const newStyle = currentStyle === 'bold' ? 'bold italic' : 'italic';
      onFormatChange({ fontStyle: newStyle });
    }
  };

  const toggleUnderline = () => {
    const currentDecoration = textDecoration || '';
    const isUnderlined = currentDecoration.includes('underline');
    
    if (isUnderlined) {
      // Remove underline
      const newDecoration = currentDecoration.replace('underline', '').trim();
      onFormatChange({ textDecoration: newDecoration });
    } else {
      // Add underline
      onFormatChange({ textDecoration: 'underline' });
    }
  };

  const currentStyle = fontStyle || 'normal';
  const isBold = currentStyle.includes('bold');
  const isItalic = currentStyle.includes('italic');
  const isUnderlined = (textDecoration || '').includes('underline');

  return (
    <div className="text-format-toolbar" style={toolbarStyle} onMouseDown={handleMouseDown}>
      <button 
        className={isBold ? 'format-btn active' : 'format-btn'}
        onClick={toggleBold}
        onMouseDown={handleMouseDown}
        title="Bold"
        type="button"
      >
        <strong>B</strong>
      </button>
      <button 
        className={isItalic ? 'format-btn active' : 'format-btn'}
        onClick={toggleItalic}
        onMouseDown={handleMouseDown}
        title="Italic"
        type="button"
      >
        <em>I</em>
      </button>
      <button 
        className={isUnderlined ? 'format-btn active' : 'format-btn'}
        onClick={toggleUnderline}
        onMouseDown={handleMouseDown}
        title="Underline"
        type="button"
      >
        <span style={{ textDecoration: 'underline' }}>U</span>
      </button>
    </div>
  );
};

export default TextFormatToolbar;
