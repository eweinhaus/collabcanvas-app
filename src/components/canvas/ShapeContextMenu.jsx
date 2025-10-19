/**
 * ShapeContextMenu - Right-click context menu for shapes
 * Provides z-index controls and other shape operations
 */

import { useEffect } from 'react';
import './ShapeContextMenu.css';

const ShapeContextMenu = ({ x, y, onClose, onBringToFront, onSendToBack, onBringForward, onSendBackward }) => {
  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClick = () => onClose();
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleMenuClick = (e, action) => {
    e.stopPropagation();
    action();
    onClose();
  };

  return (
    <div 
      className="shape-context-menu" 
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="menu-section">
        <div className="menu-section-label">Layer Order</div>
        <button 
          className="menu-item"
          onClick={(e) => handleMenuClick(e, onBringToFront)}
        >
          <span className="menu-icon">⬆️</span>
          Bring to Front
          <span className="menu-shortcut">Ctrl+]</span>
        </button>
        <button 
          className="menu-item"
          onClick={(e) => handleMenuClick(e, onBringForward)}
        >
          <span className="menu-icon">↑</span>
          Bring Forward
          <span className="menu-shortcut">]</span>
        </button>
        <button 
          className="menu-item"
          onClick={(e) => handleMenuClick(e, onSendBackward)}
        >
          <span className="menu-icon">↓</span>
          Send Backward
          <span className="menu-shortcut">[</span>
        </button>
        <button 
          className="menu-item"
          onClick={(e) => handleMenuClick(e, onSendToBack)}
        >
          <span className="menu-icon">⬇️</span>
          Send to Back
          <span className="menu-shortcut">Ctrl+[</span>
        </button>
      </div>
    </div>
  );
};

export default ShapeContextMenu;

