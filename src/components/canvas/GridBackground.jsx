/**
 * GridBackground Component - Optional grid background for canvas
 * Renders a lightweight grid pattern
 */

import { Line } from 'react-konva';

const GridBackground = ({ width, height, offsetX = 0, offsetY = 0, gridSize = 50, strokeColor = '#ddd' }) => {
  const lines = [];

  // Calculate grid bounds with some padding
  const startX = Math.floor(offsetX / gridSize) * gridSize;
  const endX = offsetX + width;
  const startY = Math.floor(offsetY / gridSize) * gridSize;
  const endY = offsetY + height;

  // Vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, offsetY, x, endY]}
        stroke={strokeColor}
        strokeWidth={1}
      />
    );
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[offsetX, y, endX, y]}
        stroke={strokeColor}
        strokeWidth={1}
      />
    );
  }

  return <>{lines}</>;
};

export default GridBackground;

