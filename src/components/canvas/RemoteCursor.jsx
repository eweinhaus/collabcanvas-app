import { Group, Circle, Rect, Text } from 'react-konva';

const POINTER_RADIUS = 8;
const LABEL_PADDING_X = 6;
const LABEL_PADDING_Y = 4;

const RemoteCursor = ({ x, y, color, label }) => {
  const textWidthEstimate = label.length * 8;
  const labelWidth = textWidthEstimate + LABEL_PADDING_X * 2;
  const labelHeight = 18 + LABEL_PADDING_Y * 2;

  return (
    <Group x={x} y={y} listening={false}>
      {/* Cursor pointer circle */}
      <Circle
        radius={POINTER_RADIUS}
        fill={color}
        stroke="#ffffff"
        strokeWidth={2}
      />
      {/* Label above cursor */}
      <Group y={-labelHeight - POINTER_RADIUS - 4}>
        <Rect
          width={labelWidth}
          height={labelHeight}
          offsetX={labelWidth / 2}
          fill={color}
          cornerRadius={4}
          opacity={0.95}
        />
        <Text
          text={label}
          fill="#ffffff"
          fontStyle="bold"
          fontSize={12}
          align="center"
          width={labelWidth}
          height={labelHeight}
          offsetX={labelWidth / 2}
          padding={LABEL_PADDING_Y}
        />
      </Group>
    </Group>
  );
};

export default RemoteCursor;


