/**
 * LayerItem - Individual layer row in the layers panel
 * Shows shape type, name, and provides controls for visibility, duplicate, and delete
 */

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './LayerItem.css';

// Shape type icons (SVG components)
const SHAPE_ICONS = {
  rectangle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    </svg>
  ),
  circle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  triangle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 22h20z"/>
    </svg>
  ),
  text: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>
  ),
};

// Generate a readable name for a shape
const generateShapeName = (shape) => {
  if (shape.text) {
    // For text shapes, use the text content (truncated)
    return shape.text.length > 20 ? `${shape.text.slice(0, 20)}...` : shape.text;
  }
  
  // For other shapes, use type + dimensions or color
  const type = shape.type.charAt(0).toUpperCase() + shape.type.slice(1);
  
  if (shape.type === 'circle') {
    return `${type} ${shape.radius || 50}`;
  }
  
  if (shape.width && shape.height) {
    return `${type} ${Math.round(shape.width)}×${Math.round(shape.height)}`;
  }
  
  return type;
};

const LayerItem = ({
  shape,
  index,
  isSelected,
  onClick,
  onVisibilityToggle,
  onDuplicate,
  onDelete,
  isVisible = true,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shape.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const icon = SHAPE_ICONS[shape.type] || (() => '?');
  const name = generateShapeName(shape);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action, e) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`layer-item ${isSelected ? 'layer-item--selected' : ''} ${!isVisible ? 'layer-item--hidden' : ''} ${isDragging ? 'layer-item--dragging' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Layer: ${name}`}
      aria-selected={isSelected}
      {...attributes}
    >
      <div className="layer-item__main">
        {/* Drag handle */}
        <div
          className="layer-item__drag-handle"
          {...listeners}
          aria-label="Drag to reorder"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="12" r="1"/>
            <circle cx="9" cy="5" r="1"/>
            <circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="12" r="1"/>
            <circle cx="15" cy="5" r="1"/>
            <circle cx="15" cy="19" r="1"/>
          </svg>
        </div>

        {/* Visibility toggle */}
        <button
          className="layer-item__visibility"
          onClick={(e) => {
            e.stopPropagation();
            onVisibilityToggle();
          }}
          aria-label={isVisible ? 'Hide layer' : 'Show layer'}
          title={isVisible ? 'Hide layer' : 'Show layer'}
        >
          {isVisible ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>

        {/* Shape icon and name */}
        <div className="layer-item__info">
          <span className="layer-item__icon" aria-hidden="true">
            {typeof icon === 'function' ? icon() : icon}
          </span>
          <span className="layer-item__name">{name}</span>
        </div>

        {/* Z-index display */}
        <span className="layer-item__zindex" title={`z-index: ${shape.zIndex ?? 0}`}>
          {index + 1}
        </span>

        {/* Actions menu */}
        <div className="layer-item__actions">
          <button
            className="layer-item__menu-button"
            onClick={handleMenuClick}
            aria-label="Layer actions"
            aria-expanded={showMenu}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>

          {showMenu && (
            <div className="layer-item__menu">
              <button
                className="layer-item__menu-item"
                onClick={(e) => handleAction(onDuplicate, e)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Duplicate
              </button>
              <button
                className="layer-item__menu-item layer-item__menu-item--danger"
                onClick={(e) => handleAction(onDelete, e)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Color preview for non-text shapes */}
      {shape.type !== 'text' && shape.fill && (
        <div
          className="layer-item__color-preview"
          style={{ backgroundColor: shape.fill }}
          aria-label={`Color: ${shape.fill}`}
        />
      )}
    </div>
  );
};

export default LayerItem;

