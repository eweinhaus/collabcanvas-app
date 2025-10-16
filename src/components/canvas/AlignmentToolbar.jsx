/**
 * AlignmentToolbar - Floating toolbar for aligning and distributing shapes
 * Appears when 2+ shapes are selected
 */

import { useState } from 'react';
import {
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  distributeHorizontally,
  distributeVertically,
  canAlign,
  canDistribute,
} from '../../utils/alignment';
import './AlignmentToolbar.css';

const AlignmentToolbar = ({ selectedShapes, onAlign, position }) => {
  const [previewMode, setPreviewMode] = useState(null);

  if (!canAlign(selectedShapes)) {
    return null;
  }

  const handleAlign = (alignmentFn, type) => {
    const updates = alignmentFn(selectedShapes);
    if (updates && updates.length > 0) {
      onAlign(updates, type);
    }
    setPreviewMode(null);
  };

  const handlePreview = (alignmentFn) => {
    const updates = alignmentFn(selectedShapes);
    setPreviewMode(updates);
  };

  const clearPreview = () => {
    setPreviewMode(null);
  };

  const canDistributeShapes = canDistribute(selectedShapes);

  return (
    <div
      className="alignment-toolbar"
      style={{
        left: position?.x || 0,
        top: position?.y || 0,
      }}
    >
      <div className="alignment-toolbar__section">
        <span className="alignment-toolbar__label">Align</span>
        <div className="alignment-toolbar__buttons">
          <button
            className="alignment-toolbar__button"
            onClick={() => handleAlign(alignLeft, 'left')}
            onMouseEnter={() => handlePreview(alignLeft)}
            onMouseLeave={clearPreview}
            title="Align Left (Ctrl+Shift+L)"
            aria-label="Align left"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="0" x2="2" y2="16" stroke="currentColor" strokeWidth="2"/>
              <rect x="4" y="2" width="8" height="3" fill="currentColor"/>
              <rect x="4" y="7" width="10" height="3" fill="currentColor"/>
              <rect x="4" y="12" width="6" height="3" fill="currentColor"/>
            </svg>
          </button>

          <button
            className="alignment-toolbar__button"
            onClick={() => handleAlign(alignCenter, 'center')}
            onMouseEnter={() => handlePreview(alignCenter)}
            onMouseLeave={clearPreview}
            title="Align Center (Ctrl+Shift+C)"
            aria-label="Align center horizontally"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="8" y1="0" x2="8" y2="16" stroke="currentColor" strokeWidth="2"/>
              <rect x="4" y="2" width="8" height="3" fill="currentColor"/>
              <rect x="3" y="7" width="10" height="3" fill="currentColor"/>
              <rect x="5" y="12" width="6" height="3" fill="currentColor"/>
            </svg>
          </button>

          <button
            className="alignment-toolbar__button"
            onClick={() => handleAlign(alignRight, 'right')}
            onMouseEnter={() => handlePreview(alignRight)}
            onMouseLeave={clearPreview}
            title="Align Right (Ctrl+Shift+R)"
            aria-label="Align right"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="14" y1="0" x2="14" y2="16" stroke="currentColor" strokeWidth="2"/>
              <rect x="4" y="2" width="8" height="3" fill="currentColor"/>
              <rect x="2" y="7" width="10" height="3" fill="currentColor"/>
              <rect x="6" y="12" width="6" height="3" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="alignment-toolbar__divider" />

      <div className="alignment-toolbar__section">
        <div className="alignment-toolbar__buttons">
          <button
            className="alignment-toolbar__button"
            onClick={() => handleAlign(alignTop, 'top')}
            onMouseEnter={() => handlePreview(alignTop)}
            onMouseLeave={clearPreview}
            title="Align Top (Ctrl+Shift+T)"
            aria-label="Align top"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="2"/>
              <rect x="2" y="4" width="3" height="8" fill="currentColor"/>
              <rect x="7" y="4" width="3" height="10" fill="currentColor"/>
              <rect x="12" y="4" width="3" height="6" fill="currentColor"/>
            </svg>
          </button>

          <button
            className="alignment-toolbar__button"
            onClick={() => handleAlign(alignMiddle, 'middle')}
            onMouseEnter={() => handlePreview(alignMiddle)}
            onMouseLeave={clearPreview}
            title="Align Middle (Ctrl+Shift+M)"
            aria-label="Align middle vertically"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="0" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="2"/>
              <rect x="2" y="4" width="3" height="8" fill="currentColor"/>
              <rect x="7" y="3" width="3" height="10" fill="currentColor"/>
              <rect x="12" y="5" width="3" height="6" fill="currentColor"/>
            </svg>
          </button>

          <button
            className="alignment-toolbar__button"
            onClick={() => handleAlign(alignBottom, 'bottom')}
            onMouseEnter={() => handlePreview(alignBottom)}
            onMouseLeave={clearPreview}
            title="Align Bottom (Ctrl+Shift+B)"
            aria-label="Align bottom"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="0" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="2"/>
              <rect x="2" y="4" width="3" height="8" fill="currentColor"/>
              <rect x="7" y="2" width="3" height="10" fill="currentColor"/>
              <rect x="12" y="6" width="3" height="6" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {canDistributeShapes && (
        <>
          <div className="alignment-toolbar__divider" />
          
          <div className="alignment-toolbar__section">
            <span className="alignment-toolbar__label">Distribute</span>
            <div className="alignment-toolbar__buttons">
              <button
                className="alignment-toolbar__button"
                onClick={() => handleAlign(distributeHorizontally, 'distribute-h')}
                onMouseEnter={() => handlePreview(distributeHorizontally)}
                onMouseLeave={clearPreview}
                title="Distribute Horizontally (Ctrl+Shift+H)"
                aria-label="Distribute horizontally"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="5" width="3" height="6" fill="currentColor"/>
                  <rect x="6.5" y="5" width="3" height="6" fill="currentColor"/>
                  <rect x="12" y="5" width="3" height="6" fill="currentColor"/>
                  <path d="M4.5 8 L6 8 M10 8 L11.5 8" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1"/>
                </svg>
              </button>

              <button
                className="alignment-toolbar__button"
                onClick={() => handleAlign(distributeVertically, 'distribute-v')}
                onMouseEnter={() => handlePreview(distributeVertically)}
                onMouseLeave={clearPreview}
                title="Distribute Vertically (Ctrl+Shift+V)"
                aria-label="Distribute vertically"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="1" width="6" height="3" fill="currentColor"/>
                  <rect x="5" y="6.5" width="6" height="3" fill="currentColor"/>
                  <rect x="5" y="12" width="6" height="3" fill="currentColor"/>
                  <path d="M8 4.5 L8 6 M8 10 L8 11.5" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AlignmentToolbar;

