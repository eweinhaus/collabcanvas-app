/**
 * BatchCommand - Groups multiple commands to execute/undo as a single unit
 * Used for multi-select operations where changes to multiple shapes should be treated as one action
 */

class BatchCommand {
  /**
   * @param {Array<Object>} commands - Array of command objects with execute() and undo() methods
   * @param {string} description - Optional description of the batch operation
   */
  constructor(commands = [], description = 'Batch operation') {
    this.commands = commands;
    this.description = description;
  }

  /**
   * Add a command to the batch
   * @param {Object} command - Command object with execute() and undo() methods
   */
  addCommand(command) {
    this.commands.push(command);
  }

  /**
   * Execute all commands in the batch
   * @returns {Promise<void>}
   */
  async execute() {
    // Execute all commands in order
    for (const command of this.commands) {
      await command.execute();
    }
  }

  /**
   * Undo all commands in the batch (in reverse order)
   * @returns {Promise<void>}
   */
  async undo() {
    // Undo in reverse order (last command first)
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }

  /**
   * Check if batch is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.commands.length === 0;
  }

  /**
   * Get number of commands in batch
   * @returns {number}
   */
  size() {
    return this.commands.length;
  }
}

export default BatchCommand;

