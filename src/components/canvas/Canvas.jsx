/**
 * Canvas Component - Main canvas with pan, zoom, and shape rendering
 * Uses react-konva for performant rendering
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import { useCanvas, useCanvasActions } from '../../context/CanvasContext';
import { useAuth } from '../../context/AuthContext';
import { isFirebaseReady, waitForFirebase } from '../../services/firebase';
import { calculateNewScale, calculateZoomPosition } from '../../utils/canvas';
import { createShape } from '../../utils/shapes';
import { useRealtimeCursor } from '../../hooks/useRealtimeCursor';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { useShapeTransform } from '../../hooks/useShapeTransform';
import { useCanvasKeyboardShortcuts } from '../../hooks/useCanvasKeyboardShortcuts';
import { CreateShapeCommand, DeleteShapeCommand, MoveShapeCommand, UpdateShapeCommand, BringToFrontCommand, SendToBackCommand, BringForwardCommand, SendBackwardCommand, BatchCommand } from '../../utils/commands';
import { debounce } from '../../utils/debounce';
import { subscribeToDragUpdates } from '../../services/dragBroadcastService';
import Shape from './Shape';
import GridBackground from './GridBackground';
import TextEditor from './TextEditor';
import InterpolatedRemoteCursor from './InterpolatedRemoteCursor';
import ShortcutsModal from '../common/ShortcutsModal';
import ColorPicker from './ColorPicker';
import SelectionBox from './SelectionBox';
import ShapeContextMenu from './ShapeContextMenu';
import ShapeTooltip from './ShapeTooltip';
import AlignmentToolbar from './AlignmentToolbar';
import './Canvas.css';

/**
 * Helper function to get the center point of any shape
 * @param {Object} shape - Shape object with type and dimensions
 * @returns {Object} - { centerX, centerY }
 */
const getShapeCenter = (shape) => {
  // All shapes store their center coordinates in x,y properties
  // This is already the center point for positioning indicators
  return {
    centerX: shape.x,
    centerY: shape.y
  };
};

