/**
 * CommandHistory Unit Tests
 */

import CommandHistory from '../CommandHistory';

describe('CommandHistory', () => {
  let commandHistory;
  let mockCommand;

  beforeEach(() => {
    commandHistory = new CommandHistory();
    mockCommand = {
      execute: jest.fn().mockResolvedValue(undefined),
      undo: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('execute', () => {
    it('should execute command and add to undo stack', async () => {
      await commandHistory.execute(mockCommand);
      
      expect(mockCommand.execute).toHaveBeenCalledTimes(1);
      expect(commandHistory.canUndo()).toBe(true);
      expect(commandHistory.canRedo()).toBe(false);
    });

    it('should clear redo stack on new command execution', async () => {
      const command1 = { ...mockCommand };
      const command2 = { ...mockCommand };
      const command3 = { ...mockCommand };

      await commandHistory.execute(command1);
      await commandHistory.execute(command2);
      await commandHistory.undo();
      
      expect(commandHistory.canRedo()).toBe(true);
      
      await commandHistory.execute(command3);
      
      expect(commandHistory.canRedo()).toBe(false);
    });

    it('should handle command execution errors', async () => {
      const failingCommand = {
        execute: jest.fn().mockRejectedValue(new Error('Execute failed')),
        undo: jest.fn(),
      };

      await expect(commandHistory.execute(failingCommand)).rejects.toThrow('Execute failed');
      expect(commandHistory.canUndo()).toBe(false);
    });
  });

  describe('undo', () => {
    it('should undo last command and move to redo stack', async () => {
      await commandHistory.execute(mockCommand);
      
      const result = await commandHistory.undo();
      
      expect(result).toBe(true);
      expect(mockCommand.undo).toHaveBeenCalledTimes(1);
      expect(commandHistory.canUndo()).toBe(false);
      expect(commandHistory.canRedo()).toBe(true);
    });

    it('should return false when undo stack is empty', async () => {
      const result = await commandHistory.undo();
      
      expect(result).toBe(false);
      expect(mockCommand.undo).not.toHaveBeenCalled();
    });

    it('should handle undo errors and keep command on stack', async () => {
      const failingCommand = {
        execute: jest.fn().mockResolvedValue(undefined),
        undo: jest.fn().mockRejectedValue(new Error('Undo failed')),
      };

      await commandHistory.execute(failingCommand);
      
      await expect(commandHistory.undo()).rejects.toThrow('Undo failed');
      expect(commandHistory.canUndo()).toBe(true);
    });
  });

  describe('redo', () => {
    it('should redo last undone command', async () => {
      await commandHistory.execute(mockCommand);
      await commandHistory.undo();
      
      const result = await commandHistory.redo();
      
      expect(result).toBe(true);
      expect(mockCommand.execute).toHaveBeenCalledTimes(2);
      expect(commandHistory.canUndo()).toBe(true);
      expect(commandHistory.canRedo()).toBe(false);
    });

    it('should return false when redo stack is empty', async () => {
      const result = await commandHistory.redo();
      
      expect(result).toBe(false);
    });

    it('should handle redo errors and keep command on redo stack', async () => {
      const failingCommand = {
        execute: jest.fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('Redo failed')),
        undo: jest.fn().mockResolvedValue(undefined),
      };

      await commandHistory.execute(failingCommand);
      await commandHistory.undo();
      
      await expect(commandHistory.redo()).rejects.toThrow('Redo failed');
      expect(commandHistory.canRedo()).toBe(true);
    });
  });

  describe('canUndo and canRedo', () => {
    it('should correctly report undo/redo availability', async () => {
      expect(commandHistory.canUndo()).toBe(false);
      expect(commandHistory.canRedo()).toBe(false);

      await commandHistory.execute(mockCommand);
      expect(commandHistory.canUndo()).toBe(true);
      expect(commandHistory.canRedo()).toBe(false);

      await commandHistory.undo();
      expect(commandHistory.canUndo()).toBe(false);
      expect(commandHistory.canRedo()).toBe(true);

      await commandHistory.redo();
      expect(commandHistory.canUndo()).toBe(true);
      expect(commandHistory.canRedo()).toBe(false);
    });
  });

  describe('stack size management', () => {
    it('should trim undo stack to maxSize', async () => {
      const smallHistory = new CommandHistory(5);

      for (let i = 0; i < 10; i++) {
        await smallHistory.execute({
          execute: jest.fn().mockResolvedValue(undefined),
          undo: jest.fn().mockResolvedValue(undefined),
        });
      }

      expect(smallHistory.getUndoStackSize()).toBe(5);
    });

    it('should maintain stack size under default maxSize (100)', async () => {
      for (let i = 0; i < 150; i++) {
        await commandHistory.execute({
          execute: jest.fn().mockResolvedValue(undefined),
          undo: jest.fn().mockResolvedValue(undefined),
        });
      }

      expect(commandHistory.getUndoStackSize()).toBe(100);
    });
  });

  describe('clear', () => {
    it('should clear both undo and redo stacks', async () => {
      await commandHistory.execute(mockCommand);
      await commandHistory.undo();

      commandHistory.clear();

      expect(commandHistory.canUndo()).toBe(false);
      expect(commandHistory.canRedo()).toBe(false);
      expect(commandHistory.getUndoStackSize()).toBe(0);
      expect(commandHistory.getRedoStackSize()).toBe(0);
    });
  });

  describe('integration test: multiple operations', () => {
    it('should handle complex sequence of undo/redo operations', async () => {
      const commands = [];
      for (let i = 0; i < 5; i++) {
        commands.push({
          execute: jest.fn().mockResolvedValue(undefined),
          undo: jest.fn().mockResolvedValue(undefined),
        });
      }

      // Execute 5 commands
      for (const cmd of commands) {
        await commandHistory.execute(cmd);
      }

      expect(commandHistory.getUndoStackSize()).toBe(5);
      expect(commands.every(cmd => cmd.execute.mock.calls.length === 1)).toBe(true);

      // Undo 3 commands
      await commandHistory.undo();
      await commandHistory.undo();
      await commandHistory.undo();

      expect(commandHistory.getUndoStackSize()).toBe(2);
      expect(commandHistory.getRedoStackSize()).toBe(3);
      expect(commands[4].undo).toHaveBeenCalled();
      expect(commands[3].undo).toHaveBeenCalled();
      expect(commands[2].undo).toHaveBeenCalled();

      // Redo 2 commands
      await commandHistory.redo();
      await commandHistory.redo();

      expect(commandHistory.getUndoStackSize()).toBe(4);
      expect(commandHistory.getRedoStackSize()).toBe(1);
      expect(commands[2].execute).toHaveBeenCalledTimes(2);
      expect(commands[3].execute).toHaveBeenCalledTimes(2);

      // Execute new command (should clear redo stack)
      const newCommand = {
        execute: jest.fn().mockResolvedValue(undefined),
        undo: jest.fn().mockResolvedValue(undefined),
      };
      await commandHistory.execute(newCommand);

      expect(commandHistory.getUndoStackSize()).toBe(5);
      expect(commandHistory.getRedoStackSize()).toBe(0);
    });
  });
});

