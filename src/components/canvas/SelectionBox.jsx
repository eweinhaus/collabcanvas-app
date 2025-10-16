/**
 * SelectionBox Component - Renders a selection rectangle for lasso selection
 * Displays a visual box when the user drags on the canvas
 */

import { Rect } from 'react-konva';

const SelectionBox = ({ x, y, width, height, visible }) => {
  if (!visible || width === 0 || height === 0) {
    return null;
  }

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 123, 255, 0.1)"
      stroke="#007bff"
      strokeWidth={2}
      dash={[5, 5]}
      listening={false}
    />
  );
};

export default SelectionBox;

