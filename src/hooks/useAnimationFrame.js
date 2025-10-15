import { useEffect, useRef } from 'react';

/**
 * Custom hook that runs a callback on every animation frame
 * @param {Function} callback - Function to call each frame, receives deltaTime in ms
 * @param {boolean} enabled - Whether the animation loop is active
 */
export function useAnimationFrame(callback, enabled = true) {
  const requestRef = useRef();
  const previousTimeRef = useRef();

  useEffect(() => {
    if (!enabled) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      return undefined;
    }

    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime, time);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, enabled]);
}

