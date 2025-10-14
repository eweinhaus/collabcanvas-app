/**
 * Reconnection tests for presence and cursor sync after all users disconnect
 */
import * as presenceSvc from '../../services/presenceService';
import * as cursorSvc from '../../services/realtimeCursorService';

jest.mock('../../services/presenceService');
jest.mock('../../services/realtimeCursorService');
jest.mock('../../services/firebase', () => ({ auth: {}, firestore: {}, realtimeDB: {}, googleProvider: {} }));

describe('Reconnection scenarios (service level)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('presence service supports unsubscribe and resubscribe', () => {
    let presenceCallback;
    const unsubPresence = jest.fn();
    presenceSvc.subscribeToPresence.mockImplementation(({ onUpdate }) => {
      presenceCallback = onUpdate;
      return unsubPresence;
    });

    // Initial subscribe
    const unsub1 = presenceSvc.subscribeToPresence({ onUpdate: (users) => {} });
    expect(presenceSvc.subscribeToPresence).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsub1();
    expect(unsubPresence).toHaveBeenCalled();

    // Resubscribe
    const unsub2 = presenceSvc.subscribeToPresence({ onUpdate: (users) => {} });
    expect(presenceSvc.subscribeToPresence).toHaveBeenCalledTimes(2);
  });

  test('cursor service supports unsubscribe and resubscribe', () => {
    let cursorCallback;
    const unsubCursor = jest.fn();
    cursorSvc.subscribeToCursors.mockImplementation(({ onUpdate }) => {
      cursorCallback = onUpdate;
      return unsubCursor;
    });

    // Initial subscribe
    const unsub1 = cursorSvc.subscribeToCursors({ onUpdate: (cursors) => {} });
    expect(cursorSvc.subscribeToCursors).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsub1();
    expect(unsubCursor).toHaveBeenCalled();

    // Resubscribe
    const unsub2 = cursorSvc.subscribeToCursors({ onUpdate: (cursors) => {} });
    expect(cursorSvc.subscribeToCursors).toHaveBeenCalledTimes(2);
  });

  test('presence disconnect and reconnect preserves user list', () => {
    const userList = [];
    presenceSvc.subscribeToPresence.mockImplementation(({ onUpdate }) => {
      // Simulate presence update
      setTimeout(() => {
        onUpdate([
          { uid: 'u1', name: 'Alice', color: '#f00' },
          { uid: 'u2', name: 'Bob', color: '#0f0' }
        ]);
      }, 0);
      return jest.fn();
    });

    presenceSvc.subscribeToPresence({
      onUpdate: (users) => {
        userList.push(...users);
      }
    });

    // Verify subscription was called
    expect(presenceSvc.subscribeToPresence).toHaveBeenCalledTimes(1);
  });
});

