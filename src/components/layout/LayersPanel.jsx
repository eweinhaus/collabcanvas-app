/**
 * LayersPanel - Sidebar panel for managing canvas layers
 * Displays all shapes sorted by z-index with drag-to-reorder functionality
 */

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCanvas } from '../../context/CanvasContext';
import { CANVAS_ACTIONS } from '../../context/CanvasContext';
import { normalizeZIndexes } from '../../utils/zIndex';
import LayerItem from './LayerItem';
import './LayersPanel.css';

const LayersPanel = ({ isOpen, onClose }) => {
  const { state, firestoreActions, dispatch } = useCanvas();
  const { shapes, selectedIds, selectedId, hiddenLayers } = state;

  // Setup drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort shapes by zIndex (descending - top layers first)
  const sortedShapes = useMemo(() => {
    return [...shapes].sort((a, b) => {
      const zIndexA = a.zIndex ?? 0;
      const zIndexB = b.zIndex ?? 0;
      return zIndexB - zIndexA; // Descending order
    });
  }, [shapes]);

  // Get the selected shape ID (support both single and multi-select)
  const currentSelectedId = useMemo(() => {
    if (selectedIds && selectedIds.length > 0) {
      return selectedIds[0];
    }
    return selectedId;
  }, [selectedIds, selectedId]);

  const handleLayerClick = (shapeId) => {
    dispatch({ type: 'SET_SELECTED_ID', payload: shapeId });
  };

  const handleVisibilityToggle = (shapeId) => {
    dispatch({ type: CANVAS_ACTIONS.TOGGLE_LAYER_VISIBILITY, payload: shapeId });
  };

  const handleDuplicate = (shapeId) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;

    // Create a duplicate with offset position
    const duplicate = {
      ...shape,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: shape.x + 20,
      y: shape.y + 20,
      zIndex: (shape.zIndex ?? 0) + 1,
    };

    firestoreActions.addShape(duplicate);
  };

  const handleDelete = (shapeId) => {
    if (window.confirm('Are you sure you want to delete this layer?')) {
      firestoreActions.deleteShape(shapeId);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedShapes.findIndex(shape => shape.id === active.id);
    const newIndex = sortedShapes.findIndex(shape => shape.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder the shapes array
    const reorderedShapes = arrayMove(sortedShapes, oldIndex, newIndex);

    // Calculate new z-indexes (normalized sequential values)
    // Since sortedShapes is in descending order (top to bottom),
    // we need to reverse the index calculation
    const updates = reorderedShapes.map((shape, index) => ({
      id: shape.id,
      zIndex: reorderedShapes.length - index, // Higher number = higher in z-order
    }));

    // Batch update all affected shapes
    firestoreActions.batchUpdateZIndex(updates);
  };

  if (!isOpen) return null;

  return (
    <div className="layers-panel" role="complementary" aria-label="Layers Panel">
      <div className="layers-panel__header">
        <h3 className="layers-panel__title">Layers</h3>
        <button
          className="layers-panel__close"
          onClick={onClose}
          aria-label="Close layers panel"
        >
          ✕
        </button>
      </div>

      <div className="layers-panel__content">
        {sortedShapes.length === 0 ? (
          <div className="layers-panel__empty">
            <p>No layers yet</p>
            <p className="layers-panel__hint">Create shapes to see them here</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedShapes.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="layers-panel__list">
                {sortedShapes.map((shape, index) => (
                  <LayerItem
                    key={shape.id}
                    shape={shape}
                    index={index}
                    isSelected={shape.id === currentSelectedId}
                    isVisible={!hiddenLayers.has(shape.id)}
                    onClick={() => handleLayerClick(shape.id)}
                    onVisibilityToggle={() => handleVisibilityToggle(shape.id)}
                    onDuplicate={() => handleDuplicate(shape.id)}
                    onDelete={() => handleDelete(shape.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default LayersPanel;

