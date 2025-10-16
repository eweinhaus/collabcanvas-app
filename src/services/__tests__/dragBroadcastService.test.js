import { publishDragPosition, clearDragPosition, subscribeToDragUpdates } from '../dragBroadcastService';
import { ref, set, remove, onValue, onDisconnect } from 'firebase/database';

// Mock firebase/database
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  onValue: jest.fn(),
  onDisconnect: jest.fn(() => ({
    remove: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock firebase service
jest.mock('../firebase', () => ({
  realtimeDB: {},
}));

describe('dragBroadcastService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('publishDragPosition', () => {
    it('should publish drag position to RTDB', async () => {
      set.mockResolvedValue(undefined);
      const mockRef = {};
      ref.mockReturnValue(mockRef);

      await publishDragPosition({
        boardId: 'test-board',
        shapeId: 'shape-1',
        x: 100,
        y: 200,
        userId: 'user-1',
      });

      expect(ref).toHaveBeenCalledWith({}, 'boards/test-board/activeEdits/shape-1');
      expect(set).toHaveBeenCalledWith(mockRef, expect.objectContaining({
        x: 100,
        y: 200,
        userId: 'user-1',
      }));
      expect(onDisconnect).toHaveBeenCalledWith(mockRef);
    });

    it('should return early if no shapeId or userId', async () => {
      await publishDragPosition({ shapeId: null, userId: 'user-1' });
      expect(set).not.toHaveBeenCalled();

      await publishDragPosition({ shapeId: 'shape-1', userId: null });
      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('clearDragPosition', () => {
    it('should remove shape from active edits', async () => {
      remove.mockResolvedValue(undefined);
      const mockRef = {};
      ref.mockReturnValue(mockRef);

      await clearDragPosition({ boardId: 'test-board', shapeId: 'shape-1' });

      expect(ref).toHaveBeenCalledWith({}, 'boards/test-board/activeEdits/shape-1');
      expect(remove).toHaveBeenCalledWith(mockRef);
    });

    it('should return early if no shapeId', async () => {
      await clearDragPosition({ shapeId: null });
      expect(remove).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToDragUpdates', () => {
    it('should subscribe to drag updates and filter by userId', () => {
      const mockUnsubscribe = jest.fn();
      onValue.mockReturnValue(mockUnsubscribe);
      const mockRef = {};
      ref.mockReturnValue(mockRef);

      const onUpdate = jest.fn();
      const unsubscribe = subscribeToDragUpdates({
        boardId: 'test-board',
        excludeUserId: 'user-1',
        onUpdate,
      });

      expect(ref).toHaveBeenCalledWith({}, 'boards/test-board/activeEdits');
      expect(onValue).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call onUpdate with filtered updates', () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ key: 'shape-1', val: () => ({ x: 100, y: 200, userId: 'user-2', timestamp: Date.now() }) });
          callback({ key: 'shape-2', val: () => ({ x: 150, y: 250, userId: 'user-1', timestamp: Date.now() }) });
        }),
      };

      let snapshotCallback;
      onValue.mockImplementation((ref, callback) => {
        snapshotCallback = callback;
        return jest.fn();
      });

      const onUpdate = jest.fn();
      subscribeToDragUpdates({
        boardId: 'test-board',
        excludeUserId: 'user-1',
        onUpdate,
      });

      snapshotCallback(mockSnapshot);

      expect(onUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          shapeId: 'shape-1',
          x: 100,
          y: 200,
          userId: 'user-2',
        }),
      ]);
    });
  });
});

