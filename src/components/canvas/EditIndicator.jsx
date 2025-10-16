import React from 'react';
import { Group, Text, Circle } from 'react-konva';

/**
 * EditIndicator - Shows who last edited a shape
 * Displays a small badge in the bottom-right corner of shapes
 */
const EditIndicator = ({
  updatedByName,
  updatedAt,
  position = { x: 0, y: 0 },
  size = { width: 100, height: 50 }
}) => {
  // Don't show indicator if no edit info or if it's the current user
  if (!updatedByName || !updatedAt) {
    return null;
  }

  // Format timestamp for display
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'just now'; // Less than 1 minute
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`; // Less than 1 hour
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`; // Less than 1 day
    return `${Math.floor(diff / 86400000)}d ago`; // Days ago
  };

  // Get initials from name (first letter of first and last name, or first two letters)
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(updatedByName);
  const timeAgo = formatTimeAgo(updatedAt);

  // Position indicator in bottom-right corner with some padding
  const indicatorX = position.x + size.width - 25;
  const indicatorY = position.y + size.height - 15;

  return (
    <Group x={indicatorX} y={indicatorY}>
      {/* Background circle */}
      <Circle
        radius={12}
        fill="#f0f0f0"
        stroke="#ccc"
        strokeWidth={1}
        opacity={0.9}
      />

      {/* Initials text */}
      <Text
        text={initials}
        fontSize={10}
        fontStyle="bold"
        fill="#333"
        align="center"
        verticalAlign="middle"
        width={24}
        height={24}
        x={-12}
        y={-12}
        listening={false}
      />

      {/* Tooltip on hover - we'll handle this in parent component */}
    </Group>
  );
};

export default EditIndicator;
