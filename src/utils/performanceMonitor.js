/**
 * Performance monitoring utilities for tracking edit performance
 * Helps identify bottlenecks and optimize rapid edit scenarios
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      editCount: 0,
      totalEditTime: 0,
      throttledCalls: 0,
      burstModeActivations: 0,
      averageEditInterval: 0,
      maxEditInterval: 0,
      minEditInterval: Infinity,
    };
    this.editTimestamps = [];
    this.maxHistorySize = 100; // Keep last 100 edits for analysis
  }

  recordEdit() {
    const now = Date.now();
    this.editTimestamps.push(now);
    this.editCount++;

    // Maintain history size limit
    if (this.editTimestamps.length > this.maxHistorySize) {
      this.editTimestamps.shift();
    }

    this.updateMetrics();
  }

  recordThrottledCall() {
    this.throttledCalls++;
  }

  recordBurstMode() {
    this.burstModeActivations++;
  }

  updateMetrics() {
    if (this.editTimestamps.length < 2) return;

    const intervals = [];
    for (let i = 1; i < this.editTimestamps.length; i++) {
      intervals.push(this.editTimestamps[i] - this.editTimestamps[i - 1]);
    }

    this.metrics.averageEditInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    this.metrics.maxEditInterval = Math.max(...intervals);
    this.metrics.minEditInterval = Math.min(...intervals);

    // Calculate edits per second (last 10 seconds)
    const tenSecondsAgo = Date.now() - 10000;
    const recentEdits = this.editTimestamps.filter(ts => ts > tenSecondsAgo);
    this.metrics.editsPerSecond = recentEdits.length / 10;
  }

  getMetrics() {
    return {
      ...this.metrics,
      currentEditsPerSecond: this.metrics.editsPerSecond || 0,
      burstModeActive: this.burstModeActivations > 0,
      performance: this.getPerformanceRating(),
    };
  }

  getPerformanceRating() {
    const { averageEditInterval, editsPerSecond, throttledCalls } = this.metrics;

    if (editsPerSecond > 10) {
      return 'excellent'; // Handling rapid edits well
    } else if (editsPerSecond > 5) {
      return 'good'; // Good performance
    } else if (editsPerSecond > 2) {
      return 'fair'; // Acceptable but could be better
    } else {
      return 'poor'; // Needs improvement
    }
  }

  reset() {
    this.metrics = {
      editCount: 0,
      totalEditTime: 0,
      throttledCalls: 0,
      burstModeActivations: 0,
      averageEditInterval: 0,
      maxEditInterval: 0,
      minEditInterval: Infinity,
    };
    this.editTimestamps = [];
  }

  getRecommendations() {
    const { editsPerSecond, throttledCalls, averageEditInterval } = this.metrics;

    const recommendations = [];

    if (editsPerSecond > 10 && throttledCalls > this.editCount * 0.5) {
      recommendations.push('Consider increasing throttle delay for better performance');
    }

    if (averageEditInterval < 50 && throttledCalls < this.editCount * 0.1) {
      recommendations.push('Consider reducing throttle delay for better responsiveness');
    }

    if (editsPerSecond > 15) {
      recommendations.push('High edit frequency detected - monitor for performance issues');
    }

    return recommendations;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for components to record edits
export const usePerformanceMonitor = () => {
  const recordEdit = () => {
    performanceMonitor.recordEdit();
  };

  const recordThrottledCall = () => {
    performanceMonitor.recordThrottledCall();
  };

  const recordBurstMode = () => {
    performanceMonitor.recordBurstMode();
  };

  return {
    recordEdit,
    recordThrottledCall,
    recordBurstMode,
    getMetrics: () => performanceMonitor.getMetrics(),
    reset: () => performanceMonitor.reset(),
  };
};
