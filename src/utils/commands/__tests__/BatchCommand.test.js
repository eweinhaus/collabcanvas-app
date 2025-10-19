/**
 * Tests for BatchCommand
 */

import BatchCommand from '../BatchCommand';

describe('BatchCommand', () => {
  let mockCommand1;
  let mockCommand2;
  let mockCommand3;

  beforeEach(() => {
    mockCommand1 = {
      execute: jest.fn().mockResolvedValue(undefined),
      undo: jest.fn().mockResolvedValue(undefined),
    };
    mockCommand2 = {
      execute: jest.fn().mockResolvedValue(undefined),
      undo: jest.fn().mockResolvedValue(undefined),
    };
    mockCommand3 = {
      execute: jest.fn().mockResolvedValue(undefined),
      undo: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('constructor', () => {
    it('should create empty batch with no commands', () => {
      const batch = new BatchCommand();
      expect(batch.isEmpty()).toBe(true);
      expect(batch.size()).toBe(0);
    });

    it('should create batch with initial commands', () => {
      const batch = new BatchCommand([mockCommand1, mockCommand2]);
      expect(batch.isEmpty()).toBe(false);
      expect(batch.size()).toBe(2);
    });

    it('should store description', () => {
      const batch = new BatchCommand([], 'Test batch');
      expect(batch.description).toBe('Test batch');
    });
  });

  describe('addCommand', () => {
    it('should add command to batch', () => {
      const batch = new BatchCommand();
      expect(batch.size()).toBe(0);
      
      batch.addCommand(mockCommand1);
      expect(batch.size()).toBe(1);
      
      batch.addCommand(mockCommand2);
      expect(batch.size()).toBe(2);
    });
  });

  describe('execute', () => {
    it('should execute all commands in order', async () => {
      const batch = new BatchCommand([mockCommand1, mockCommand2, mockCommand3]);
      
      await batch.execute();
      
      expect(mockCommand1.execute).toHaveBeenCalled();
      expect(mockCommand2.execute).toHaveBeenCalled();
      expect(mockCommand3.execute).toHaveBeenCalled();
      
      // Verify order: command1 should be called before command2
      expect(mockCommand1.execute.mock.invocationCallOrder[0]).toBeLessThan(
        mockCommand2.execute.mock.invocationCallOrder[0]
      );
      expect(mockCommand2.execute.mock.invocationCallOrder[0]).toBeLessThan(
        mockCommand3.execute.mock.invocationCallOrder[0]
      );
    });

    it('should execute empty batch without error', async () => {
      const batch = new BatchCommand();
      await expect(batch.execute()).resolves.toBeUndefined();
    });

    it('should handle async execution', async () => {
      const asyncCommand = {
        execute: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 10))
        ),
        undo: jest.fn(),
      };
      
      const batch = new BatchCommand([asyncCommand]);
      await batch.execute();
      
      expect(asyncCommand.execute).toHaveBeenCalled();
    });
  });

  describe('undo', () => {
    it('should undo all commands in reverse order', async () => {
      const batch = new BatchCommand([mockCommand1, mockCommand2, mockCommand3]);
      
      await batch.undo();
      
      expect(mockCommand1.undo).toHaveBeenCalled();
      expect(mockCommand2.undo).toHaveBeenCalled();
      expect(mockCommand3.undo).toHaveBeenCalled();
      
      // Verify reverse order: command3 should be undone before command2
      expect(mockCommand3.undo.mock.invocationCallOrder[0]).toBeLessThan(
        mockCommand2.undo.mock.invocationCallOrder[0]
      );
      expect(mockCommand2.undo.mock.invocationCallOrder[0]).toBeLessThan(
        mockCommand1.undo.mock.invocationCallOrder[0]
      );
    });

    it('should undo empty batch without error', async () => {
      const batch = new BatchCommand();
      await expect(batch.undo()).resolves.toBeUndefined();
    });

    it('should handle async undo', async () => {
      const asyncCommand = {
        execute: jest.fn(),
        undo: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 10))
        ),
      };
      
      const batch = new BatchCommand([asyncCommand]);
      await batch.undo();
      
      expect(asyncCommand.undo).toHaveBeenCalled();
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty batch', () => {
      const batch = new BatchCommand();
      expect(batch.isEmpty()).toBe(true);
    });

    it('should return false for non-empty batch', () => {
      const batch = new BatchCommand([mockCommand1]);
      expect(batch.isEmpty()).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 for empty batch', () => {
      const batch = new BatchCommand();
      expect(batch.size()).toBe(0);
    });

    it('should return correct size', () => {
      const batch = new BatchCommand();
      expect(batch.size()).toBe(0);
      
      batch.addCommand(mockCommand1);
      expect(batch.size()).toBe(1);
      
      batch.addCommand(mockCommand2);
      expect(batch.size()).toBe(2);
      
      batch.addCommand(mockCommand3);
      expect(batch.size()).toBe(3);
    });
  });

  describe('Integration with CommandHistory', () => {
    it('should work as a single unit in undo/redo flow', async () => {
      // Simulate a multi-select operation
      const batch = new BatchCommand([], 'Multi-select transform');
      
      batch.addCommand(mockCommand1);
      batch.addCommand(mockCommand2);
      batch.addCommand(mockCommand3);
      
      // Execute (like a transform operation)
      await batch.execute();
      expect(mockCommand1.execute).toHaveBeenCalled();
      expect(mockCommand2.execute).toHaveBeenCalled();
      expect(mockCommand3.execute).toHaveBeenCalled();
      
      // Undo (single Cmd+Z should undo all)
      await batch.undo();
      expect(mockCommand1.undo).toHaveBeenCalled();
      expect(mockCommand2.undo).toHaveBeenCalled();
      expect(mockCommand3.undo).toHaveBeenCalled();
      
      // Redo (re-execute)
      await batch.execute();
      expect(mockCommand1.execute).toHaveBeenCalledTimes(2);
      expect(mockCommand2.execute).toHaveBeenCalledTimes(2);
      expect(mockCommand3.execute).toHaveBeenCalledTimes(2);
    });
  });
});

