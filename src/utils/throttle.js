/**
 * Throttle utility that ensures a function is called at most once every delay ms.
 * It always uses the latest arguments and context. Provides cancel and flush.
 */

export function throttle(fn, delay = 100) {
  let lastInvokeTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  const invoke = () => {
    lastInvokeTime = Date.now();
    timeoutId = null;
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  };

  function throttled(...args) {
    lastArgs = args;
    lastThis = this; // eslint-disable-line @typescript-eslint/no-this-alias
    const now = Date.now();
    const remaining = delay - (now - lastInvokeTime);

    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      invoke();
    } else if (!timeoutId) {
      timeoutId = setTimeout(invoke, remaining);
    }
  }

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = lastThis = null;
  };

  throttled.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      invoke();
    }
  };

  return throttled;
}

export function debounce(fn, delay = 200) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this; // eslint-disable-line @typescript-eslint/no-this-alias
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
    }, delay);
  }

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = lastThis = null;
  };

  debounced.flush = () => {
    if (!timeoutId) return;
    clearTimeout(timeoutId);
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  };

  return debounced;
}

