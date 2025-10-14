import { renderHook, act } from '@testing-library/react';
import { CanvasProvider, useCanvas } from '../../context/CanvasContext';
import * as svc from '../../services/firestoreService';

jest.mock('../../services/firestoreService');
jest.mock('../../services/firebase', () => ({ 
  auth: { 
    onAuthStateChanged: (callback) => {
      // Immediately call with a mock user to simulate authenticated state
      callback({ uid: 'test-user-123' });
      return jest.fn(); // Return unsubscribe function
    }
  }, 
  firestore: {}, 
  realtimeDB: {}, 
  googleProvider: {} 
}));

const wrapper = ({ children }) => <CanvasProvider>{children}</CanvasProvider>;

describe('Firestore edge cases', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('initial fetch happens before listener and loading flag toggles', async () => {
    const shapes = [{ id: 'a', type: 'rect', x: 1, y: 2, updatedAt: 1 }];
    svc.getAllShapes.mockResolvedValueOnce(shapes);
    let onChange;
    let onReady;
    svc.subscribeToShapes.mockImplementation(({ onChange: oc, onReady: or }) => { onChange = oc; onReady = or; return jest.fn(); });

    const { result } = renderHook(() => useCanvas(), { wrapper });

    // allow initial effect
    await act(async () => {});

    // after fetch
    expect(result.current.state.shapes.length).toBe(1);
    expect(result.current.state.loadingShapes).toBe(true);

    // first snapshot ready
    act(() => onReady());
    expect(result.current.state.loadingShapes).toBe(false);

    // simulate server add
    act(() => onChange({ type: 'added', shape: { id: 'b', type: 'circle', x: 0, y: 0, updatedAt: 2 } }));
    expect(result.current.state.shapes.find(s => s.id === 'b')).toBeTruthy();
  });

  test('prevents duplicate shapes on reconnect and respects last-write-wins', async () => {
    const initial = [{ id: 'a', type: 'rect', x: 1, y: 2, updatedAt: 10 }];
    svc.getAllShapes.mockResolvedValueOnce(initial);
    let onChange;
    let onReady;
    const unsub = jest.fn();
    svc.subscribeToShapes.mockImplementation(({ onChange: oc, onReady: or }) => { onChange = oc; onReady = or; return unsub; });

    const { result, unmount } = renderHook(() => useCanvas(), { wrapper });
    await act(async () => {});

    expect(result.current.state.shapes).toHaveLength(1);

    // Initial snapshot ready
    act(() => onReady());

    // Reconnect scenario: server sends 'added' for existing doc
    act(() => onChange({ type: 'added', shape: { id: 'a', type: 'rect', x: 1, y: 2, updatedAt: 10 } }));
    expect(result.current.state.shapes).toHaveLength(1);

    // Older update should be ignored
    act(() => onChange({ type: 'modified', shape: { id: 'a', type: 'rect', x: 5, y: 5, updatedAt: 5 } }));
    const s1 = result.current.state.shapes.find(s => s.id === 'a');
    expect(s1.x).toBe(1);
    expect(s1.y).toBe(2);

    // Newer update should win (beyond tolerance window)
    act(() => onChange({ type: 'modified', shape: { id: 'a', type: 'rect', x: 9, y: 9, updatedAt: 5000 } }));
    const s2 = result.current.state.shapes.find(s => s.id === 'a');
    expect(s2.x).toBe(9);
    expect(s2.y).toBe(9);

    // ensure unsubscribe is called on unmount
    unmount();
    expect(unsub).toHaveBeenCalled();
  });

  test('hydrates positions from session edit buffer on load', async () => {
    try { sessionStorage.setItem('editBuffer:a', JSON.stringify({ x: 42, y: 24 })); } catch (e) {}
    const initial = [{ id: 'a', type: 'rect', x: 1, y: 2, updatedAt: 10 }];
    svc.getAllShapes.mockResolvedValueOnce(initial);
    let onReady;
    svc.subscribeToShapes.mockImplementation(({ onReady: or }) => { onReady = or; return jest.fn(); });

    const { result } = renderHook(() => useCanvas(), { wrapper });
    await act(async () => {});
    act(() => onReady());

    const s = result.current.state.shapes.find(s => s.id === 'a');
    expect(s.x).toBe(42);
    expect(s.y).toBe(24);
  });

  test('handles concurrent updates via LWW (last write wins)', async () => {
    // Clear session storage to prevent hydration
    try { sessionStorage.clear(); } catch (e) {}
    
    // Test race condition: two rapid updates for same shape
    const initial = [{ id: 'concur', type: 'rect', x: 1, y: 1, updatedAt: 100 }];
    svc.getAllShapes.mockResolvedValueOnce(initial);
    let onChange, onReady;
    svc.subscribeToShapes.mockImplementation(({ onChange: oc, onReady: or }) => { onChange = oc; onReady = or; return jest.fn(); });

    const { result } = renderHook(() => useCanvas(), { wrapper });
    await act(async () => {});
    act(() => onReady());

    // Two concurrent updates: timestamp wins
    act(() => {
      onChange({ type: 'modified', shape: { id: 'concur', type: 'rect', x: 10, y: 10, updatedAt: 200 } });
      onChange({ type: 'modified', shape: { id: 'concur', type: 'rect', x: 20, y: 20, updatedAt: 300 } });
    });

    const s = result.current.state.shapes.find(s => s.id === 'concur');
    expect(s.x).toBe(20);
    expect(s.y).toBe(20);
    expect(s.updatedAt).toBe(300);
  });

  test('handles multiple clients editing same shape', async () => {
    // Clear session storage to prevent hydration
    try { sessionStorage.clear(); } catch (e) {}
    
    // Simulate multiple clients: updates arrive out of order
    const initial = [];
    svc.getAllShapes.mockResolvedValueOnce(initial);
    let onChange, onReady;
    svc.subscribeToShapes.mockImplementation(({ onChange: oc, onReady: or }) => { onChange = oc; onReady = or; return jest.fn(); });

    const { result } = renderHook(() => useCanvas(), { wrapper });
    await act(async () => {});
    act(() => onReady());

    // Client A adds shape at t=1000
    act(() => onChange({ type: 'added', shape: { id: 'multi', type: 'rect', x: 0, y: 0, updatedAt: 1000 } }));
    expect(result.current.state.shapes).toHaveLength(1);

    // Client B updates at t=1300, arrives first (>100ms tolerance from 1000)
    act(() => onChange({ type: 'modified', shape: { id: 'multi', type: 'rect', x: 5, y: 5, updatedAt: 1300 } }));

    // Client C updates at t=1150, arrives late (should be ignored as < 1300)
    act(() => onChange({ type: 'modified', shape: { id: 'multi', type: 'rect', x: 3, y: 3, updatedAt: 1150 } }));

    const s = result.current.state.shapes.find(s => s.id === 'multi');
    expect(s.x).toBe(5);
    expect(s.y).toBe(5);
    expect(s.updatedAt).toBe(1300);
  });
});


