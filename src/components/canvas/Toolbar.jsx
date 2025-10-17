/**
 * Toolbar Component - Tool selection UI for canvas
 * Allows users to select shape creation tools or select mode
 */

import { useState, useRef, useEffect } from 'react';
import { useCanvas, useCanvasActions } from '../../context/CanvasContext';
import { useAI } from '../../context/AIContext';
import { SHAPE_TYPES } from '../../utils/shapes';
import { exportCanvasToPNG, exportCanvasToSVG } from '../../utils/exportCanvas';
import './Toolbar.css';

const Toolbar = ({ onToggleLayers, layersPanelOpen }) => {
  const { state, stageRef, setIsExportingRef } = useCanvas();
  const actions = useCanvasActions();
  const { panelOpen: aiPanelOpen, togglePanel: toggleAIPanel } = useAI();
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
      
      {/* Actions Section */}
      <div className="toolbar-divider" />
      <div className="toolbar-title">Actions</div>
      <div className="toolbar-buttons">
        {/* Layers button */}
        <button
          className={`toolbar-button ${layersPanelOpen ? 'active' : ''}`}
          onClick={onToggleLayers}
          title="Toggle layers panel"
          aria-label="Toggle layers panel"
          aria-pressed={layersPanelOpen}
        >
          <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="6" rx="1" />
            <rect x="3" y="11" width="18" height="6" rx="1" />
            <rect x="3" y="19" width="18" height="2" rx="1" />
          </svg>
          <span className="toolbar-label">Layers</span>
        </button>

        {/* Export button with dropdown */}
        <div className="toolbar-export" ref={exportButtonRef}>
          <button
            className={`toolbar-button ${showExportMenu ? 'active' : ''}`}
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

        {/* AI Agent button */}
        <button
          className={`toolbar-button ${aiPanelOpen ? 'active' : ''}`}
          onClick={toggleAIPanel}
          title="AI Assistant (⌘K)"
          aria-label="Toggle AI Assistant"
          aria-pressed={aiPanelOpen}
        >
          <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="toolbar-label">Agent</span>
        </button>
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

