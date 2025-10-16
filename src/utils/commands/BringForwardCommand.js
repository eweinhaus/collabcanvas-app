/**
 * BringForwardCommand - Bring shape forward one level
 * Execute: Swap zIndex with next higher shape
 * Undo: Restore previous zIndex values for both shapes
 */

class BringForwardCommand {
  constructor(shapeId, shapes, firestoreActions) {
    this.shapeId = shapeId;
    this.firestoreActions = firestoreActions;
    
    // Sort shapes by zIndex to find next higher shape
    const sorted = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const currentIndex = sorted.findIndex(s => s.id === shapeId);
    
    if (currentIndex === -1 || currentIndex === sorted.length - 1) {
      // Already at front or not found
      this.canExecute = false;
      return;
    }
    
    this.canExecute = true;
    const currentShape = sorted[currentIndex];
    const nextShape = sorted[currentIndex + 1];
    
    // Store state for execute and undo
    this.currentShapeId = currentShape.id;
    this.nextShapeId = nextShape.id;
    this.currentPreviousZ = currentShape.zIndex ?? 0;
    this.nextPreviousZ = nextShape.zIndex ?? 0;
    this.currentNewZ = nextShape.zIndex ?? 0;
    this.nextNewZ = currentShape.zIndex ?? 0;
  }

  async execute() {
    if (!this.canExecute) {
      return; // Already at front
    }
    
    // Swap zIndex values using batch update
    await this.firestoreActions.batchUpdateZIndex([
      { id: this.currentShapeId, zIndex: this.currentNewZ },
      { id: this.nextShapeId, zIndex: this.nextNewZ },
    ]);
  }

  async undo() {
    if (!this.canExecute) {
      return;
    }
    
    // Restore previous zIndex values
    await this.firestoreActions.batchUpdateZIndex([
      { id: this.currentShapeId, zIndex: this.currentPreviousZ },
      { id: this.nextShapeId, zIndex: this.nextPreviousZ },
    ]);
  }
}

export default BringForwardCommand;

