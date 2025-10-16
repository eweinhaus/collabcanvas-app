import { performanceMonitor, usePerformanceMonitor } from '../performanceMonitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Create a fresh instance for each test to avoid shared state
    performanceMonitor.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('records edit events correctly', () => {
    performanceMonitor.recordEdit();
    performanceMonitor.recordEdit();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.editCount).toBe(2);
    expect(metrics.averageEditInterval).toBeGreaterThan(0);
  });

  test('tracks throttled calls', () => {
    performanceMonitor.recordThrottledCall();
    performanceMonitor.recordThrottledCall();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.throttledCalls).toBe(2);
  });

  test('tracks burst mode activations', () => {
    performanceMonitor.recordBurstMode();
    performanceMonitor.recordBurstMode();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.burstModeActivations).toBe(2);
  });

  test('calculates performance rating correctly', () => {
    // Record rapid edits to trigger excellent rating
    const now = Date.now();
    for (let i = 0; i < 15; i++) {
      performanceMonitor.recordEdit();
      jest.advanceTimersByTime(100); // 100ms between edits = 10 edits/sec
    }

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.performance).toBe('excellent');
  });

  test('calculates edits per second correctly', () => {
    // Record 10 edits over 1 second = 10 edits/sec
    for (let i = 0; i < 10; i++) {
      performanceMonitor.recordEdit();
      jest.advanceTimersByTime(100);
    }

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.currentEditsPerSecond).toBeCloseTo(10, 1);
  });

  test('provides recommendations based on metrics', () => {
    // Simulate high edit frequency with throttling
    for (let i = 0; i < 20; i++) {
      performanceMonitor.recordEdit();
      performanceMonitor.recordThrottledCall();
      jest.advanceTimersByTime(50);
    }

    const recommendations = performanceMonitor.getRecommendations();
    expect(Array.isArray(recommendations)).toBe(true);
  });

  test('resets metrics correctly', () => {
    performanceMonitor.recordEdit();
    performanceMonitor.recordThrottledCall();

    performanceMonitor.reset();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.editCount).toBe(0);
    expect(metrics.throttledCalls).toBe(0);
  });
});

describe('usePerformanceMonitor hook', () => {
  test('provides performance monitoring functions', () => {
    const { recordEdit, recordThrottledCall, recordBurstMode, getMetrics, reset } = usePerformanceMonitor();

    expect(typeof recordEdit).toBe('function');
    expect(typeof recordThrottledCall).toBe('function');
    expect(typeof recordBurstMode).toBe('function');
    expect(typeof getMetrics).toBe('function');
    expect(typeof reset).toBe('function');
  });

  test('functions call underlying monitor correctly', () => {
    const { recordEdit, recordThrottledCall, recordBurstMode } = usePerformanceMonitor();

    recordEdit();
    recordThrottledCall();
    recordBurstMode();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.editCount).toBe(1);
    expect(metrics.throttledCalls).toBe(1);
    expect(metrics.burstModeActivations).toBe(1);
  });
});