const Canvas = ({ showGrid = false, boardId = 'default', onCanvasClick, onOpenShortcuts }) => {
  const { state, firestoreActions, commandActions, stageRef, setIsExportingRef, drag, transform } = useCanvas();
  const { user } = useAuth();
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
  const [activeEdits, setActiveEdits] = useState({}); // Map of shapeId -> { userId, type: 'drag'|'transform' }
  const [locallyEditingShapes, setLocallyEditingShapes] = useState(new Set()); // Track shapes user is currently editing
  const [recentEdits, setRecentEdits] = useState({}); // Map of shapeId -> { userId, timestamp } for 1s flash
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, shapeId: null });
  const [hoveredShapes, setHoveredShapes] = useState({}); // Track which shapes are being hovered { [shapeId]: true }
  const [alignmentToolbarPos, setAlignmentToolbarPos] = useState(null); // Position for alignment toolbar
  const selectionStartRef = useRef(null);
  const { remoteCursors, publishLocalCursor, clearLocalCursor } = useRealtimeCursor({ boardId });
  const debouncedTextSaveRef = useRef(null);

  const { shapes, selectedId, selectedIds, currentTool, scale, position, stageSize, loadingShapes, onlineUsers, hiddenLayers } = state;

  // Sort shapes by zIndex and filter out hidden layers (memoized for performance)
  const sortedShapes = useMemo(() => {
    return [...shapes]
      .filter(shape => !hiddenLayers.has(shape.id))
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  }, [shapes, hiddenLayers]);
  
  // Handle shape hover state changes
  const handleShapeHover = useCallback((shapeId, isHovered) => {
    setHoveredShapes(prev => {
      if (isHovered) {
        return { ...prev, [shapeId]: true };
      } else {
        const next = { ...prev };
        delete next[shapeId];
        return next;
      }
    });
  }, []);

  // Expose setIsExporting to context for Toolbar
  useEffect(() => {
    setIsExportingRef.current = setIsExporting;
  }, [setIsExportingRef]);

  // Expose shortcuts opener to parent component without calling it
  useEffect(() => {
    if (onOpenShortcuts) {
      const openFn = () => setShowShortcuts(true);
      onOpenShortcuts(openFn);
    }
  }, [onOpenShortcuts]);

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

  // Track shape updates for visual feedback flash
  useEffect(() => {
    // Monitor shape updates and trigger visual flash
    shapes.forEach(shape => {
      if (shape.updatedBy && shape.updatedAt) {
        const editKey = `${shape.id}-${shape.updatedAt}`;
        if (!recentEdits[editKey]) {
          // New edit detected, trigger flash
          setRecentEdits(prev => ({
            ...prev,
            [shape.id]: {
              userId: shape.updatedBy,
              timestamp: Date.now(),
              editKey,
            }
          }));

          // Remove flash after 1 second
          setTimeout(() => {
            setRecentEdits(prev => {
              const next = { ...prev };
              if (next[shape.id]?.editKey === editKey) {
                delete next[shape.id];
              }
              return next;
            });
          }, 1000);
        }
      }
    });
  }, [shapes]);

  // Drag subscription for real-time shape movement
  useEffect(() => {
    if (!user) return undefined;
    
    // Custom subscription to track active edits
    const unsubscribe = subscribeToDragUpdates({
      boardId,
      excludeUserId: user.uid,
      onUpdate: (updates) => {
        // Track who is editing which shapes
        const newActiveEdits = {};
        updates.forEach(({ shapeId, userId, timestamp }) => {
          newActiveEdits[shapeId] = { userId, type: 'drag', timestamp };
        });
        setActiveEdits(prev => ({ ...prev, ...newActiveEdits }));
        
        // Also apply position updates via context
        drag.startDragSubscription({
          boardId,
          excludeUserId: user.uid,
        });
      },
    });
    
    // Cleanup stale active edits after delay
    const cleanupInterval = setInterval(() => {
      setActiveEdits(prev => {
        const now = Date.now();
        const filtered = {};
        Object.entries(prev).forEach(([shapeId, edit]) => {
          // Keep edits from last 2 seconds
          if (edit.timestamp && now - edit.timestamp < 2000) {
            filtered[shapeId] = edit;
          }
        });
        return filtered;
      });
    }, 1000);
    
    return () => {
      unsubscribe();
      drag.stopDragSubscription();
      clearInterval(cleanupInterval);
    };
  }, [boardId, drag, user]);

  // Transform subscription for real-time shape transforms
  useEffect(() => {
    if (!user) return undefined;
    
    const unsubscribe = transform.startTransformSubscription({
      boardId,
      excludeUserId: user.uid,
    });
    
    return () => {
      transform.stopTransformSubscription();
    };
  }, [boardId, transform, user]);

  // Don't auto-subscribe to comments - subscribe on-demand when user interacts
  // This prevents unnecessary Firestore connections that trigger reconciliation

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
      
      // Create debounced save function for auto-save
      if (!debouncedTextSaveRef.current) {
        debouncedTextSaveRef.current = debounce((id, text) => {
          firestoreActions.updateShapeText(id, text || 'Double-click to edit');
        }, 500); // 500ms debounce
      }
    }
  }, [shapes, firestoreActions]);

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

  const handleTextChange = useCallback((newText) => {
    setEditingText(newText);
    
    // Auto-save with debounce
    if (editingTextId && debouncedTextSaveRef.current) {
      debouncedTextSaveRef.current(editingTextId, newText);
    }
  }, [editingTextId]);

  const handleFinishEdit = useCallback(() => {
    if (editingTextId) {
      // Cancel any pending debounced save
      debouncedTextSaveRef.current?.cancel();
      
      // Immediately save on blur
      firestoreActions.updateShapeText(editingTextId, editingText || 'Double-click to edit');
      setEditingTextId(null);
      setEditingText('');
    }
  }, [editingTextId, editingText, firestoreActions]);

  // Use custom hooks for transform and keyboard shortcuts
  const { handleTransformStart, handleTransformEnd } = useShapeTransform({
    selectedIds,
    shapes,
    transformerRef,
    firestoreActions,
    commandActions,
  });

  // Handle alignment operations
  const handleAlign = useCallback((updates, alignmentType) => {
    if (!updates || updates.length === 0) return;

    // Batch update all aligned shapes
    firestoreActions.batchUpdatePosition(updates);
  }, [firestoreActions]);

  // Calculate alignment toolbar position based on selected shapes
  useEffect(() => {
    if (selectedIds.length >= 2 && stageRef.current) {
      const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
      if (selectedShapes.length < 2) {
        setAlignmentToolbarPos(null);
        return;
      }

      // Calculate bounding box of selection
      const xs = selectedShapes.flatMap(s => {
        if (s.type === 'circle') {
          return [s.x - (s.radius || 0), s.x + (s.radius || 0)];
        }
        return [s.x, s.x + (s.width || 100)];
      });
      const ys = selectedShapes.flatMap(s => {
        if (s.type === 'circle') {
          return [s.y - (s.radius || 0), s.y + (s.radius || 0)];
        }
        return [s.y, s.y + (s.height || 100)];
      });

      const minX = Math.min(...xs);
      const minY = Math.min(...ys);

      // Transform to screen coordinates
      const stage = stageRef.current;
      const stageScale = stage.scaleX();
      const stagePos = stage.position();
      const screenX = minX * stageScale + stagePos.x;
      const screenY = minY * stageScale + stagePos.y - 50; // Position above selection

      setAlignmentToolbarPos({ x: screenX, y: Math.max(70, screenY) });
    } else {
      setAlignmentToolbarPos(null);
    }
  }, [selectedIds, shapes, stageRef]);

  // Handle keyboard shortcuts using custom hook
  useCanvasKeyboardShortcuts({
    editingTextId,
    selectedIds,
    shapes,
    clipboard,
    setClipboard,
    actions,
    firestoreActions,
    commandActions,
    handleAlign,
    setShowShortcuts,
    setContextMenu,
  });

  return (
    <div className={`canvas-container ${currentTool === 'pan' ? 'panning' : ''} ${currentTool && currentTool !== 'pan' ? 'tool-active' : ''}`}>
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
        draggable={(!currentTool || currentTool === 'pan') && !isSelecting} // Draggable in select mode or pan mode
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
          {sortedShapes.map((shape) => {
            // Hide shape if it's being edited
            if (shape.id === editingTextId) {
              return null;
            }
            
            const activeEdit = activeEdits[shape.id];
            const isBeingEdited = activeEdit && activeEdit.userId !== user?.uid;
            const recentEdit = recentEdits[shape.id];
            const showEditFlash = recentEdit && recentEdit.userId !== user?.uid;
            
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
                isBeingEdited={isBeingEdited}
                editorUserId={activeEdit?.userId}
                showEditFlash={showEditFlash}
                flashEditorUserId={recentEdit?.userId}
                onlineUsers={onlineUsers}
                boardId={boardId}
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
                onDragStart={() => {
                  // Mark shape as being edited locally
                  setLocallyEditingShapes(prev => new Set([...prev, shape.id]));
                }}
                onDragMove={(x, y) => {
                  drag.publishDrag({ boardId, shapeId: shape.id, x, y });
                }}
                onDragEnd={() => {
                  // Remove from locally editing set
                  setLocallyEditingShapes(prev => {
                    const next = new Set(prev);
                    next.delete(shape.id);
                    return next;
                  });
                  
                  // Clear drag broadcast
                  drag.clearDrag({ boardId, shapeId: shape.id });
                }}
                onTransformStart={() => {
                  // Mark shape as being transformed locally
                  setLocallyEditingShapes(prev => new Set([...prev, shape.id]));
                }}
                onTransformMove={(transformData) => {
                  transform.publishTransform({ boardId, shapeId: shape.id, ...transformData });
                }}
                onTransformEnd={() => {
                  // Remove from locally editing set
                  setLocallyEditingShapes(prev => {
                    const next = new Set(prev);
                    next.delete(shape.id);
                    return next;
                  });
                  
                  transform.clearTransform({ boardId, shapeId: shape.id });
                }}
                onStartEdit={handleStartEdit}
                onColorChange={handleColorChange}
                onContextMenu={(e) => {
                  e.evt.preventDefault();
                  const stage = e.target.getStage();
                  const pointerPosition = stage.getPointerPosition();
                  setContextMenu({
                    visible: true,
                    x: pointerPosition.x,
                    y: pointerPosition.y,
                    shapeId: shape.id,
                  });
                  // Select the shape if it's not already selected
                  if (!selectedIds.includes(shape.id)) {
                    actions.setSelectedId(shape.id);
                  }
                }}
                onHoverChange={handleShapeHover}
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
              <InterpolatedRemoteCursor
                key={cursor.uid}
                x={cursor.x}
                y={cursor.y}
                color={cursor.color}
                label={cursor.name}
              />
            );
          })}
        </Layer>
        
        {/* Tooltips layer - renders on top of everything */}
        <Layer listening={false}>
          {/* Tooltips - only visible on hover */}
          {sortedShapes.map((shape) => {
            if (!hoveredShapes[shape.id]) return null;

            // Calculate CENTER position of shape (already in canvas coordinates)
            const { centerX, centerY } = getShapeCenter(shape);

            // For text shapes, position tooltip slightly higher
            const tooltipY = shape.type === 'text' ? centerY - 20 : centerY;

            return (
              <ShapeTooltip
                key={`tooltip-${shape.id}`}
                shape={shape}
                x={centerX}
                y={tooltipY}
                onlineUsers={onlineUsers}
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
            onChange={handleTextChange}
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
      {contextMenu.visible && contextMenu.shapeId && (
        <ShapeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu({ visible: false, x: 0, y: 0, shapeId: null })}
          onBringToFront={() => {
            const command = new BringToFrontCommand(contextMenu.shapeId, sortedShapes, firestoreActions);
            commandActions.executeCommand(command);
          }}
          onSendToBack={() => {
            const command = new SendToBackCommand(contextMenu.shapeId, sortedShapes, firestoreActions);
            commandActions.executeCommand(command);
          }}
          onBringForward={() => {
            const command = new BringForwardCommand(contextMenu.shapeId, sortedShapes, firestoreActions);
            commandActions.executeCommand(command);
          }}
          onSendBackward={() => {
            const command = new SendBackwardCommand(contextMenu.shapeId, sortedShapes, firestoreActions);
            commandActions.executeCommand(command);
          }}
        />
      )}
      
      {/* Alignment Toolbar */}
      {alignmentToolbarPos && selectedIds.length >= 2 && !isExporting && (
        <AlignmentToolbar
          selectedShapes={shapes.filter(s => selectedIds.includes(s.id))}
          onAlign={handleAlign}
          position={alignmentToolbarPos}
        />
      )}
    </div>
  );
};

export default Canvas;

