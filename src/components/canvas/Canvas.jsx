/**
 * Canvas Component - Main canvas with pan, zoom, and shape rendering
 * Uses react-konva for performant rendering
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { useCanvas, useCanvasActions } from '../../context/CanvasContext';
import { useAuth } from '../../context/AuthContext';
import { calculateNewScale, calculateZoomPosition } from '../../utils/canvas';
import { createShape } from '../../utils/shapes';
import { useRealtimeCursor } from '../../hooks/useRealtimeCursor';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { debounce } from '../../utils/debounce';
import { subscribeToDragUpdates } from '../../services/dragBroadcastService';
import Shape from './Shape';
import GridBackground from './GridBackground';
import TextEditor from './TextEditor';
import InterpolatedRemoteCursor from './InterpolatedRemoteCursor';
import ShortcutsModal from '../common/ShortcutsModal';
import ColorPicker from './ColorPicker';
import './Canvas.css';

const Canvas = ({ showGrid = false, boardId = 'default' }) => {
  const stageRef = useRef(null);
  const { state, firestoreActions, drag, transform } = useCanvas();
  const { user } = useAuth();
  const actions = useCanvasActions();
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [colorPickerState, setColorPickerState] = useState({ isOpen: false, shapeId: null, x: 0, y: 0 });
  const [clipboard, setClipboard] = useState(null);
  const [activeEdits, setActiveEdits] = useState({}); // Map of shapeId -> { userId, type: 'drag'|'transform' }
  const [locallyEditingShapes, setLocallyEditingShapes] = useState(new Set()); // Track shapes user is currently editing
  const [recentEdits, setRecentEdits] = useState({}); // Map of shapeId -> { userId, timestamp } for 1s flash
  const { remoteCursors, publishLocalCursor, clearLocalCursor } = useRealtimeCursor({ boardId });
  const debouncedTextSaveRef = useRef(null);

  const { shapes, selectedId, currentTool, scale, position, stageSize, loadingShapes, onlineUsers } = state;

  // Presence subscription lifecycle tied to Canvas mount
  useRealtimePresence({ boardId });

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
        firestoreActions.addShape(newShape);
        
        // Optionally clear tool after creating shape (comment out to keep tool active)
        // actions.setCurrentTool(null);
      } else {
        // Deselect when clicking empty area in select mode
        actions.clearSelection();
      }
    }
  }, [currentTool, actions, scale, position, firestoreActions]);

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
      firestoreActions.updateShape(colorPickerState.shapeId, { fill: color });
    }
  }, [colorPickerState.shapeId, firestoreActions]);

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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when editing text
      if (editingTextId) return;
      
      // Show shortcuts modal
      if (e.key === '?' || (e.key === '/' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }
      
      // Copy selected shape (Cmd/Ctrl + C)
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedId) {
        e.preventDefault();
        const shapeToCopy = shapes.find(s => s.id === selectedId);
        if (shapeToCopy) {
          setClipboard(shapeToCopy);
        }
      }
      
      // Paste shape (Cmd/Ctrl + V)
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && clipboard) {
        e.preventDefault();
        const newShape = {
          ...clipboard,
          id: crypto.randomUUID(),
          x: clipboard.x + 20,
          y: clipboard.y + 20,
        };
        firestoreActions.addShape(newShape);
        actions.setSelectedId(newShape.id);
      }
      
      // Duplicate selected shape (Cmd/Ctrl + D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        const shapeToDuplicate = shapes.find(s => s.id === selectedId);
        if (shapeToDuplicate) {
          const newShape = {
            ...shapeToDuplicate,
            id: crypto.randomUUID(),
            x: shapeToDuplicate.x + 20,
            y: shapeToDuplicate.y + 20,
          };
          firestoreActions.addShape(newShape);
          actions.setSelectedId(newShape.id);
        }
      }
      
      // Delete selected shape
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        firestoreActions.deleteShape(selectedId);
      }
      
      // Arrow key movement (10px, or 1px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedId) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 10;
        const shape = shapes.find(s => s.id === selectedId);
        if (!shape) return;
        
        let updates = {};
        switch (e.key) {
          case 'ArrowUp':
            updates = { y: shape.y - step };
            break;
          case 'ArrowDown':
            updates = { y: shape.y + step };
            break;
          case 'ArrowLeft':
            updates = { x: shape.x - step };
            break;
          case 'ArrowRight':
            updates = { x: shape.x + step };
            break;
        }
        
        firestoreActions.updateShape(selectedId, updates);
      }
      
      // Escape to clear selection and tool
      if (e.key === 'Escape') {
        actions.clearSelection();
        actions.setCurrentTool(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, shapes, clipboard, actions, editingTextId, firestoreActions]);

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
        draggable={!currentTool} // Only draggable in select mode
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onDragMove={handleStageDrag}
        onMouseLeave={handlePointerLeave}
        onTouchEnd={handlePointerLeave}
      >
        {/* Grid background layer (optional) */}
        {showGrid && (
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
            
            const activeEdit = activeEdits[shape.id];
            const isBeingEdited = activeEdit && activeEdit.userId !== user?.uid;
            const recentEdit = recentEdits[shape.id];
            const showEditFlash = recentEdit && recentEdit.userId !== user?.uid;
            
            return (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedId}
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
                onChange={(newAttrs) => {
                  firestoreActions.updateShape(shape.id, newAttrs);
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
              />
            );
          })}
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
    </div>
  );
};

export default Canvas;

