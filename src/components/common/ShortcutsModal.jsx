import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ShortcutsModal.css';

const ShortcutsModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus trap
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      firstElement?.focus();

      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Esc', description: 'Switch to select mode' },
    { key: 'Click', description: 'Select single shape' },
    { key: 'Shift/Cmd + Click', description: 'Add/remove shape from selection' },
    { key: 'Click + Drag (empty area)', description: 'Lasso select multiple shapes' },
    { key: 'Delete / Backspace', description: 'Delete selected shape(s)' },
    { key: 'Cmd/Ctrl + C', description: 'Copy selected shape(s)' },
    { key: 'Cmd/Ctrl + V', description: 'Paste shape(s)' },
    { key: 'Cmd/Ctrl + D', description: 'Duplicate selected shape(s)' },
    { key: 'Cmd/Ctrl + Z', description: 'Undo last action' },
    { key: 'Cmd/Ctrl + Shift + Z', description: 'Redo last undone action' },
    { key: 'Cmd/Ctrl + Shift + C', description: 'Add/view comments on selected shape' },
    { key: 'Arrow Keys', description: 'Move selected shape(s) (5px)' },
    { key: 'Shift + Arrows', description: 'Move selected shape(s) (20px)' },
    { key: 'Double-click', description: 'Edit text or change shape color' },
    { key: 'Drag handles', description: 'Resize/rotate selected shape(s)' },
    { key: 'Click + Drag', description: 'Pan canvas (in select mode)' },
    { key: 'Scroll', description: 'Zoom in/out' },
    // Alignment & Distribution
    { key: 'Cmd/Ctrl + Shift + L', description: 'Align Left (2+ shapes)' },
    { key: 'Cmd/Ctrl + Shift + R', description: 'Align Right (2+ shapes)' },
    { key: 'Cmd/Ctrl + Shift + T', description: 'Align Top (2+ shapes)' },
    { key: 'Cmd/Ctrl + Shift + M', description: 'Align Middle (2+ shapes)' },
    { key: 'Cmd/Ctrl + Shift + B', description: 'Align Bottom (2+ shapes)' },
    { key: 'Cmd/Ctrl + Shift + H', description: 'Distribute Horizontally (3+ shapes)' },
    { key: 'Cmd/Ctrl + Shift + V', description: 'Distribute Vertically (3+ shapes)' },
    { key: '?', description: 'Show this help' },
  ];

  return createPortal(
    <div className="shortcuts-modal-overlay" onClick={onClose}>
      <div
        className="shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="shortcuts-modal__header">
          <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          <button
            className="shortcuts-modal__close"
            onClick={onClose}
            aria-label="Close shortcuts modal"
          >
            ×
          </button>
        </div>
        <div className="shortcuts-modal__content">
          <table className="shortcuts-table">
            <tbody>
              {shortcuts.map((shortcut, index) => (
                <tr key={index}>
                  <td className="shortcuts-table__key">
                    <kbd>{shortcut.key}</kbd>
                  </td>
                  <td className="shortcuts-table__desc">{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShortcutsModal;

