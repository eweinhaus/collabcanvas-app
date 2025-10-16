/**
 * Toolbar Component - Tool selection UI for canvas
 * Allows users to select shape creation tools or select mode
 */

import { useState, useRef, useEffect } from 'react';
import { useCanvas, useCanvasActions } from '../../context/CanvasContext';
import { SHAPE_TYPES } from '../../utils/shapes';
import { exportCanvasToPNG, exportCanvasToSVG } from '../../utils/exportCanvas';
import './Toolbar.css';

const Toolbar = () => {
  const { state, stageRef, setIsExportingRef } = useCanvas();
  const actions = useCanvasActions();
  const { currentTool } = state;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportButtonRef = useRef(null);

  const tools = [
    { id: null, label: 'Select', iconPath: '/icons/cursor.svg', title: 'Select and move shapes (Esc)' },
    { id: SHAPE_TYPES.RECT, label: 'Rectangle', iconPath: '/icons/rectangle.svg', title: 'Draw rectangle' },
    { id: SHAPE_TYPES.CIRCLE, label: 'Circle', iconPath: '/icons/circle.svg', title: 'Draw circle' },
    { id: SHAPE_TYPES.TRIANGLE, label: 'Triangle', iconPath: '/icons/triangle.svg', title: 'Draw triangle' },
    { id: SHAPE_TYPES.TEXT, label: 'Text', iconPath: '/icons/text.svg', title: 'Add text' },
  ];

  const handleToolClick = (toolId) => {
    actions.setCurrentTool(toolId);
  };

  const handleExportClick = () => {
    setShowExportMenu(!showExportMenu);
  };

  const handleExportPNG = async () => {
    try {
      await exportCanvasToPNG(stageRef, undefined, {
        onBeforeExport: () => {
          // Hide UI elements (grid, transformer, selection box)
          if (setIsExportingRef.current) {
            setIsExportingRef.current(true);
          }
          actions.clearSelection();
        },
        onAfterExport: () => {
          // Restore UI elements
          if (setIsExportingRef.current) {
            setIsExportingRef.current(false);
          }
        }
      });
      setShowExportMenu(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to export PNG:', error);
      alert('Failed to export canvas as PNG');
      // Ensure export mode is cleared on error
      if (setIsExportingRef.current) {
        setIsExportingRef.current(false);
      }
    }
  };

  const handleExportSVG = async () => {
    try {
      await exportCanvasToSVG(stageRef, undefined, {
        onBeforeExport: () => {
          // Hide UI elements (grid, transformer, selection box)
          if (setIsExportingRef.current) {
            setIsExportingRef.current(true);
          }
          actions.clearSelection();
        },
        onAfterExport: () => {
          // Restore UI elements
          if (setIsExportingRef.current) {
            setIsExportingRef.current(false);
          }
        }
      });
      setShowExportMenu(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to export SVG:', error);
      alert('Failed to export canvas as SVG');
      // Ensure export mode is cleared on error
      if (setIsExportingRef.current) {
        setIsExportingRef.current(false);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

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
      
      {/* Export Section */}
      <div className="toolbar-divider" />
      <div className="toolbar-title">Export</div>
      <div className="toolbar-export" ref={exportButtonRef}>
        <button
          className="toolbar-button export-button"
          onClick={handleExportClick}
          title="Export canvas"
          aria-label="Export canvas"
          aria-expanded={showExportMenu}
        >
          <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="toolbar-label">Export</span>
        </button>
        
        {showExportMenu && (
          <div className="export-dropdown" role="menu">
            <button
              className="export-option"
              onClick={handleExportPNG}
              role="menuitem"
            >
              Export as PNG
            </button>
            <button
              className="export-option"
              onClick={handleExportSVG}
              role="menuitem"
            >
              Export as SVG
            </button>
          </div>
        )}
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

