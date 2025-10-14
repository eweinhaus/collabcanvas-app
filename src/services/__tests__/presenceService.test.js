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
  setPresence,
  subscribeToPresence,
  removePresence,
  registerDisconnectCleanup,
  __testables,
} = require('../presenceService');

describe('presenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    database.__listeners.clear();
  });

  it('writes presence data with defaults', async () => {
    await setPresence({ uid: 'u1', name: 'User One', color: '#abc' });
    expect(database.set).toHaveBeenCalledWith(
      { db: { name: 'mock-db' }, path: 'boards/default/presence/u1' },
      expect.objectContaining({ uid: 'u1', name: 'User One', color: '#abc', status: 'online' })
    );
  });

  it('subscribeToPresence filters out exclude uid and returns unsubscribe', () => {
    const onUpdate = jest.fn();
    const unsubscribe = subscribeToPresence({ boardId: 'default', excludeUid: 'self', onUpdate });
    const listener = database.__listeners.get('boards/default/presence');

    const snapshot = {
      forEach: (cb) => {
        cb({ key: 'self', val: () => ({ uid: 'self', name: 'Me' }) });
        cb({ key: 'other', val: () => ({ uid: 'other', name: 'You' }) });
      },
    };
    listener.successCb(snapshot);

    expect(onUpdate).toHaveBeenCalledWith([{ uid: 'other', name: 'You' }]);
    unsubscribe();
    expect(database.__listeners.size).toBe(0);
  });

  it('removePresence removes path', async () => {
    await removePresence({ uid: 'u2', boardId: 'room' });
    expect(database.remove).toHaveBeenCalledWith(
      { db: { name: 'mock-db' }, path: 'boards/room/presence/u2' }
    );
  });

  it('registerDisconnectCleanup sets remove and returns cancel', () => {
    const cancel = registerDisconnectCleanup({ uid: 'u3' });
    const disconnectInstance = database.onDisconnect.mock.results[0].value;
    expect(disconnectInstance.remove).toHaveBeenCalled();
    cancel();
    expect(disconnectInstance.cancel).toHaveBeenCalled();
  });

  it('exposes test helpers', () => {
    expect(__testables.presenceRef('abc')).toEqual({ db: { name: 'mock-db' }, path: 'boards/default/presence/abc' });
    expect(__testables.presencesRef('room')).toEqual({ db: { name: 'mock-db' }, path: 'boards/room/presence' });
  });
});


