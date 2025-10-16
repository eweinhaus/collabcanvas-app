/**
 * exportCanvas - Utilities for exporting canvas to various formats
 */

/**
 * Export canvas as PNG image
 * @param {Object} stageRef - React ref to Konva Stage
 * @param {string} filename - Optional filename (default: canvas-{timestamp}.png)
 * @param {Object} options - Optional configuration
 * @param {Function} options.onBeforeExport - Callback to hide UI elements
 * @param {Function} options.onAfterExport - Callback to restore UI elements
 * @returns {Promise<void>}
 */
export const exportCanvasToPNG = async (stageRef, filename, options = {}) => {
  if (!stageRef || !stageRef.current) {
    throw new Error('Stage reference is not available');
  }

  try {
    const stage = stageRef.current;
    
    // Hide UI elements before export (grid, transformer, selection box)
    if (options.onBeforeExport) {
      options.onBeforeExport();
    }
    
    // Wait for next frame to ensure UI updates are applied
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Generate high-quality PNG with 2x pixel ratio for retina displays
    const dataURL = stage.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png',
    });

    // Restore UI elements after export
    if (options.onAfterExport) {
      options.onAfterExport();
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = filename || `canvas-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return dataURL;
  } catch (error) {
    // Ensure UI is restored even on error
    if (options.onAfterExport) {
      options.onAfterExport();
    }
    // eslint-disable-next-line no-console
    console.error('[exportCanvas] Failed to export PNG:', error);
    throw new Error('Failed to export canvas as PNG');
  }
};

/**
 * Export canvas as SVG
 * Note: Konva doesn't have native SVG export, so we'll generate SVG manually from shapes
 * For now, we'll use a simpler approach: export as data URL then create SVG wrapper
 * A more robust solution would iterate through shapes and generate SVG elements
 * @param {Object} stageRef - React ref to Konva Stage
 * @param {string} filename - Optional filename (default: canvas-{timestamp}.svg)
 * @param {Object} options - Optional configuration
 * @param {Function} options.onBeforeExport - Callback to hide UI elements
 * @param {Function} options.onAfterExport - Callback to restore UI elements
 * @returns {Promise<void>}
 */
export const exportCanvasToSVG = async (stageRef, filename, options = {}) => {
  if (!stageRef || !stageRef.current) {
    throw new Error('Stage reference is not available');
  }

  try {
    const stage = stageRef.current;
    
    // Hide UI elements before export (grid, transformer, selection box)
    if (options.onBeforeExport) {
      options.onBeforeExport();
    }
    
    // Wait for next frame to ensure UI updates are applied
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Get PNG data URL
    const dataURL = stage.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png',
    });

    // Restore UI elements after export
    if (options.onAfterExport) {
      options.onAfterExport();
    }

    // Get stage dimensions
    const width = stage.width();
    const height = stage.height();
    const scale = stage.scaleX();

    // Create SVG with embedded PNG image
    // This is a basic approach; a more advanced version would convert shapes to SVG elements
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width * scale}" height="${height * scale}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${width * scale}" height="${height * scale}" xlink:href="${dataURL}"/>
</svg>`;

    // Create blob and trigger download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = filename || `canvas-${Date.now()}.svg`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up object URL
    URL.revokeObjectURL(url);

    return svgContent;
  } catch (error) {
    // Ensure UI is restored even on error
    if (options.onAfterExport) {
      options.onAfterExport();
    }
    // eslint-disable-next-line no-console
    console.error('[exportCanvas] Failed to export SVG:', error);
    throw new Error('Failed to export canvas as SVG');
  }
};

/**
 * Export canvas as JSON (shape data only)
 * @param {Array} shapes - Array of shape objects
 * @param {string} filename - Optional filename (default: canvas-{timestamp}.json)
 * @returns {Promise<string>}
 */
export const exportCanvasToJSON = async (shapes, filename) => {
  try {
    const jsonContent = JSON.stringify(shapes, null, 2);
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = filename || `canvas-${Date.now()}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up object URL
    URL.revokeObjectURL(url);

    return jsonContent;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[exportCanvas] Failed to export JSON:', error);
    throw new Error('Failed to export canvas as JSON');
  }
};

