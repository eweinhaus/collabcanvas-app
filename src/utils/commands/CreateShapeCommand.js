/**
 * CreateShapeCommand - Command for creating a shape
 * Execute: Creates a shape in Firestore
 * Undo: Deletes the shape from Firestore
 */

class CreateShapeCommand {
  constructor(shapeData, firestoreActions, localActions) {
    this.shapeData = { ...shapeData }; // Deep copy to avoid reference issues
    this.shapeId = shapeData.id;
    this.firestoreActions = firestoreActions;
    this.localActions = localActions; // For optimistic updates
  }

  async execute() {
    // Add shape to Firestore (firestoreActions.addShape already handles optimistic update)
    await this.firestoreActions.addShape(this.shapeData);
  }

  async undo() {
    // Delete the shape from Firestore
    await this.firestoreActions.deleteShape(this.shapeId);
  }
}

export default CreateShapeCommand;

