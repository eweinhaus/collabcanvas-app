/**
 * Shape Component - Renders different shape types (rect, circle, text)
 * Handles selection, dragging, and transformation
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Rect, Circle, Text, Line, Transformer, Group } from 'react-konva';
import { SHAPE_TYPES } from '../../utils/shapes';
import { throttle } from '../../utils/throttle';
import { getUserColor } from '../../utils/getUserColor';
import ShapeTooltip from './ShapeTooltip';

const DRAG_THROTTLE_MS = 100;
const TRANSFORM_THROTTLE_MS = 100;

const Shape = ({ shape, isSelected, isBeingEdited, editorUserId, showEditFlash, flashEditorUserId, onlineUsers = [], onSelect, onChange, onDragStart, onDragMove, onDragEnd, onTransformStart, onTransformMove, onTransformEnd, onStartEdit, onColorChange }) => {
  const shapeRef = useRef();
  const transformerRef = useRef();
  const throttledDragRef = useRef(null);
  const throttledTransformRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Attach transformer to selected shape
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Initialize throttled drag publisher
  useEffect(() => {
    if (onDragMove && !throttledDragRef.current) {
      throttledDragRef.current = throttle((x, y) => {
        onDragMove(x, y);
      }, DRAG_THROTTLE_MS);
    }
    return () => {
      throttledDragRef.current?.cancel?.();
    };
  }, [onDragMove]);

  // Initialize throttled transform publisher
  useEffect(() => {
    if (onTransformMove && !throttledTransformRef.current) {
      throttledTransformRef.current = throttle((transformData) => {
        onTransformMove(transformData);
      }, TRANSFORM_THROTTLE_MS);
    }
    return () => {
      throttledTransformRef.current?.cancel?.();
    };
  }, [onTransformMove]);

  const handleDragStart = useCallback(() => {
    // Notify parent that drag started
    if (onDragStart) {
      onDragStart();
    }
  }, [onDragStart]);

  const handleDragMove = useCallback((e) => {
    const x = e.target.x();
    const y = e.target.y();
    
    // Session storage for persistence
    try {
      sessionStorage.setItem(`editBuffer:${shape.id}`, JSON.stringify({ x, y }));
    } catch {
      // ignore session storage errors
    }
    
    // Broadcast drag position to other users
    if (throttledDragRef.current) {
      throttledDragRef.current(x, y);
    }
  }, [shape.id]);

  const handleDragEnd = useCallback((e) => {
    const x = e.target.x();
    const y = e.target.y();
    
    // Update Firestore with final position
    onChange({ x, y });
    
    // Clean up drag broadcast
    if (onDragEnd) {
      onDragEnd();
    }
    
    try {
      sessionStorage.removeItem(`editBuffer:${shape.id}`);
    } catch {
      // ignore session storage errors
    }
  }, [shape.id, onChange, onDragEnd]);

  const handleTransformStart = useCallback(() => {
    // Notify parent that transform started
    if (onTransformStart) {
      onTransformStart();
    }
  }, [onTransformStart]);

  const handleTransform = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;

    // Broadcast transform state during transformation
    if (throttledTransformRef.current) {
      const transformData = {
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
      };
      throttledTransformRef.current(transformData);
    }
  }, []);

  const handleTransformEnd = useCallback(() => {
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

    // Update Firestore with final transform
    onChange(updates);
    
    // Clean up transform broadcast
    if (onTransformEnd) {
      onTransformEnd();
    }
  }, [shape.id, shape.type, onChange, onTransformEnd]);

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

  // Get editor color for conflict indicator and edit flash
  const editorColor = isBeingEdited ? getUserColor(editorUserId, onlineUsers) : null;
  const flashColor = showEditFlash ? getUserColor(flashEditorUserId, onlineUsers) : null;
  
  // Render appropriate shape based on type
  const renderShape = () => {
    const commonProps = {
      ref: shapeRef,
      onClick: onSelect,
      onTap: onSelect,
      draggable: shape.draggable !== false && !isBeingEdited, // Disable drag if being edited by someone else
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      onTransformStart: handleTransformStart,
      onTransform: handleTransform,
      onTransformEnd: handleTransformEnd,
      onMouseEnter: () => setShowTooltip(true),
      onMouseLeave: () => setShowTooltip(false),
    };
    
    // Add conflict indicator styling or edit flash
    const conflictStyle = isBeingEdited ? {
      stroke: editorColor,
      strokeWidth: 2,
      dash: [10, 5],
      opacity: 0.7,
    } : showEditFlash ? {
      stroke: flashColor,
      strokeWidth: 3,
      opacity: 1,
      shadowColor: flashColor,
      shadowBlur: 10,
      shadowOpacity: 0.8,
    } : {};

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
            stroke={conflictStyle.stroke || shape.stroke}
            strokeWidth={conflictStyle.strokeWidth || shape.strokeWidth}
            dash={conflictStyle.dash}
            opacity={conflictStyle.opacity || 1}
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
            stroke={conflictStyle.stroke || shape.stroke}
            strokeWidth={conflictStyle.strokeWidth || shape.strokeWidth}
            dash={conflictStyle.dash}
            opacity={conflictStyle.opacity || 1}
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
            stroke={conflictStyle.stroke}
            strokeWidth={conflictStyle.strokeWidth ? 1 : 0}
            opacity={conflictStyle.opacity || 1}
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
            stroke={conflictStyle.stroke || shape.stroke}
            strokeWidth={conflictStyle.strokeWidth || shape.strokeWidth}
            dash={conflictStyle.dash}
            opacity={conflictStyle.opacity || 1}
            rotation={shape.rotation || 0}
          />
        );
      }

      default:
        return null;
    }
  };

  // Render lock icon when being edited
  const renderLockIcon = () => {
    if (!isBeingEdited) return null;
    
    const lockSize = 16;
    const x = shape.x + (shape.width || shape.radius || 50);
    const y = shape.y - lockSize - 5;
    
    return (
      <Group x={x} y={y} listening={false}>
        {/* Lock body */}
        <Rect
          x={2}
          y={8}
          width={12}
          height={10}
          fill={editorColor}
          cornerRadius={2}
        />
        {/* Lock shackle */}
        <Circle
          x={8}
          y={6}
          radius={5}
          stroke={editorColor}
          strokeWidth={2}
          fill="transparent"
        />
        <Rect
          x={3}
          y={4}
          width={10}
          height={6}
          fill="white"
        />
      </Group>
    );
  };

  // Calculate tooltip position
  const getTooltipPosition = () => {
    const x = shape.x + (shape.width || shape.radius || 50) / 2;
    const y = shape.y;
    return { x, y };
  };

  const tooltipPos = getTooltipPosition();

  return (
    <>
      {renderShape()}
      {renderLockIcon()}
      {showTooltip && (
        <ShapeTooltip 
          shape={shape} 
          x={tooltipPos.x} 
          y={tooltipPos.y} 
          onlineUsers={onlineUsers} 
        />
      )}
      {isSelected && !isBeingEdited && (
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

