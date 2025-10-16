/**
 * ShapeTooltip - Shows attribution info on hover
 */

import { Label, Tag, Text } from 'react-konva';
import { getUserDisplayName } from '../../utils/getUserColor';

const ShapeTooltip = ({ shape, x, y, onlineUsers = [] }) => {
  if (!shape.createdBy) return null;

  // Use stored name first, fallback to onlineUsers lookup for real-time updates
  const creatorName = shape.createdByName || getUserDisplayName(shape.createdBy, onlineUsers);
  const editorName = shape.updatedBy !== shape.createdBy 
    ? (shape.updatedByName || getUserDisplayName(shape.updatedBy, onlineUsers))
    : null;
  
  // Calculate time ago for last edit
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'unknown';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const timeAgo = getTimeAgo(shape.updatedAt);

  // Build tooltip text
  let tooltipText = `Created by ${creatorName}`;
  if (editorName) {
    tooltipText += `\nEdited ${timeAgo} by ${editorName}`;
  } else {
    tooltipText += `\nCreated ${timeAgo}`;
  }

  return (
    <Label x={x} y={y - 10} opacity={0.9} listening={false}>
      <Tag
        fill="#333"
        pointerDirection="down"
        pointerWidth={8}
        pointerHeight={6}
        lineJoin="round"
        shadowColor="black"
        shadowBlur={5}
        shadowOpacity={0.3}
        shadowOffsetX={2}
        shadowOffsetY={2}
      />
      <Text
        text={tooltipText}
        fontSize={12}
        padding={8}
        fill="white"
        fontFamily="Arial"
      />
    </Label>
  );
};

export default ShapeTooltip;

