import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ColorPicker.css';

// Color palette matching AI-supported color names
// Users can create shapes with these colors and AI will recognize them by name
const COLORS = [
  '#ff0000', // red
  '#0000ff', // blue
  '#008000', // green
  '#ffff00', // yellow
  '#ffa500', // orange
  '#800080', // purple
  '#ffc0cb', // pink
  '#00ffff', // cyan
  '#a52a2a', // brown
  '#808080', // gray
  '#000000', // black
  '#ffffff', // white
  '#ff00ff', // magenta
  '#00ff00', // lime
  '#1e90ff', // dodgerblue
  '#ff69b4', // hotpink
  '#dc143c', // crimson
  '#32cd32', // limegreen
  '#4682b4', // steelblue
  '#9370db', // mediumpurple
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

