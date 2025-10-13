/**
 * Shape Component - Renders different shape types (rect, circle, text)
 * Handles selection, dragging, and transformation
 */

import { useRef, useEffect } from 'react';
import { Rect, Circle, Text, Transformer } from 'react-konva';
import { SHAPE_TYPES } from '../../utils/shapes';

const Shape = ({ shape, isSelected, onSelect, onChange, onStartEdit }) => {
  const shapeRef = useRef();
  const transformerRef = useRef();

  // Attach transformer to selected shape
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e) => {
    onChange({
      x: e.target.x(),
      y: e.target.y(),
    });
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
    }

    onChange(updates);
  };

  const handleDoubleClick = () => {
    // Only allow editing for text shapes
    if (shape.type === SHAPE_TYPES.TEXT && onStartEdit) {
      onStartEdit(shape.id);
    }
  };

  // Render appropriate shape based on type
  const renderShape = () => {
    const commonProps = {
      ref: shapeRef,
      onClick: onSelect,
      onTap: onSelect,
      draggable: shape.draggable !== false,
      onDragEnd: handleDragEnd,
      onTransformEnd: handleTransformEnd,
    };

    switch (shape.type) {
      case SHAPE_TYPES.RECT:
        return (
          <Rect
            {...commonProps}
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

      default:
        return null;
    }
  };

  return (
    <>
      {renderShape()}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default Shape;

