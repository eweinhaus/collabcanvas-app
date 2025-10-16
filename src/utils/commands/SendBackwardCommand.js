/**
 * SendBackwardCommand - Send shape backward one level
 * Execute: Swap zIndex with next lower shape
 * Undo: Restore previous zIndex values for both shapes
 */

class SendBackwardCommand {
  constructor(shapeId, shapes, firestoreActions) {
    this.shapeId = shapeId;
    this.firestoreActions = firestoreActions;
    
    // Sort shapes by zIndex to find next lower shape
    const sorted = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const currentIndex = sorted.findIndex(s => s.id === shapeId);
    
    if (currentIndex === -1 || currentIndex === 0) {
      // Already at back or not found
      this.canExecute = false;
      return;
    }
    
    this.canExecute = true;
    const currentShape = sorted[currentIndex];
    const prevShape = sorted[currentIndex - 1];
    
    // Store state for execute and undo
    this.currentShapeId = currentShape.id;
    this.prevShapeId = prevShape.id;
    this.currentPreviousZ = currentShape.zIndex ?? 0;
    this.prevPreviousZ = prevShape.zIndex ?? 0;
    this.currentNewZ = prevShape.zIndex ?? 0;
    this.prevNewZ = currentShape.zIndex ?? 0;
  }

  async execute() {
    if (!this.canExecute) {
      return; // Already at back
    }
    
    // Swap zIndex values using batch update
    await this.firestoreActions.batchUpdateZIndex([
      { id: this.currentShapeId, zIndex: this.currentNewZ },
      { id: this.prevShapeId, zIndex: this.prevNewZ },
    ]);
  }

  async undo() {
    if (!this.canExecute) {
      return;
    }
    
    // Restore previous zIndex values
    await this.firestoreActions.batchUpdateZIndex([
      { id: this.currentShapeId, zIndex: this.currentPreviousZ },
      { id: this.prevShapeId, zIndex: this.prevPreviousZ },
    ]);
  }
}

export default SendBackwardCommand;

