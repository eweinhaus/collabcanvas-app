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
    { key: 'Delete / Backspace', description: 'Delete selected shape' },
    { key: 'Cmd/Ctrl + C', description: 'Copy selected shape' },
    { key: 'Cmd/Ctrl + V', description: 'Paste shape' },
    { key: 'Cmd/Ctrl + D', description: 'Duplicate selected shape' },
    { key: 'Arrow Keys', description: 'Move selected shape (10px)' },
    { key: 'Shift + Arrows', description: 'Move selected shape (1px)' },
    { key: 'Double-click', description: 'Edit text shape' },
    { key: 'Click + Drag', description: 'Pan canvas (in select mode)' },
    { key: 'Scroll', description: 'Zoom in/out' },
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

