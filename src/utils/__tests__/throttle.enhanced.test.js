import { throttle } from '../throttle';

describe('Enhanced Throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('throttle limits calls and uses latest args', (done) => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 100);

    throttled('first');
    throttled('second');
    throttled('third');

    // Should not have called yet (schedules timeout)
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(100);

    // Should have called once with latest args
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third');

    done();
  });

  test('burst mode activates after threshold calls', (done) => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 100);

    // Make rapid calls to trigger burst mode
    throttled('call1');
    throttled('call2');
    throttled('call3'); // Should trigger burst mode

    // Should not have called yet
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward time slightly (less than normal delay)
    jest.advanceTimersByTime(30);

    // Make another call in burst mode - should use reduced delay
    throttled('call4');

    // Fast-forward to complete the burst call
    jest.advanceTimersByTime(30); // 30ms burst delay

    // Should have called once
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call4');

    done();
  });

  test('burst mode reduces delay appropriately', (done) => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 100);

    // Make rapid calls to trigger burst mode
    throttled('call1');
    throttled('call2');
    throttled('call3');
    throttled('call4');

    // Fast-forward time (30ms burst delay)
    jest.advanceTimersByTime(30);

    // Should have called due to burst mode
    expect(mockFn).toHaveBeenCalledTimes(1);

    done();
  });

  test('throttle flush calls pending function', (done) => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 100);

    throttled('test');

    // Should not have called yet
    expect(mockFn).not.toHaveBeenCalled();

    // Flush should call immediately
    throttled.flush();
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('test');

    done();
  });

  test('throttle cancel prevents execution', (done) => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 100);

    throttled('test');
    throttled.cancel();

    // Fast-forward time
    jest.advanceTimersByTime(100);

    // Should not have called due to cancel
    expect(mockFn).not.toHaveBeenCalled();

    done();
  });

  test('getStats returns performance metrics', () => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 100);

    // Make some calls
    throttled('call1');
    throttled('call2');
    throttled('call3');

    const stats = throttled.getStats();

    expect(stats).toHaveProperty('callCount');
    expect(stats).toHaveProperty('burstMode');
    expect(stats).toHaveProperty('lastInvokeTime');
    expect(stats).toHaveProperty('averageInterval');
    // callCount gets reset after invoke, so it should be 0 after the timeout
    expect(stats.callCount).toBe(0);
  });

  test('handles edge case with very rapid calls', (done) => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 10); // Very short delay

    // Make many rapid calls
    for (let i = 0; i < 20; i++) {
      throttled(`call${i}`);
    }

    // Should still throttle appropriately
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(10);

    // Should have called
    expect(mockFn).toHaveBeenCalled();

    done();
  });
});
