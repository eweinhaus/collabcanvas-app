/**
 * useCanvasKeyboardShortcuts Hook
 * Handles all keyboard shortcuts for the canvas (undo/redo, copy/paste, delete, etc.)
 */

import { useEffect } from 'react';
import { 
  CreateShapeCommand, 
  DeleteShapeCommand, 
  MoveShapeCommand, 
  BatchCommand,
  BringToFrontCommand,
  SendToBackCommand,
  BringForwardCommand,
  SendBackwardCommand
} from '../utils/commands';
import {
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  distributeHorizontally,
  distributeVertically,
} from '../utils/alignment';

export const useCanvasKeyboardShortcuts = ({
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
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when editing text
      if (editingTextId) return;
      
      // Don't trigger shortcuts when user is typing in an input field
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.isContentEditable
      )) {
        return;
      }
      
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
        
        // If multiple shapes are being pasted, batch the commands
        if (clipboardArray.length > 1) {
          const batchCommand = new BatchCommand([], 'Paste multiple shapes');
          
          clipboardArray.forEach((shapeToPaste) => {
            const newShape = {
              ...shapeToPaste,
              id: crypto.randomUUID(),
              x: shapeToPaste.x + 20,
              y: shapeToPaste.y + 20,
            };
            const command = new CreateShapeCommand(newShape, firestoreActions, actions);
            batchCommand.addCommand(command);
            newIds.push(newShape.id);
          });
          
          // Execute the entire batch as one undo/redo operation
          if (!batchCommand.isEmpty()) {
            commandActions.executeCommand(batchCommand);
          }
        } else {
          // Single shape - no need for batch
          const shapeToPaste = clipboardArray[0];
          const newShape = {
            ...shapeToPaste,
            id: crypto.randomUUID(),
            x: shapeToPaste.x + 20,
            y: shapeToPaste.y + 20,
          };
          const command = new CreateShapeCommand(newShape, firestoreActions, actions);
          commandActions.executeCommand(command);
          newIds.push(newShape.id);
        }
        
        // Select all newly pasted shapes
        actions.setSelectedIds(newIds);
      }
      
      // Duplicate selected shapes (Cmd/Ctrl + D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedIds.length > 0) {
        e.preventDefault();
        const shapesToDuplicate = shapes.filter(s => selectedIds.includes(s.id));
        const newIds = [];
        
        // If multiple shapes are being duplicated, batch the commands
        if (shapesToDuplicate.length > 1) {
          const batchCommand = new BatchCommand([], 'Duplicate multiple shapes');
          
          shapesToDuplicate.forEach((shapeToDuplicate) => {
            const newShape = {
              ...shapeToDuplicate,
              id: crypto.randomUUID(),
              x: shapeToDuplicate.x + 20,
              y: shapeToDuplicate.y + 20,
            };
            const command = new CreateShapeCommand(newShape, firestoreActions, actions);
            batchCommand.addCommand(command);
            newIds.push(newShape.id);
          });
          
          // Execute the entire batch as one undo/redo operation
          if (!batchCommand.isEmpty()) {
            commandActions.executeCommand(batchCommand);
          }
        } else {
          // Single shape - no need for batch
          const shapeToDuplicate = shapesToDuplicate[0];
          const newShape = {
            ...shapeToDuplicate,
            id: crypto.randomUUID(),
            x: shapeToDuplicate.x + 20,
            y: shapeToDuplicate.y + 20,
          };
          const command = new CreateShapeCommand(newShape, firestoreActions, actions);
          commandActions.executeCommand(command);
          newIds.push(newShape.id);
        }
        
        // Select all newly duplicated shapes
        actions.setSelectedIds(newIds);
      }
      
      // Delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        
        // If multiple shapes are selected, batch the commands
        if (selectedIds.length > 1) {
          const batchCommand = new BatchCommand([], 'Multi-select delete');
          
          selectedIds.forEach(id => {
            const shape = shapes.find(s => s.id === id);
            if (shape) {
              const command = new DeleteShapeCommand(id, shape, firestoreActions);
              batchCommand.addCommand(command);
            }
          });
          
          // Execute the entire batch as one undo/redo operation
          if (!batchCommand.isEmpty()) {
            commandActions.executeCommand(batchCommand);
          }
        } else {
          // Single shape - no need for batch
          const id = selectedIds[0];
          const shape = shapes.find(s => s.id === id);
          if (shape) {
            const command = new DeleteShapeCommand(id, shape, firestoreActions);
            commandActions.executeCommand(command);
          }
        }
      }
      
      // Arrow key movement (5px normal, 20px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 5;
        
        // If multiple shapes are selected, batch the commands
        if (selectedIds.length > 1) {
          const batchCommand = new BatchCommand([], 'Multi-select arrow key movement');
          
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
            
            // Add command to batch
            const command = new MoveShapeCommand(
              shapeId,
              oldPosition,
              newPosition,
              firestoreActions
            );
            batchCommand.addCommand(command);
          });
          
          // Execute the entire batch as one undo/redo operation
          if (!batchCommand.isEmpty()) {
            commandActions.executeCommand(batchCommand);
          }
        } else {
          // Single shape - no need for batch
          const shapeId = selectedIds[0];
          const shape = shapes.find(s => s.id === shapeId);
          if (shape) {
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
          }
        }
      }
      
      // Z-index shortcuts
      if (selectedIds.length === 1) {
        const shapeId = selectedIds[0];
        
        // Bring to Front: Ctrl/Cmd + ]
        if ((e.metaKey || e.ctrlKey) && e.key === ']') {
          e.preventDefault();
          const command = new BringToFrontCommand(shapeId, shapes, firestoreActions);
          commandActions.executeCommand(command);
        }
        
        // Send to Back: Ctrl/Cmd + [
        if ((e.metaKey || e.ctrlKey) && e.key === '[') {
          e.preventDefault();
          const command = new SendToBackCommand(shapeId, shapes, firestoreActions);
          commandActions.executeCommand(command);
        }
        
        // Bring Forward: ]
        if (!(e.metaKey || e.ctrlKey) && e.key === ']') {
          e.preventDefault();
          const command = new BringForwardCommand(shapeId, shapes, firestoreActions);
          commandActions.executeCommand(command);
        }
        
        // Send Backward: [
        if (!(e.metaKey || e.ctrlKey) && e.key === '[') {
          e.preventDefault();
          const command = new SendBackwardCommand(shapeId, shapes, firestoreActions);
          commandActions.executeCommand(command);
        }
      }
      
      // Alignment shortcuts (require 2+ selected shapes)
      if (selectedIds.length >= 2) {
        const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
        
        // Align Left: Ctrl/Cmd + Shift + L
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
          e.preventDefault();
          const updates = alignLeft(selectedShapes);
          handleAlign(updates, 'left');
          return;
        }
        
        // Align Right: Ctrl/Cmd + Shift + R
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
          e.preventDefault();
          const updates = alignRight(selectedShapes);
          handleAlign(updates, 'right');
          return;
        }
        
        // Align Top: Ctrl/Cmd + Shift + T
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'T' || e.key === 't')) {
          e.preventDefault();
          const updates = alignTop(selectedShapes);
          handleAlign(updates, 'top');
          return;
        }
        
        // Align Bottom: Ctrl/Cmd + Shift + B
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
          e.preventDefault();
          const updates = alignBottom(selectedShapes);
          handleAlign(updates, 'bottom');
          return;
        }
        
        // Align Middle (vertical): Ctrl/Cmd + Shift + M
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
          e.preventDefault();
          const updates = alignMiddle(selectedShapes);
          handleAlign(updates, 'middle');
          return;
        }
        
        // Distribute Horizontally: Ctrl/Cmd + Shift + H (requires 3+ shapes)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'H' || e.key === 'h') && selectedIds.length >= 3) {
          e.preventDefault();
          const updates = distributeHorizontally(selectedShapes);
          handleAlign(updates, 'distribute-h');
          return;
        }
        
        // Distribute Vertically: Ctrl/Cmd + Shift + V (requires 3+ shapes)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'V' || e.key === 'v') && selectedIds.length >= 3) {
          e.preventDefault();
          const updates = distributeVertically(selectedShapes);
          handleAlign(updates, 'distribute-v');
          return;
        }
      }
      
      // H key to activate pan mode
      if ((e.key === 'H' || e.key === 'h') && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        actions.setCurrentTool('pan');
        actions.clearSelection();
        return;
      }
      
      // Escape to clear selection and tool
      if (e.key === 'Escape') {
        actions.clearSelection();
        actions.setCurrentTool(null);
        setContextMenu({ visible: false, x: 0, y: 0, shapeId: null });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
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
  ]);
};

