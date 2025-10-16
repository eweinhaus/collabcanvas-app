/**
 * Debounce utility - delays function execution until after wait time has elapsed
 * since the last invocation
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function with cancel method
 */
export function debounce(func, wait) {
  let timeout;

  const debounced = function debounced(...args) {
    const context = this;
    
    clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };

  // Add cancel method
  debounced.cancel = function cancel() {
    clearTimeout(timeout);
  };

  // Add flush method (immediately execute pending invocation)
  debounced.flush = function flush() {
    clearTimeout(timeout);
  };

  return debounced;
}

