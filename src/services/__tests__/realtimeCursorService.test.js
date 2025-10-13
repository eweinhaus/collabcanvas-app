jest.mock('firebase/database', () => {
  const listeners = new Map();
  return {
    ref: jest.fn((db, path) => ({ db, path })),
    onValue: jest.fn((refObj, successCb, errorCb) => {
      listeners.set(refObj.path, { successCb, errorCb });
      return () => listeners.delete(refObj.path);
    }),
    set: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    onDisconnect: jest.fn(() => ({
      remove: jest.fn(() => Promise.resolve()),
      cancel: jest.fn(() => Promise.resolve()),
    })),
    serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
    __listeners: listeners,
  };
});

jest.mock('../../services/firebase', () => ({
  realtimeDB: { name: 'mock-db' },
}));

const database = require('firebase/database');

const {
  setCursorPosition,
  subscribeToCursors,
  removeCursor,
  registerDisconnectCleanup,
  __testables,
} = require('../realtimeCursorService');

describe('realtimeCursorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    database.__listeners.clear();
  });

  describe('setCursorPosition', () => {
    it('writes cursor data with defaults', async () => {
      await setCursorPosition({ uid: 'user-1', x: 10, y: 20 });

      expect(database.set).toHaveBeenCalledWith(
        { db: { name: 'mock-db' }, path: 'boards/default/cursors/user-1' },
        expect.objectContaining({ uid: 'user-1', x: 10, y: 20, scale: 1 })
      );
    });

    it('resolves immediately when uid missing', async () => {
      await expect(setCursorPosition({})).resolves.toBeUndefined();
      expect(database.set).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToCursors', () => {
    it('invokes callback with payload excluding current user', () => {
      const onUpdate = jest.fn();
      subscribeToCursors({ boardId: 'default', excludeUid: 'self', onUpdate });

      const listener = database.__listeners.get('boards/default/cursors');
      const snapshot = {
        forEach: (cb) => {
          cb({ key: 'self', val: () => ({ uid: 'self', x: 1 }) });
          cb({ key: 'other', val: () => ({ uid: 'other', x: 2 }) });
        },
      };

      listener.successCb(snapshot);

      expect(onUpdate).toHaveBeenCalledWith([{ uid: 'other', x: 2 }]);
    });

    it('returns unsubscribe function', () => {
      const unsubscribe = subscribeToCursors({});
      unsubscribe();
      expect(database.__listeners.size).toBe(0);
    });
  });

  describe('removeCursor', () => {
    it('removes cursor path when uid provided', async () => {
      await removeCursor({ uid: 'user-2', boardId: 'board-a' });

      expect(database.remove).toHaveBeenCalledWith(
        { db: { name: 'mock-db' }, path: 'boards/board-a/cursors/user-2' },
      );
    });

    it('no-ops when uid missing', async () => {
      await expect(removeCursor({})).resolves.toBeUndefined();
      expect(database.remove).not.toHaveBeenCalled();
    });
  });

  describe('registerDisconnectCleanup', () => {
    it('registers onDisconnect remove and returns cancel handler', () => {
      const cancel = registerDisconnectCleanup({ uid: 'user-3' });

      const disconnectInstance = database.onDisconnect.mock.results[0].value;
      expect(disconnectInstance.remove).toHaveBeenCalled();

      cancel();
      expect(disconnectInstance.cancel).toHaveBeenCalled();
    });

    it('returns noop when uid missing', () => {
      const cancel = registerDisconnectCleanup({});
      expect(typeof cancel).toBe('function');
      cancel();
      expect(database.onDisconnect).not.toHaveBeenCalled();
    });
  });

  describe('__testables', () => {
    it('exposes helpers for testing', () => {
      expect(__testables.cursorRef('abc')).toEqual({ db: { name: 'mock-db' }, path: 'boards/default/cursors/abc' });
      expect(__testables.cursorsRef('room')).toEqual({ db: { name: 'mock-db' }, path: 'boards/room/cursors' });
    });
  });
});


