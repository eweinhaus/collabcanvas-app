/**
 * Shape Component - Renders different shape types (rect, circle, text)
 * Handles selection, dragging, and transformation
 */

import { useRef, useEffect, useCallback, useState, forwardRef } from 'react';
import { Rect, Circle, Text, Line, Group } from 'react-konva';
import { SHAPE_TYPES } from '../../utils/shapes';
import { throttle } from '../../utils/throttle';
import { getUserColor } from '../../utils/getUserColor';
import { setEditBuffer, removeEditBuffer } from '../../offline/editBuffers';

const DRAG_THROTTLE_MS = 100;
const TRANSFORM_THROTTLE_MS = 100;
const BUFFER_THROTTLE_MS = 250; // Throttle buffer writes

const Shape = forwardRef(({ shape, isSelected, isBeingEdited, editorUserId, showEditFlash, flashEditorUserId, onlineUsers = [], onSelect, onChange, onDragStart, onDragMove, onDragEnd, onTransformStart, onTransformMove, onTransformEnd, onStartEdit, onColorChange, onToggleSelect, onContextMenu, onHoverChange }, ref) => {
  const shapeRef = ref || useRef();
  const dragStartStateRef = useRef(null);
  const transformStartStateRef = useRef(null);
  const throttledDragRef = useRef(null);
  const throttledTransformRef = useRef(null);
  const throttledBufferRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Notify parent when hover state changes
  useEffect(() => {
    if (onHoverChange) {
      onHoverChange(shape.id, showTooltip);
    }
  }, [showTooltip, shape.id, onHoverChange]);

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

  // Initialize throttled buffer writer (writes full shape props to IndexedDB)
  useEffect(() => {
    if (!throttledBufferRef.current) {
      throttledBufferRef.current = throttle((shapeData) => {
        setEditBuffer(shape.id, shapeData).catch((err) => {
          console.error('[Shape] Error buffering shape:', err);
        });
      }, BUFFER_THROTTLE_MS);
    }
    return () => {
      throttledBufferRef.current?.cancel?.();
    };
  }, [shape.id]);

  const handleDragStart = useCallback((e) => {
    // Capture state before drag for undo
    dragStartStateRef.current = {
      x: shape.x,
      y: shape.y,
    };
    
    // Notify parent that drag started
    if (onDragStart) {
      onDragStart();
    }
  }, [shape.x, shape.y, onDragStart]);

  const handleDragMove = useCallback((e) => {
    const x = e.target.x();
    const y = e.target.y();
    
    // Buffer full shape props to IndexedDB (throttled)
    if (throttledBufferRef.current) {
      throttledBufferRef.current({
        ...shape,
        x,
        y,
      });
    }
    
    // Broadcast drag position to other users
    if (throttledDragRef.current) {
      throttledDragRef.current(x, y);
    }
  }, [shape]);

  const handleDragEnd = useCallback((e) => {
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
    
    // Clean up drag broadcast
    if (onDragEnd) {
      onDragEnd();
    }
    
    // Remove edit buffer after successful write
    removeEditBuffer(shape.id).catch(() => {
      // ignore errors
    });
  }, [shape.id, onChange, onDragEnd]);

  const handleTransformStart = useCallback(() => {
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
    
    // Notify parent that transform started
    if (onTransformStart) {
      onTransformStart();
    }
  }, [shape, onTransformStart]);

  const handleTransform = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;

    const transformData = {
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
    };

    // Buffer full shape props during transform (throttled)
    if (throttledBufferRef.current) {
      throttledBufferRef.current({
        ...shape,
        ...transformData,
      });
    }

    // Broadcast transform state during transformation
    if (throttledTransformRef.current) {
      throttledTransformRef.current(transformData);
    }
  }, [shape]);

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

    // Pass both old and new state for undo/redo
    onChange(updates, {
      oldState: transformStartStateRef.current,
      isTransform: true
    });
    
    transformStartStateRef.current = null;
    
    // Clean up transform broadcast
    if (onTransformEnd) {
      onTransformEnd();
    }
    
    // Remove edit buffer after successful write
    removeEditBuffer(shape.id).catch(() => {
      // ignore errors
    });
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
      id: shape.id, // Important: Set ID so Transformer can identify nodes
      onClick: handleClick,
      onTap: handleClick,
      draggable: shape.draggable !== false && !isBeingEdited, // Disable drag if being edited by someone else
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      onTransformStart: handleTransformStart,
      onTransform: handleTransform,
      onTransformEnd: handleTransformEnd,
      onMouseEnter: () => setShowTooltip(true),
      onMouseLeave: () => setShowTooltip(false),
      onContextMenu: onContextMenu,
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

  return (
    <>
      {renderShape()}
      {renderLockIcon()}
    </>
  );
});

Shape.displayName = 'Shape';

export default Shape;

