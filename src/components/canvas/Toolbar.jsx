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
    { id: null, label: 'Select', iconPath: '/icons/cursor.svg', title: 'Select and move shapes (Esc)' },
    { id: SHAPE_TYPES.RECT, label: 'Rectangle', iconPath: '/icons/rectangle.svg', title: 'Draw rectangle' },
    { id: SHAPE_TYPES.CIRCLE, label: 'Circle', iconPath: '/icons/circle.svg', title: 'Draw circle' },
    { id: SHAPE_TYPES.TEXT, label: 'Text', iconPath: '/icons/text.svg', title: 'Add text' },
  ];

  const handleToolClick = (toolId) => {
    actions.setCurrentTool(toolId);
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="Drawing tools">
      <div className="toolbar-title">Tools</div>
      <div className="toolbar-buttons">
        {tools.map((tool) => (
          <button
            key={tool.id || 'select'}
            className={`toolbar-button ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolClick(tool.id)}
            title={tool.title}
            aria-label={tool.title}
            aria-pressed={currentTool === tool.id}
          >
            <img src={tool.iconPath} alt="" className="toolbar-icon" aria-hidden="true" />
            <span className="toolbar-label">{tool.label}</span>
          </button>
        ))}
      </div>
      <div className="toolbar-hint" aria-live="polite">
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

