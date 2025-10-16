/**
 * UpdateShapeCommand - Command for updating shape properties
 * Execute: Updates shape properties in Firestore
 * Undo: Restores previous properties
 */

class UpdateShapeCommand {
  constructor(shapeId, oldProperties, newProperties, firestoreActions) {
    this.shapeId = shapeId;
    // Filter out undefined values (Firestore doesn't accept them)
    this.oldProperties = this.filterUndefined({ ...oldProperties });
    this.newProperties = this.filterUndefined({ ...newProperties });
    this.firestoreActions = firestoreActions;
  }

  // Remove undefined values from an object
  filterUndefined(obj) {
    const filtered = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        filtered[key] = obj[key];
      }
    });
    return filtered;
  }

  async execute() {
    // Update the shape with new properties
    this.firestoreActions.updateShape(this.shapeId, this.newProperties);
  }

  async undo() {
    // Restore the old properties
    this.firestoreActions.updateShape(this.shapeId, this.oldProperties);
  }
}

export default UpdateShapeCommand;

