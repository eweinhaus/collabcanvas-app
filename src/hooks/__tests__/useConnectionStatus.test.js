/**
 * Tests for useConnectionStatus hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useConnectionStatus, CONNECTION_STATUS } from '../useConnectionStatus';
import * as firebaseDatabase from 'firebase/database';
import * as operationQueue from '../../offline/operationQueue';

jest.mock('firebase/database');
jest.mock('../../offline/operationQueue');
jest.mock('../../services/firebase', () => ({
  realtimeDB: {},
}));

describe('useConnectionStatus', () => {
  const mockBoardId = 'test-board';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Mock operation queue
    operationQueue.hasPending.mockResolvedValue(false);
    operationQueue.getStats.mockResolvedValue({
      total: 0,
      readyForRetry: 0,
      waitingRetry: 0,
      byType: {},
    });

    // Mock Firebase onValue
    firebaseDatabase.onValue.mockImplementation((ref, callback) => {
      // Immediately call with connected = true
      callback({ val: () => true });
      return jest.fn(); // Unsubscribe function
    });

    firebaseDatabase.ref.mockReturnValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return CONNECTED status when online and Firebase connected', async () => {
    const { result } = renderHook(() => useConnectionStatus(mockBoardId));

    await waitFor(() => {
      expect(result.current.status).toBe(CONNECTION_STATUS.CONNECTED);
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isFirebaseConnected).toBe(true);
    expect(result.current.pendingOps).toBe(0);
  });

  it('should return OFFLINE status when navigator is offline', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useConnectionStatus(mockBoardId));

    await waitFor(() => {
      expect(result.current.status).toBe(CONNECTION_STATUS.OFFLINE);
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should return RECONNECTING when online but Firebase disconnected', async () => {
    firebaseDatabase.onValue.mockImplementation((ref, callback) => {
      // Firebase not connected
      callback({ val: () => false });
      return jest.fn();
    });

    const { result } = renderHook(() => useConnectionStatus(mockBoardId));

    await waitFor(() => {
      expect(result.current.status).toBe(CONNECTION_STATUS.RECONNECTING);
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isFirebaseConnected).toBe(false);
  });

  it('should return SYNCING when connected but has pending operations', async () => {
    operationQueue.hasPending.mockResolvedValue(true);
    operationQueue.getStats.mockResolvedValue({
      total: 5,
      readyForRetry: 3,
      waitingRetry: 2,
      byType: { createShape: 3, updateShape: 2 },
    });

    const { result } = renderHook(() => useConnectionStatus(mockBoardId));

    await waitFor(() => {
      expect(result.current.status).toBe(CONNECTION_STATUS.SYNCING);
    });

    expect(result.current.pendingOps).toBe(5);
    expect(result.current.queueStats.total).toBe(5);
  });

  it('should update status when network goes offline', async () => {
    const { result, rerender } = renderHook(() => useConnectionStatus(mockBoardId));

    await waitFor(() => {
      expect(result.current.status).toBe(CONNECTION_STATUS.CONNECTED);
    });

    // Simulate going offline
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    // Trigger offline event
    window.dispatchEvent(new Event('offline'));
    rerender();

    await waitFor(() => {
      expect(result.current.status).toBe(CONNECTION_STATUS.OFFLINE);
    });
  });

  it('should update status when network comes online', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result, rerender } = renderHook(() => useConnectionStatus(mockBoardId));

    await waitFor(() => {
      expect(result.current.status).toBe(CONNECTION_STATUS.OFFLINE);
    });

    // Simulate coming online
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Trigger online event
    window.dispatchEvent(new Event('online'));
    rerender();

    await waitFor(() => {
      expect(result.current.status).not.toBe(CONNECTION_STATUS.OFFLINE);
    });
  });

  it('should poll operation queue periodically', async () => {
    renderHook(() => useConnectionStatus(mockBoardId));

    // Initial call
    await waitFor(() => {
      expect(operationQueue.getStats).toHaveBeenCalled();
    });

    const initialCallCount = operationQueue.getStats.mock.calls.length;

    // Wait for polling interval (2 seconds)
    await waitFor(
      () => {
        expect(operationQueue.getStats).toHaveBeenCalledTimes(initialCallCount + 1);
      },
      { timeout: 3000 }
    );
  });
});

