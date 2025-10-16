/**
 * Tests for Operation Queue
 */

import { enqueue, flush, hasPending, getStats, clearQueue, OP_TYPES, __testables } from '../operationQueue';
import * as firestoreService from '../../services/firestoreService';
import * as idbKeyval from 'idb-keyval';

// Mock dependencies
jest.mock('../../services/firebase', () => ({
  firestore: {},
  auth: { currentUser: null },
  realtimeDB: {},
}));
jest.mock('../../services/firestoreService');
jest.mock('../../services/realtimeCursorService');
jest.mock('../../services/presenceService');
jest.mock('idb-keyval');

describe('OperationQueue', () => {
  const mockBoardId = 'test-board';

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock IndexedDB operations
    idbKeyval.get.mockResolvedValue([]);
    idbKeyval.set.mockResolvedValue(undefined);
    idbKeyval.del.mockResolvedValue(undefined);
  });

  describe('enqueue', () => {
    it('should enqueue a new operation', async () => {
      const operation = {
        id: 'op-1',
        type: OP_TYPES.CREATE_SHAPE,
        payload: { shape: { id: 'shape-1', type: 'rect' }, boardId: mockBoardId },
      };

      const result = await enqueue(operation, mockBoardId);

      expect(result).toBe(true);
      expect(idbKeyval.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            ...operation,
            timestamp: expect.any(Number),
            attempts: 0,
            nextRetry: expect.any(Number),
          }),
        ])
      );
    });

    it('should update existing operation instead of creating duplicate', async () => {
      const existingOp = {
        id: 'op-1',
        type: OP_TYPES.CREATE_SHAPE,
        payload: { shape: { id: 'shape-1' } },
        timestamp: Date.now() - 1000,
        attempts: 0,
        nextRetry: Date.now(),
      };

      idbKeyval.get.mockResolvedValue([existingOp]);

      const updatedOp = {
        id: 'op-1',
        type: OP_TYPES.UPDATE_SHAPE,
        payload: { shapeId: 'shape-1', updates: { x: 100 } },
      };

      await enqueue(updatedOp, mockBoardId);

      const savedQueue = idbKeyval.set.mock.calls[0][1];
      expect(savedQueue).toHaveLength(1);
      expect(savedQueue[0].type).toBe(OP_TYPES.UPDATE_SHAPE);
    });
  });

  describe('flush', () => {
    it('should execute all pending operations', async () => {
      const operations = [
        {
          id: 'op-1',
          type: OP_TYPES.CREATE_SHAPE,
          payload: { shape: { id: 'shape-1', type: 'rect' }, boardId: mockBoardId },
          timestamp: Date.now(),
          attempts: 0,
          nextRetry: Date.now(),
        },
        {
          id: 'op-2',
          type: OP_TYPES.UPDATE_SHAPE,
          payload: { shapeId: 'shape-2', updates: { x: 100 }, boardId: mockBoardId },
          timestamp: Date.now(),
          attempts: 0,
          nextRetry: Date.now(),
        },
      ];

      idbKeyval.get.mockResolvedValue(operations);
      firestoreService.createShape.mockResolvedValue({ id: 'shape-1' });
      firestoreService.updateShape.mockResolvedValue({ id: 'shape-2' });

      const results = await flush(mockBoardId);

      expect(results.success).toBe(2);
      expect(results.failed).toBe(0);
      expect(results.retrying).toBe(0);
      expect(firestoreService.createShape).toHaveBeenCalledTimes(1);
      expect(firestoreService.updateShape).toHaveBeenCalledTimes(1);
    });

    it('should retry operations on retryable errors', async () => {
      const operation = {
        id: 'op-1',
        type: OP_TYPES.CREATE_SHAPE,
        payload: { shape: { id: 'shape-1' }, boardId: mockBoardId },
        timestamp: Date.now(),
        attempts: 0,
        nextRetry: Date.now(),
      };

      idbKeyval.get.mockResolvedValue([operation]);
      
      const retryableError = new Error('Network error');
      retryableError.code = 'unavailable';
      firestoreService.createShape.mockRejectedValue(retryableError);

      const results = await flush(mockBoardId);

      expect(results.success).toBe(0);
      expect(results.retrying).toBe(1);
      
      // Check that operation was re-queued with incremented attempts
      const savedQueue = idbKeyval.set.mock.calls[0][1];
      expect(savedQueue[0].attempts).toBe(1);
      expect(savedQueue[0].nextRetry).toBeGreaterThan(Date.now());
    });

    it('should drop operations after max retry attempts', async () => {
      const operation = {
        id: 'op-1',
        type: OP_TYPES.CREATE_SHAPE,
        payload: { shape: { id: 'shape-1' }, boardId: mockBoardId },
        timestamp: Date.now(),
        attempts: 5, // Max attempts reached
        nextRetry: Date.now(),
      };

      idbKeyval.get.mockResolvedValue([operation]);
      
      const retryableError = new Error('Network error');
      retryableError.code = 'unavailable';
      firestoreService.createShape.mockRejectedValue(retryableError);

      const results = await flush(mockBoardId);

      expect(results.success).toBe(0);
      expect(results.failed).toBe(1);
      expect(results.retrying).toBe(0);
    });

    it('should skip operations not ready for retry', async () => {
      const operation = {
        id: 'op-1',
        type: OP_TYPES.CREATE_SHAPE,
        payload: { shape: { id: 'shape-1' }, boardId: mockBoardId },
        timestamp: Date.now(),
        attempts: 1,
        nextRetry: Date.now() + 10000, // Not ready yet
      };

      idbKeyval.get.mockResolvedValue([operation]);

      const results = await flush(mockBoardId);

      expect(results.success).toBe(0);
      expect(results.retrying).toBe(1);
      expect(firestoreService.createShape).not.toHaveBeenCalled();
    });
  });

  describe('hasPending', () => {
    it('should return true when queue has operations', async () => {
      idbKeyval.get.mockResolvedValue([{ id: 'op-1' }]);
      const result = await hasPending(mockBoardId);
      expect(result).toBe(true);
    });

    it('should return false when queue is empty', async () => {
      idbKeyval.get.mockResolvedValue([]);
      const result = await hasPending(mockBoardId);
      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return queue statistics', async () => {
      const now = Date.now();
      const operations = [
        {
          id: 'op-1',
          type: OP_TYPES.CREATE_SHAPE,
          nextRetry: now - 1000, // Ready
        },
        {
          id: 'op-2',
          type: OP_TYPES.UPDATE_SHAPE,
          nextRetry: now + 5000, // Waiting
        },
        {
          id: 'op-3',
          type: OP_TYPES.CREATE_SHAPE,
          nextRetry: now - 500, // Ready
        },
      ];

      idbKeyval.get.mockResolvedValue(operations);

      const stats = await getStats(mockBoardId);

      expect(stats.total).toBe(3);
      expect(stats.readyForRetry).toBe(2);
      expect(stats.waitingRetry).toBe(1);
      expect(stats.byType[OP_TYPES.CREATE_SHAPE]).toBe(2);
      expect(stats.byType[OP_TYPES.UPDATE_SHAPE]).toBe(1);
    });
  });

  describe('clearQueue', () => {
    it('should clear the queue', async () => {
      const result = await clearQueue(mockBoardId);
      expect(result).toBe(true);
      expect(idbKeyval.del).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable Firebase errors', () => {
      const error = new Error('Service unavailable');
      error.code = 'firestore/unavailable';
      
      expect(__testables.isRetryableError(error)).toBe(true);
    });

    it('should identify retryable network errors', () => {
      const error = new Error('Failed to fetch');
      
      expect(__testables.isRetryableError(error)).toBe(true);
    });

    it('should not retry permission errors', () => {
      const error = new Error('Permission denied');
      error.code = 'firestore/permission-denied';
      
      expect(__testables.isRetryableError(error)).toBe(false);
    });
  });
});

