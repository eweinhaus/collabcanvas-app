/**
 * MoveShapeCommand - Command for moving a shape
 * Execute: Updates shape position in Firestore
 * Undo: Restores previous position
 */

class MoveShapeCommand {
  constructor(shapeId, oldPosition, newPosition, firestoreActions) {
    this.shapeId = shapeId;
    this.oldPosition = { ...oldPosition }; // { x, y }
    this.newPosition = { ...newPosition }; // { x, y }
    this.firestoreActions = firestoreActions;
  }

  async execute() {
    // Update the shape with new position
    this.firestoreActions.updateShape(this.shapeId, this.newPosition);
  }

  async undo() {
    // Restore the old position
    this.firestoreActions.updateShape(this.shapeId, this.oldPosition);
  }
}

export default MoveShapeCommand;

