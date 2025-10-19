/**
 * useShapeTransform Hook
 * Handles shape transformation (resize, rotate) logic with undo/redo support
 */

import { useCallback, useRef } from 'react';
import { UpdateShapeCommand, BatchCommand } from '../utils/commands';

export const useShapeTransform = ({ 
  selectedIds, 
  shapes, 
  transformerRef, 
  firestoreActions, 
  commandActions 
}) => {
  const transformStartStateRef = useRef({});

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

    // If multiple shapes are being transformed, batch the commands
    if (nodes.length > 1) {
      const batchCommand = new BatchCommand([], 'Multi-select transform');
      
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

        // Add command to batch
        const command = new UpdateShapeCommand(
          shapeId,
          oldState,
          newState,
          firestoreActions
        );
        batchCommand.addCommand(command);
      });

      // Execute the entire batch as one undo/redo operation
      if (!batchCommand.isEmpty()) {
        commandActions.executeCommand(batchCommand);
      }
    } else if (nodes.length === 1) {
      // Single shape - no need for batch
      const node = nodes[0];
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
    }

    transformStartStateRef.current = {};
  }, [shapes, firestoreActions, commandActions, transformerRef]);

  return {
    handleTransformStart,
    handleTransformEnd,
  };
};

