/**
 * BringToFrontCommand - Bring shape to front (highest z-index)
 * Execute: Set zIndex to max + 1
 * Undo: Restore previous zIndex
 */

class BringToFrontCommand {
  constructor(shapeId, shapes, firestoreActions) {
    this.shapeId = shapeId;
    this.firestoreActions = firestoreActions;
    
    // Store previous state for undo
    const shape = shapes.find(s => s.id === shapeId);
    this.previousZIndex = shape?.zIndex ?? 0;
    
    // Calculate new zIndex (max + 1)
    const maxZ = Math.max(...shapes.map(s => s.zIndex ?? 0));
    this.newZIndex = maxZ + 1;
  }

  async execute() {
    await this.firestoreActions.updateZIndex(this.shapeId, this.newZIndex);
  }

  async undo() {
    await this.firestoreActions.updateZIndex(this.shapeId, this.previousZIndex);
  }
}

export default BringToFrontCommand;

