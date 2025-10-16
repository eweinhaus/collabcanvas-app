/**
 * Wrapper around RemoteCursor that interpolates position for smooth 60fps rendering
 */
import { useState, useRef, useCallback } from 'react';
import RemoteCursor from './RemoteCursor';
import { useAnimationFrame } from '../../hooks/useAnimationFrame';
import { interpolatePosition, isTeleport } from '../../utils/interpolate';

const CURSOR_THROTTLE_MS = Number(import.meta.env.VITE_CURSOR_THROTTLE_MS) || 35;

const InterpolatedRemoteCursor = ({ x, y, color, label }) => {
  const [visualPos, setVisualPos] = useState({ x, y });
  const prevServerPosRef = useRef({ x, y });
  const lastServerPosRef = useRef({ x, y });
  const transitionStartTimeRef = useRef(performance.now());

  // Update server positions when props change
  const serverPosChanged = useRef(false);
  if (x !== lastServerPosRef.current.x || y !== lastServerPosRef.current.y) {
    const newPos = { x, y };
    
    // Check for teleport (large jump) - don't interpolate, just snap
    if (isTeleport(lastServerPosRef.current, newPos)) {
      prevServerPosRef.current = newPos;
      lastServerPosRef.current = newPos;
      setVisualPos(newPos);
      transitionStartTimeRef.current = performance.now();
    } else {
      prevServerPosRef.current = lastServerPosRef.current;
      lastServerPosRef.current = newPos;
      transitionStartTimeRef.current = performance.now();
      serverPosChanged.current = true;
    }
  }

  // Animation frame callback for interpolation
  const animate = useCallback((deltaTime, currentTime) => {
    const elapsed = currentTime - transitionStartTimeRef.current;
    const alpha = Math.min(1, elapsed / CURSOR_THROTTLE_MS);

    const interpolated = interpolatePosition(
      prevServerPosRef.current,
      lastServerPosRef.current,
      alpha
    );

    setVisualPos(interpolated);
  }, []);

  // Run animation loop
  useAnimationFrame(animate, true);

  return <RemoteCursor x={visualPos.x} y={visualPos.y} color={color} label={label} />;
};

export default InterpolatedRemoteCursor;

