import { renderHook, act } from '@testing-library/react';
import { CanvasProvider, useCanvas } from '../../context/CanvasContext';
import * as svc from '../../services/firestoreService';

jest.mock('../../services/firestoreService');
jest.mock('../../services/firebase', () => ({ auth: {}, firestore: {}, realtimeDB: {}, googleProvider: {} }));

const wrapper = ({ children }) => <CanvasProvider>{children}</CanvasProvider>;

describe('CanvasContext Firestore integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'Date').mockImplementation(() => ({ getTime: () => 1000 }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('initial load followed by subscription changes', async () => {
    const shapes = [{ id: '1', type: 'rect', x: 1, y: 2, updatedAt: 1 }];
    svc.getAllShapes.mockResolvedValueOnce(shapes);
    let onChange;
    svc.subscribeToShapes.mockImplementation(({ onChange: oc }) => { onChange = oc; return jest.fn(); });

    const { result } = renderHook(() => useCanvas(), { wrapper });

    // allow effects
    await act(async () => {});

    expect(result.current.state.shapes.length).toBe(1);

    // simulate server add
    act(() => onChange({ type: 'added', shape: { id: '2', type: 'circle', x: 0, y: 0, updatedAt: 2 } }));
    expect(result.current.state.shapes.find(s => s.id === '2')).toBeTruthy();

    // simulate remove
    act(() => onChange({ type: 'removed', shape: { id: '1' } }));
    expect(result.current.state.shapes.find(s => s.id === '1')).toBeFalsy();
  });
});


