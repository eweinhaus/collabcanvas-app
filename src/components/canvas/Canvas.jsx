/**
 * Canvas Component - Main canvas with pan, zoom, and shape rendering
 * Uses react-konva for performant rendering
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import { useCanvas, useCanvasActions } from '../../context/CanvasContext';
import { calculateNewScale, calculateZoomPosition } from '../../utils/canvas';
import { createShape } from '../../utils/shapes';
import { useRealtimeCursor } from '../../hooks/useRealtimeCursor';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { CreateShapeCommand, DeleteShapeCommand, MoveShapeCommand, UpdateShapeCommand } from '../../utils/commands';
import Shape from './Shape';
import GridBackground from './GridBackground';
import TextEditor from './TextEditor';
import RemoteCursor from './RemoteCursor';
import ShortcutsModal from '../common/ShortcutsModal';
import ColorPicker from './ColorPicker';
import SelectionBox from './SelectionBox';
import './Canvas.css';

const Canvas = ({ showGrid = false, boardId = 'default' }) => {
  const { state, firestoreActions, commandActions, stageRef, setIsExportingRef } = useCanvas();
  const transformerRef = useRef(null);
  const shapeRefsRef = useRef({});
  const actions = useCanvasActions();
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [colorPickerState, setColorPickerState] = useState({ isOpen: false, shapeId: null, x: 0, y: 0 });
  const [clipboard, setClipboard] = useState(null);
  const [selectionBox, setSelectionBox] = useState({ visible: false, x: 0, y: 0, width: 0, height: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // Hide UI elements during export
  const selectionStartRef = useRef(null);
  const transformStartStateRef = useRef({}); // Store state before transform for undo
  const { remoteCursors, publishLocalCursor, clearLocalCursor } = useRealtimeCursor({ boardId });

  const { shapes, selectedId, selectedIds, currentTool, scale, position, stageSize, loadingShapes } = state;

  // Expose setIsExporting to context for Toolbar
  useEffect(() => {
    setIsExportingRef.current = setIsExporting;
  }, [setIsExportingRef]);

  // Presence subscription lifecycle tied to Canvas mount
  useRealtimePresence({ boardId });

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current) {
      const selectedNodes = selectedIds
        .map(id => shapeRefsRef.current[id])
        .filter(node => node);
      
      transformerRef.current.nodes(selectedNodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      actions.setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [actions]);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const newScale = calculateNewScale(oldScale, e.evt.deltaY);
    
    // Only update if scale actually changed (respects constraints)
    if (newScale !== oldScale) {
      const newPosition = calculateZoomPosition(stage, oldScale, newScale, pointer);
      
      actions.setScale(newScale);
      actions.setPosition(newPosition);
    }
  }, [actions]);

  // Handle mouse down on stage for selection box
  const handleStageMouseDown = useCallback((e) => {
    // Only start selection box on empty stage in select mode
    if (e.target === e.target.getStage() && !currentTool) {
      const stage = stageRef.current;
      const pointerPosition = stage.getPointerPosition();
      
      // Convert screen coordinates to canvas coordinates
      const x = (pointerPosition.x - position.x) / scale;
      const y = (pointerPosition.y - position.y) / scale;
      
      selectionStartRef.current = { x, y };
      setIsSelecting(true);
      setSelectionBox({ visible: true, x, y, width: 0, height: 0 });
    }
  }, [currentTool, scale, position]);

  // Handle mouse move for selection box
  const handleStageMouseMove = useCallback((e) => {
    if (!isSelecting || !selectionStartRef.current) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;
    
    // Convert screen coordinates to canvas coordinates
    const x = (pointerPosition.x - position.x) / scale;
    const y = (pointerPosition.y - position.y) / scale;
    
    const startX = selectionStartRef.current.x;
    const startY = selectionStartRef.current.y;
    
    // Calculate box dimensions (handle negative widths/heights)
    const width = x - startX;
    const height = y - startY;
    
    setSelectionBox({
      visible: true,
      x: width < 0 ? x : startX,
      y: height < 0 ? y : startY,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  }, [isSelecting, scale, position]);

  // Handle mouse up to complete selection
  const handleStageMouseUp = useCallback((e) => {
    if (isSelecting) {
      // Calculate which shapes intersect with the selection box
      const box = selectionBox;
      
      if (box.width > 5 && box.height > 5) {
        // Only select if box is large enough (avoids accidental tiny drags)
        const selectedShapeIds = shapes
          .filter(shape => {
            // Check if shape intersects with selection box
            const shapeRight = shape.x + (shape.width || shape.radius * 2 || 100);
            const shapeBottom = shape.y + (shape.height || shape.radius * 2 || 50);
            
            return (
              shape.x < box.x + box.width &&
              shapeRight > box.x &&
              shape.y < box.y + box.height &&
              shapeBottom > box.y
            );
          })
          .map(shape => shape.id);
        
        if (selectedShapeIds.length > 0) {
          actions.setSelectedIds(selectedShapeIds);
        }
      } else {
        // Box too small (was a click, not a drag) - clear selection
        actions.clearSelection();
      }
      
      // Reset selection box
      setIsSelecting(false);
      setSelectionBox({ visible: false, x: 0, y: 0, width: 0, height: 0 });
      selectionStartRef.current = null;
    }
  }, [isSelecting, selectionBox, shapes, actions]);

  // Handle stage click for shape creation or deselection
  const handleStageClick = useCallback((e) => {
    // Click on empty area
    if (e.target === e.target.getStage()) {
      if (currentTool) {
        // Create a new shape at click position
        const stage = stageRef.current;
        const pointerPosition = stage.getPointerPosition();
        
        // Convert screen coordinates to canvas coordinates
        const x = (pointerPosition.x - position.x) / scale;
        const y = (pointerPosition.y - position.y) / scale;
        
        const newShape = createShape(currentTool, x, y);
        
        // Use CommandHistory for undo/redo support
        const command = new CreateShapeCommand(newShape, firestoreActions, actions);
        commandActions.executeCommand(command);
        
        // Optionally clear tool after creating shape (comment out to keep tool active)
        // actions.setCurrentTool(null);
      } else if (!isSelecting) {
        // Deselect when clicking empty area in select mode (but not if we were dragging)
        actions.clearSelection();
      }
    }
  }, [currentTool, actions, scale, position, firestoreActions, commandActions, isSelecting]);

  const handlePointerMove = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    // Convert to canvas coordinates (same space as shapes)
    const x = (pointer.x - position.x) / scale;
    const y = (pointer.y - position.y) / scale;
    // Note: logging throttled to avoid console spam - actual publish is throttled
    publishLocalCursor({ x, y, scaleOverride: scale });
  }, [position.x, position.y, scale, publishLocalCursor]);

  const handlePointerLeave = useCallback(() => {
    clearLocalCursor();
  }, [clearLocalCursor]);

  // Handle cursor updates during stage drag (Chrome compatibility)
  const handleStageDrag = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    // Update position during drag
    const newPos = stage.position();
    // Convert to canvas coordinates with updated position
    const x = (pointer.x - newPos.x) / scale;
    const y = (pointer.y - newPos.y) / scale;
    publishLocalCursor({ x, y, scaleOverride: scale });
  }, [scale, publishLocalCursor]);

  // Handle text editing
  const handleStartEdit = useCallback((shapeId) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (shape) {
      setEditingTextId(shapeId);
      setEditingText(shape.text);
    }
  }, [shapes]);

  const handleColorChange = useCallback((shapeId, position) => {
    setColorPickerState({
      isOpen: true,
      shapeId,
      x: position.x,
      y: position.y,
    });
  }, []);

  const handleSelectColor = useCallback((color) => {
    if (colorPickerState.shapeId) {
      const shape = shapes.find(s => s.id === colorPickerState.shapeId);
      if (shape) {
        // Use UpdateShapeCommand for undo/redo support
        const command = new UpdateShapeCommand(
          colorPickerState.shapeId,
          { fill: shape.fill }, // old color
          { fill: color }, // new color
          firestoreActions
        );
        commandActions.executeCommand(command);
      }
    }
  }, [colorPickerState.shapeId, shapes, firestoreActions, commandActions]);

  const handleFinishEdit = useCallback(() => {
    if (editingTextId) {
      firestoreActions.updateShapeText(editingTextId, editingText || 'Double-click to edit');
      setEditingTextId(null);
      setEditingText('');
    }
  }, [editingTextId, editingText, actions]);

  // Handle transform start - capture state for undo
  const handleTransformStart = useCallback(() => {
    // Store the current state of all selected shapes
    transformStartStateRef.current = {};
    selectedIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        // Only capture properties that exist (not undefined)
        const state = {
          x: shape.x,
          y: shape.y,
          rotation: shape.rotation || 0,
        };
        
        // Add shape-specific properties only if they exist
        if (shape.width !== undefined) state.width = shape.width;
        if (shape.height !== undefined) state.height = shape.height;
        if (shape.radius !== undefined) state.radius = shape.radius;
        if (shape.fontSize !== undefined) state.fontSize = shape.fontSize;
        
        transformStartStateRef.current[id] = state;
      }
    });
  }, [selectedIds, shapes]);

  // Handle transform end - create undo commands
  const handleTransformEnd = useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();

    nodes.forEach(node => {
      const shapeId = node.id();
      const shape = shapes.find(s => s.id === shapeId);
      if (!shape) return;

      const oldState = transformStartStateRef.current[shapeId];
      if (!oldState) return;

      // Get the new state from the node
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale
      node.scaleX(1);
      node.scaleY(1);

      const newState = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      // Update dimensions based on shape type (only add properties that should exist)
      if (shape.type === 'rect' || shape.type === 'triangle') {
        newState.width = Math.max(5, node.width() * scaleX);
        newState.height = Math.max(5, node.height() * scaleY);
      } else if (shape.type === 'circle') {
        newState.radius = Math.max(5, node.radius() * Math.max(scaleX, scaleY));
      } else if (shape.type === 'text') {
        newState.fontSize = Math.max(5, node.fontSize() * scaleX);
      }

      // Create and execute command
      const command = new UpdateShapeCommand(
        shapeId,
        oldState,
        newState,
        firestoreActions
      );
      commandActions.executeCommand(command);
    });

    transformStartStateRef.current = {};
  }, [shapes, firestoreActions, commandActions]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when editing text
      if (editingTextId) return;
      
      // Undo (Cmd/Ctrl + Z) - must be before other shortcuts to prevent conflicts
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (commandActions.canUndo) {
          commandActions.undo();
        }
        return;
      }
      
      // Redo (Cmd/Ctrl + Shift + Z)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (commandActions.canRedo) {
          commandActions.redo();
        }
        return;
      }
      
      // Show shortcuts modal
      if (e.key === '?' || (e.key === '/' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }
      
      // Copy selected shapes (Cmd/Ctrl + C)
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedIds.length > 0) {
        e.preventDefault();
        const shapesToCopy = shapes.filter(s => selectedIds.includes(s.id));
        if (shapesToCopy.length > 0) {
          setClipboard(shapesToCopy);
        }
      }
      
      // Paste shapes (Cmd/Ctrl + V)
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && clipboard) {
        e.preventDefault();
        const clipboardArray = Array.isArray(clipboard) ? clipboard : [clipboard];
        const newIds = [];
        
        clipboardArray.forEach((shapeToPaste) => {
          const newShape = {
            ...shapeToPaste,
            id: crypto.randomUUID(),
            x: shapeToPaste.x + 20,
            y: shapeToPaste.y + 20,
          };
          // Use CommandHistory for undo/redo support
          const command = new CreateShapeCommand(newShape, firestoreActions, actions);
          commandActions.executeCommand(command);
          newIds.push(newShape.id);
        });
        
        // Select all newly pasted shapes
        actions.setSelectedIds(newIds);
      }
      
      // Duplicate selected shapes (Cmd/Ctrl + D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedIds.length > 0) {
        e.preventDefault();
        const shapesToDuplicate = shapes.filter(s => selectedIds.includes(s.id));
        const newIds = [];
        
        shapesToDuplicate.forEach((shapeToDuplicate) => {
          const newShape = {
            ...shapeToDuplicate,
            id: crypto.randomUUID(),
            x: shapeToDuplicate.x + 20,
            y: shapeToDuplicate.y + 20,
          };
          // Use CommandHistory for undo/redo support
          const command = new CreateShapeCommand(newShape, firestoreActions, actions);
          commandActions.executeCommand(command);
          newIds.push(newShape.id);
        });
        
        // Select all newly duplicated shapes
        actions.setSelectedIds(newIds);
      }
      
      // Delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        selectedIds.forEach(id => {
          const shape = shapes.find(s => s.id === id);
          if (shape) {
            // Use CommandHistory for undo/redo support
            const command = new DeleteShapeCommand(id, shape, firestoreActions);
            commandActions.executeCommand(command);
          }
        });
      }
      
      // Arrow key movement (5px normal, 20px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 5;
        
        selectedIds.forEach(shapeId => {
          const shape = shapes.find(s => s.id === shapeId);
          if (!shape) return;
          
          const oldPosition = { x: shape.x, y: shape.y };
          const newPosition = { x: shape.x, y: shape.y };
          
          switch (e.key) {
            case 'ArrowUp':
              newPosition.y -= step;
              break;
            case 'ArrowDown':
              newPosition.y += step;
              break;
            case 'ArrowLeft':
              newPosition.x -= step;
              break;
            case 'ArrowRight':
              newPosition.x += step;
              break;
          }
          
          // Use MoveShapeCommand for undo/redo support
          const command = new MoveShapeCommand(
            shapeId,
            oldPosition,
            newPosition,
            firestoreActions
          );
          commandActions.executeCommand(command);
        });
      }
      
      // Escape to clear selection and tool
      if (e.key === 'Escape') {
        actions.clearSelection();
        actions.setCurrentTool(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, shapes, clipboard, actions, editingTextId, firestoreActions, commandActions, stageRef]);

  return (
    <div className="canvas-container">
      {loadingShapes && (
        <div className="canvas-loading-overlay" role="status" aria-live="polite">
          <div className="spinner" />
        </div>
      )}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={!currentTool && !isSelecting} // Only draggable in select mode and not selecting
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={(e) => {
          handlePointerMove(e);
          handleStageMouseMove(e);
        }}
        onMouseUp={handleStageMouseUp}
        onTouchMove={handlePointerMove}
        onDragMove={handleStageDrag}
        onMouseLeave={handlePointerLeave}
        onTouchEnd={handlePointerLeave}
      >
        {/* Grid background layer (optional) - hide during export */}
        {showGrid && !isExporting && (
          <Layer listening={false}>
            <GridBackground
              width={stageSize.width / scale}
              height={stageSize.height / scale}
              offsetX={-position.x / scale}
              offsetY={-position.y / scale}
            />
          </Layer>
        )}
        
        {/* Main shapes layer */}
        <Layer>
          {shapes.map((shape) => {
            // Hide shape if it's being edited
            if (shape.id === editingTextId) {
              return null;
            }
            
            return (
              <Shape
                key={shape.id}
                ref={(node) => {
                  if (node) {
                    shapeRefsRef.current[shape.id] = node;
                  } else {
                    delete shapeRefsRef.current[shape.id];
                  }
                }}
                shape={shape}
                isSelected={selectedIds.includes(shape.id)}
                onSelect={() => {
                  // Only allow selection in select mode
                  if (!currentTool) {
                    actions.setSelectedId(shape.id);
                  }
                }}
                onToggleSelect={(shapeId) => {
                  // Toggle selection with shift/cmd key
                  if (!currentTool) {
                    actions.toggleSelectedId(shapeId);
                  }
                }}
                onChange={(newAttrs, metadata) => {
                  // Check if this change should use undo/redo
                  if (metadata && metadata.oldState) {
                    if (metadata.isMove) {
                      // Drag operation - use MoveShapeCommand
                      const command = new MoveShapeCommand(
                        shape.id,
                        metadata.oldState, // { x, y }
                        { x: newAttrs.x, y: newAttrs.y },
                        firestoreActions
                      );
                      commandActions.executeCommand(command);
                    } else if (metadata.isTransform) {
                      // Transform operation - use UpdateShapeCommand
                      const command = new UpdateShapeCommand(
                        shape.id,
                        metadata.oldState, // all old properties
                        newAttrs, // all new properties
                        firestoreActions
                      );
                      commandActions.executeCommand(command);
                    }
                  } else {
                    // Direct update without undo/redo (e.g., text editing during drag)
                    firestoreActions.updateShape(shape.id, newAttrs);
                  }
                }}
                onStartEdit={handleStartEdit}
                onColorChange={handleColorChange}
              />
            );
          })}
          
          {/* Global Transformer for selected shapes - hide during export */}
          {selectedIds.length > 0 && !isExporting && (
            <Transformer
              ref={transformerRef}
              onTransformStart={handleTransformStart}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit minimum size
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
          
          {/* Selection box for lasso selection */}
          <SelectionBox
            x={selectionBox.x}
            y={selectionBox.y}
            width={selectionBox.width}
            height={selectionBox.height}
            visible={selectionBox.visible}
          />
        </Layer>

        {/* Remote cursors layer */}
        <Layer listening={false}>
          {remoteCursors.map((cursor) => {
            if (cursor?.x == null || cursor?.y == null) return null;
            return (
              <RemoteCursor
                key={cursor.uid}
                x={cursor.x}
                y={cursor.y}
                color={cursor.color}
                label={cursor.name}
              />
            );
          })}
        </Layer>
      </Stage>

      {/* Text editor overlay */}
      {editingTextId && (() => {
        const shape = shapes.find(s => s.id === editingTextId);
        if (!shape) return null;
        
        return (
          <TextEditor
            value={editingText}
            onChange={setEditingText}
            onBlur={handleFinishEdit}
            x={shape.x}
            y={shape.y}
            fontSize={shape.fontSize}
            scale={scale}
            stagePosition={position}
          />
        );
      })()}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ColorPicker
        isOpen={colorPickerState.isOpen}
        onClose={() => setColorPickerState({ isOpen: false, shapeId: null, x: 0, y: 0 })}
        onSelectColor={handleSelectColor}
        x={colorPickerState.x}
        y={colorPickerState.y}
      />
    </div>
  );
};

export default Canvas;

