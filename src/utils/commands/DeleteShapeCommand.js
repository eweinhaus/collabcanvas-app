/**
 * DeleteShapeCommand - Command for deleting a shape
 * Execute: Soft-deletes a shape in Firestore
 * Undo: Recreates the shape with same ID
 */

class DeleteShapeCommand {
  constructor(shapeId, shapeData, firestoreActions) {
    this.shapeId = shapeId;
    this.shapeData = { ...shapeData }; // Store complete shape data for undo
    this.firestoreActions = firestoreActions;
  }

  async execute() {
    // Delete the shape from Firestore
    await this.firestoreActions.deleteShape(this.shapeId);
  }

  async undo() {
    // Recreate the shape with the same ID and data
    await this.firestoreActions.addShape(this.shapeData);
  }
}

export default DeleteShapeCommand;

