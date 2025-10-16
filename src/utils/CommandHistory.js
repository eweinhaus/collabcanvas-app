/**
 * CommandHistory - Manages undo/redo stack for canvas operations
 * Implements the Command pattern for reversible actions
 */

class CommandHistory {
  constructor(maxSize = 100) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = maxSize;
  }

  /**
   * Execute a command and add it to the undo stack
   * @param {Object} command - Command object with execute() and undo() methods
   * @returns {Promise<void>}
   */
  async execute(command) {
    try {
      await command.execute();
      this.undoStack.push(command);
      this.redoStack = []; // Clear redo stack on new action
      this.trimStack();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[CommandHistory] Failed to execute command:', error);
      throw error;
    }
  }

  /**
   * Undo the last command
   * @returns {Promise<boolean>} - true if undo was successful
   */
  async undo() {
    if (this.undoStack.length === 0) {
      return false;
    }

    const command = this.undoStack.pop();
    try {
      await command.undo();
      this.redoStack.push(command);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[CommandHistory] Failed to undo command:', error);
      // Put command back on undo stack if undo failed
      this.undoStack.push(command);
      throw error;
    }
  }

  /**
   * Redo the last undone command
   * @returns {Promise<boolean>} - true if redo was successful
   */
  async redo() {
    if (this.redoStack.length === 0) {
      return false;
    }

    const command = this.redoStack.pop();
    try {
      await command.execute();
      this.undoStack.push(command);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[CommandHistory] Failed to redo command:', error);
      // Put command back on redo stack if redo failed
      this.redoStack.push(command);
      throw error;
    }
  }

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Trim the undo stack to maxSize to prevent memory leaks
   */
  trimStack() {
    if (this.undoStack.length > this.maxSize) {
      this.undoStack = this.undoStack.slice(-this.maxSize);
    }
  }

  /**
   * Get the size of the undo stack
   * @returns {number}
   */
  getUndoStackSize() {
    return this.undoStack.length;
  }

  /**
   * Get the size of the redo stack
   * @returns {number}
   */
  getRedoStackSize() {
    return this.redoStack.length;
  }
}

export default CommandHistory;

