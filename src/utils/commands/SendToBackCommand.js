/**
 * SendToBackCommand - Send shape to back (lowest z-index)
 * Execute: Set zIndex to min - 1
 * Undo: Restore previous zIndex
 */

class SendToBackCommand {
  constructor(shapeId, shapes, firestoreActions) {
    this.shapeId = shapeId;
    this.firestoreActions = firestoreActions;
    
    // Store previous state for undo
    const shape = shapes.find(s => s.id === shapeId);
    this.previousZIndex = shape?.zIndex ?? 0;
    
    // Calculate new zIndex (min - 1)
    const minZ = Math.min(...shapes.map(s => s.zIndex ?? 0));
    this.newZIndex = minZ - 1;
  }

  async execute() {
    await this.firestoreActions.updateZIndex(this.shapeId, this.newZIndex);
  }

  async undo() {
    await this.firestoreActions.updateZIndex(this.shapeId, this.previousZIndex);
  }
}

export default SendToBackCommand;

