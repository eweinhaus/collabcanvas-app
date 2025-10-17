/**
 * AI Performance Testing Utilities
 * Add to window for easy browser console testing
 */

/**
 * Test AI response latency
 * Usage in browser console: window.testAILatency()
 */
export function setupPerformanceTesting() {
  if (typeof window !== 'undefined') {
    // Will be populated by AIContext
    window.testAILatency = async (message = "Create a red circle") => {
      console.log('Testing AI latency...');
      console.log('Command:', message);
      
      const start = performance.now();
      
      try {
        // This will be set by AIContext
        if (!window.__aiSendMessage) {
          console.error('❌ AI not ready. Make sure you are logged in and on the canvas page.');
          return;
        }
        
        await window.__aiSendMessage(message);
        
        const latency = performance.now() - start;
        console.log(`✅ Total latency: ${Math.round(latency)}ms`);
        
        return latency;
      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    };
    
    // Benchmark multiple requests
    window.benchmarkAI = async (trials = 10) => {
      console.log(`Running ${trials} trials...`);
      const latencies = [];
      
      for (let i = 0; i < trials; i++) {
        console.log(`Trial ${i + 1}/${trials}`);
        const latency = await window.testAILatency("Create a blue circle");
        if (latency) latencies.push(latency);
        
        // Wait 1s between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (latencies.length === 0) {
        console.error('No successful trials');
        return;
      }
      
      latencies.sort((a, b) => a - b);
      
      const p50 = latencies[Math.floor(latencies.length * 0.5)];
      const p95 = latencies[Math.floor(latencies.length * 0.95)];
      const p99 = latencies[Math.floor(latencies.length * 0.99)];
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      
      console.log('\n📊 Benchmark Results:');
      console.log(`  Average: ${Math.round(avg)}ms`);
      console.log(`  P50 (median): ${Math.round(p50)}ms`);
      console.log(`  P95: ${Math.round(p95)}ms`);
      console.log(`  P99: ${Math.round(p99)}ms`);
      console.log(`  Min: ${Math.round(latencies[0])}ms`);
      console.log(`  Max: ${Math.round(latencies[latencies.length - 1])}ms`);
      
      if (p95 < 2000) {
        console.log('✅ Target met: P95 < 2000ms');
      } else {
        console.log(`⚠️ Target not met: P95 is ${Math.round(p95)}ms (target: <2000ms)`);
      }
      
      return { avg, p50, p95, p99, latencies };
    };
    
    console.log('🧪 Performance testing loaded!');
    console.log('  Run: window.testAILatency("Create a red circle")');
    console.log('  Or:  window.benchmarkAI(10) for multiple trials');
  }
}

