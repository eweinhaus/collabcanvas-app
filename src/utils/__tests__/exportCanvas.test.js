/**
 * Export Canvas Unit Tests
 */

import { exportCanvasToPNG, exportCanvasToSVG } from '../exportCanvas';

describe('exportCanvas', () => {
  let mockStageRef;
  let mockStage;
  let createElementSpy;
  let appendChildSpy;
  let removeChildSpy;
  let clickSpy;

  beforeEach(() => {
    // Mock stage
    mockStage = {
      toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockdata'),
      width: jest.fn().mockReturnValue(800),
      height: jest.fn().mockReturnValue(600),
      scaleX: jest.fn().mockReturnValue(1),
    };

    mockStageRef = {
      current: mockStage,
    };

    // Mock document methods
    clickSpy = jest.fn();
    const mockAnchor = {
      download: '',
      href: '',
      click: clickSpy,
    };

    createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock Blob
    global.Blob = jest.fn().mockImplementation((content, options) => ({
      content,
      options,
    }));
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('exportCanvasToPNG', () => {
    it('should export canvas as PNG', async () => {
      const result = await exportCanvasToPNG(mockStageRef);

      expect(mockStage.toDataURL).toHaveBeenCalledWith({
        pixelRatio: 2,
        mimeType: 'image/png',
      });

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(clickSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(result).toBe('data:image/png;base64,mockdata');
    });

    it('should use custom filename if provided', async () => {
      const mockAnchor = { download: '', href: '', click: clickSpy };
      createElementSpy.mockReturnValue(mockAnchor);

      await exportCanvasToPNG(mockStageRef, 'my-canvas.png');

      expect(mockAnchor.download).toBe('my-canvas.png');
    });

    it('should use timestamp in filename if not provided', async () => {
      const mockAnchor = { download: '', href: '', click: clickSpy };
      createElementSpy.mockReturnValue(mockAnchor);

      await exportCanvasToPNG(mockStageRef);

      expect(mockAnchor.download).toMatch(/canvas-\d+\.png/);
    });

    it('should throw error if stageRef is null', async () => {
      await expect(exportCanvasToPNG(null)).rejects.toThrow('Stage reference is not available');
    });

    it('should throw error if stageRef.current is null', async () => {
      await expect(exportCanvasToPNG({ current: null })).rejects.toThrow('Stage reference is not available');
    });

    it('should handle toDataURL errors', async () => {
      mockStage.toDataURL.mockImplementation(() => {
        throw new Error('Canvas error');
      });

      await expect(exportCanvasToPNG(mockStageRef)).rejects.toThrow('Failed to export canvas as PNG');
    });
  });

  describe('exportCanvasToSVG', () => {
    it('should export canvas as SVG', async () => {
      const result = await exportCanvasToSVG(mockStageRef);

      expect(mockStage.toDataURL).toHaveBeenCalled();
      expect(mockStage.width).toHaveBeenCalled();
      expect(mockStage.height).toHaveBeenCalled();
      expect(mockStage.scaleX).toHaveBeenCalled();

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('<?xml version')],
        { type: 'image/svg+xml' }
      );

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      expect(result).toContain('<?xml version');
      expect(result).toContain('<svg');
      expect(result).toContain('<image');
    });

    it('should use custom filename if provided', async () => {
      const mockAnchor = { download: '', href: '', click: clickSpy };
      createElementSpy.mockReturnValue(mockAnchor);

      await exportCanvasToSVG(mockStageRef, 'my-canvas.svg');

      expect(mockAnchor.download).toBe('my-canvas.svg');
    });

    it('should use timestamp in filename if not provided', async () => {
      const mockAnchor = { download: '', href: '', click: clickSpy };
      createElementSpy.mockReturnValue(mockAnchor);

      await exportCanvasToSVG(mockStageRef);

      expect(mockAnchor.download).toMatch(/canvas-\d+\.svg/);
    });

    it('should throw error if stageRef is null', async () => {
      await expect(exportCanvasToSVG(null)).rejects.toThrow('Stage reference is not available');
    });

    it('should throw error if stageRef.current is null', async () => {
      await expect(exportCanvasToSVG({ current: null })).rejects.toThrow('Stage reference is not available');
    });

    it('should create SVG with correct dimensions', async () => {
      mockStage.width.mockReturnValue(1000);
      mockStage.height.mockReturnValue(800);
      mockStage.scaleX.mockReturnValue(1.5);

      const result = await exportCanvasToSVG(mockStageRef);

      expect(result).toContain('width="1500"');
      expect(result).toContain('height="1200"');
    });
  });
});

