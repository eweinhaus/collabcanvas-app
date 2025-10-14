import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ColorPicker.css';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#52B788',
  '#E63946', '#A8DADC', '#457B9D', '#1D3557', '#F1FAEE',
  '#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51',
];

const ColorPicker = ({ isOpen, onClose, onSelectColor, x, y }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e) => {
        if (pickerRef.current && !pickerRef.current.contains(e.target)) {
          onClose();
        }
      };

      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleColorClick = (color) => {
    onSelectColor(color);
    onClose();
  };

  return createPortal(
    <div
      className="color-picker"
      ref={pickerRef}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      role="dialog"
      aria-label="Color picker"
    >
      <div className="color-picker__header">
        <span className="color-picker__title">Choose Color</span>
        <button
          className="color-picker__close"
          onClick={onClose}
          aria-label="Close color picker"
        >
          ×
        </button>
      </div>
      <div className="color-picker__grid">
        {COLORS.map((color) => (
          <button
            key={color}
            className="color-picker__swatch"
            style={{ backgroundColor: color }}
            onClick={() => handleColorClick(color)}
            title={color}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>,
    document.body
  );
};

export default ColorPicker;

