import React from 'react';
import { Group, Circle, Path } from 'react-konva';

/**
 * LockIndicator - Shows when a shape is locked by another user
 * Displays a lock icon in the top-right corner of shapes
 */
const LockIndicator = ({
  lockedByName,
  lockedAt,
  position = { x: 0, y: 0 },
  size = { width: 100, height: 50 }
}) => {
  // Don't show indicator if not locked
  if (!lockedByName || !lockedAt) {
    return null;
  }

  // Format timestamp for tooltip
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'locked just now'; // Less than 1 minute
    if (diff < 3600000) return `locked ${Math.floor(diff / 60000)}m ago`; // Less than 1 hour
    if (diff < 86400000) return `locked ${Math.floor(diff / 3600000)}h ago`; // Less than 1 day
    return `locked ${Math.floor(diff / 86400000)}d ago`; // Days ago
  };

  // Position indicator in top-right corner
  const indicatorX = position.x + size.width - 20;
  const indicatorY = position.y + 5;

  // Lock icon as SVG path (padlock shape)
  const lockPath = `
    M 12 8
    C 10.9 8 10 8.9 10 10
    V 16
    H 6
    C 4.9 16 4 16.9 4 18
    V 28
    C 4 29.1 4.9 30 6 30
    H 18
    C 19.1 30 20 29.1 20 28
    V 18
    C 20 16.9 19.1 16 18 16
    H 14
    V 10
    C 14 8.9 13.1 8 12 8
    Z
  `;

  return (
    <Group x={indicatorX} y={indicatorY}>
      {/* Lock body */}
      <Circle
        radius={10}
        fill="#ff4444"
        stroke="#cc0000"
        strokeWidth={1}
        opacity={0.9}
      />

      {/* Lock icon */}
      <Path
        data={lockPath}
        fill="#ffffff"
        x={-6}
        y={-6}
        scale={{ x: 0.8, y: 0.8 }}
        listening={false}
      />

      {/* Tooltip on hover would be handled by parent component */}
    </Group>
  );
};

export default LockIndicator;
