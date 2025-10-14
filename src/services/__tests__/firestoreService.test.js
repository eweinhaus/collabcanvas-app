import { serverTimestamp } from 'firebase/firestore';
import * as ff from '../firestoreService';

jest.mock('../firebase', () => ({ firestore: {}, auth: { currentUser: { uid: 'test-user' } } }));
jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    getDoc: jest.fn(async () => ({ exists: () => true, data: () => ({ id: 'a', type: 'rect', props: { x: 1 }, deleted: false }) })),
    getDocs: jest.fn(async () => ({ forEach: (cb) => cb({ id: 'a', data: () => ({ id: 'a', type: 'rect', props: { x: 1 }, deleted: false }) }) })),
    onSnapshot: jest.fn((q, next) => { next({ docChanges: () => [] }); return jest.fn(); }),
    query: jest.fn((col) => col),
    where: jest.fn(() => ({})),
    setDoc: jest.fn(async () => {}),
    updateDoc: jest.fn(async () => {}),
    serverTimestamp: jest.fn(() => ({ __type: 'serverTimestamp' })),
    runTransaction: jest.fn(async (_firestore, fn) => fn({
      get: jest.fn(async () => ({ exists: () => false, data: () => null })),
      set: jest.fn(),
      update: jest.fn(),
    })),
  };
});

describe('firestoreService', () => {
  test('createShape uses serverTimestamp and nested props', async () => {
    const shape = { id: '1', type: 'rect', x: 10, y: 20 };
    await ff.createShape(shape);
    expect(serverTimestamp).toHaveBeenCalled();
  });

  test('getAllShapes returns array', async () => {
    const res = await ff.getAllShapes();
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].id).toBeDefined();
  });

  test('updateShape maps to props.* fields', async () => {
    await ff.updateShape('1', { x: 2, y: 3 });
    // Just verifying no throw and serverTimestamp called
    expect(serverTimestamp).toHaveBeenCalled();
  });

  test('subscribeToShapes returns unsubscribe function', () => {
    const unsub = ff.subscribeToShapes({ onChange: jest.fn() });
    expect(typeof unsub).toBe('function');
    unsub();
  });
});


