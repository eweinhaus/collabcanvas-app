/**
 * Toolbar Component - Tool selection UI for canvas
 * Allows users to select shape creation tools or select mode
 */

import { useCanvas, useCanvasActions } from '../../context/CanvasContext';
import { SHAPE_TYPES } from '../../utils/shapes';
import './Toolbar.css';

const Toolbar = () => {
  const { state } = useCanvas();
  const actions = useCanvasActions();
  const { currentTool } = state;

  const tools = [
    { id: null, label: 'Select', icon: '⬛', title: 'Select and move shapes (Esc)' },
    { id: SHAPE_TYPES.RECT, label: 'Rectangle', icon: '▭', title: 'Draw rectangle' },
    { id: SHAPE_TYPES.CIRCLE, label: 'Circle', icon: '●', title: 'Draw circle' },
    { id: SHAPE_TYPES.TEXT, label: 'Text', icon: 'T', title: 'Add text' },
  ];

  const handleToolClick = (toolId) => {
    actions.setCurrentTool(toolId);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-title">Tools</div>
      <div className="toolbar-buttons">
        {tools.map((tool) => (
          <button
            key={tool.id || 'select'}
            className={`toolbar-button ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolClick(tool.id)}
            title={tool.title}
          >
            <span className="toolbar-icon">{tool.icon}</span>
            <span className="toolbar-label">{tool.label}</span>
          </button>
        ))}
      </div>
      <div className="toolbar-hint">
        {currentTool ? (
          <span>Click on canvas to add {currentTool}</span>
        ) : (
          <span>Select and drag shapes</span>
        )}
      </div>
    </div>
  );
};

export default Toolbar;

