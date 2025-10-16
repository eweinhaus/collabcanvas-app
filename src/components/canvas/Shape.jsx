/**
 * Shape Component - Renders different shape types (rect, circle, text)
 * Handles selection, dragging, and transformation
 */

import { useRef, forwardRef } from 'react';
import { Rect, Circle, Text, Line } from 'react-konva';
import { SHAPE_TYPES } from '../../utils/shapes';

const Shape = forwardRef(({ shape, isSelected, onSelect, onChange, onStartEdit, onColorChange, onToggleSelect }, ref) => {
  const shapeRef = ref || useRef();
  const dragStartStateRef = useRef(null);
  const transformStartStateRef = useRef(null);

  const handleClick = (e) => {
    // Check if shift key is pressed for multi-select
    if (e.evt && (e.evt.shiftKey || e.evt.metaKey)) {
      if (onToggleSelect) {
        onToggleSelect(shape.id);
      }
    } else {
      onSelect();
    }
  };

  const handleDragStart = (e) => {
    // Capture state before drag for undo
    dragStartStateRef.current = {
      x: shape.x,
      y: shape.y,
    };
  };

  const handleDragMove = (e) => {
    try {
      const x = e.target.x();
      const y = e.target.y();
      sessionStorage.setItem(`editBuffer:${shape.id}`, JSON.stringify({ x, y }));
    } catch {
      // ignore session storage errors
    }
  };

  const handleDragEnd = (e) => {
    const x = e.target.x();
    const y = e.target.y();
    
    // Pass both old and new state for undo/redo
    onChange({ 
      x, 
      y 
    }, {
      oldState: dragStartStateRef.current,
      isMove: true
    });
    
    dragStartStateRef.current = null;
    
    try {
      sessionStorage.removeItem(`editBuffer:${shape.id}`);
    } catch {
      // ignore session storage errors
    }
  };

  const handleTransformStart = () => {
    // Capture state before transform for undo
    const node = shapeRef.current;
    if (!node) return;

    transformStartStateRef.current = {
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation || 0,
    };

    // Capture dimension-specific properties
    if (shape.type === SHAPE_TYPES.RECT || shape.type === SHAPE_TYPES.TRIANGLE) {
      transformStartStateRef.current.width = shape.width;
      transformStartStateRef.current.height = shape.height;
    } else if (shape.type === SHAPE_TYPES.CIRCLE) {
      transformStartStateRef.current.radius = shape.radius;
    } else if (shape.type === SHAPE_TYPES.TEXT) {
      transformStartStateRef.current.fontSize = shape.fontSize;
    }
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply it to dimensions
    node.scaleX(1);
    node.scaleY(1);

    const updates = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };

    // Update dimensions based on shape type
    if (shape.type === SHAPE_TYPES.RECT) {
      updates.width = Math.max(5, node.width() * scaleX);
      updates.height = Math.max(5, node.height() * scaleY);
    } else if (shape.type === SHAPE_TYPES.CIRCLE) {
      updates.radius = Math.max(5, node.radius() * Math.max(scaleX, scaleY));
    } else if (shape.type === SHAPE_TYPES.TEXT) {
      updates.fontSize = Math.max(5, node.fontSize() * scaleX);
    } else if (shape.type === SHAPE_TYPES.TRIANGLE) {
      updates.width = Math.max(5, node.width() * scaleX);
      updates.height = Math.max(5, node.height() * scaleY);
    }

    // Pass both old and new state for undo/redo
    onChange(updates, {
      oldState: transformStartStateRef.current,
      isTransform: true
    });
    
    transformStartStateRef.current = null;
  };

  const handleDoubleClick = (e) => {
    if (shape.type === SHAPE_TYPES.TEXT && onStartEdit) {
      // Text shapes: open text editor
      onStartEdit(shape.id);
    } else if (onColorChange) {
      // Other shapes: open color picker
      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      onColorChange(shape.id, pointerPos);
    }
  };

  // Render appropriate shape based on type
  const renderShape = () => {
    const commonProps = {
      ref: shapeRef,
      id: shape.id, // Important: Set ID so Transformer can identify nodes
      onClick: handleClick,
      onTap: handleClick,
      draggable: shape.draggable !== false,
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      onTransformStart: handleTransformStart,
      onTransformEnd: handleTransformEnd,
    };

    switch (shape.type) {
      case SHAPE_TYPES.RECT:
        return (
          <Rect
            {...commonProps}
            onDblClick={handleDoubleClick}
            onDblTap={handleDoubleClick}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            rotation={shape.rotation || 0}
          />
        );

      case SHAPE_TYPES.CIRCLE:
        return (
          <Circle
            {...commonProps}
            onDblClick={handleDoubleClick}
            onDblTap={handleDoubleClick}
            x={shape.x}
            y={shape.y}
            radius={shape.radius}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
        );

      case SHAPE_TYPES.TEXT:
        return (
          <Text
            {...commonProps}
            onDblClick={handleDoubleClick}
            onDblTap={handleDoubleClick}
            x={shape.x}
            y={shape.y}
            text={shape.text}
            fontSize={shape.fontSize}
            fill={shape.fill}
            fontFamily="Arial"
          />
        );

      case SHAPE_TYPES.TRIANGLE: {
        const w = shape.width;
        const h = shape.height;
        // Define points relative to the Line's x/y position (not absolute coordinates)
        // This ensures the triangle transforms correctly with the Transformer
        const points = [
          w / 2, 0,     // top center (relative to shape.x, shape.y)
          w, h,         // bottom right
          0, h,         // bottom left
        ];
        return (
          <Line
            {...commonProps}
            onDblClick={handleDoubleClick}
            onDblTap={handleDoubleClick}
            x={shape.x}
            y={shape.y}
            points={points}
            closed
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            rotation={shape.rotation || 0}
          />
        );
      }

      default:
        return null;
    }
  };

  return renderShape();
});

Shape.displayName = 'Shape';

export default Shape;

