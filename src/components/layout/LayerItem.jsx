/**
 * LayerItem - Individual layer row in the layers panel
 * Shows shape type, name, and provides controls for visibility, duplicate, and delete
 */

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './LayerItem.css';

// Shape type icons
const SHAPE_ICONS = {
  rectangle: '▭',
  circle: '●',
  triangle: '▲',
  text: 'T',
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
  
  const icon = SHAPE_ICONS[shape.type] || '?';
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
          ⋮⋮
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
          {isVisible ? '👁️' : '👁️‍🗨️'}
        </button>

        {/* Shape icon and name */}
        <div className="layer-item__info">
          <span className="layer-item__icon" aria-hidden="true">
            {icon}
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
            ⋮
          </button>

          {showMenu && (
            <div className="layer-item__menu">
              <button
                className="layer-item__menu-item"
                onClick={(e) => handleAction(onDuplicate, e)}
              >
                <span>📋</span> Duplicate
              </button>
              <button
                className="layer-item__menu-item layer-item__menu-item--danger"
                onClick={(e) => handleAction(onDelete, e)}
              >
                <span>🗑️</span> Delete
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

