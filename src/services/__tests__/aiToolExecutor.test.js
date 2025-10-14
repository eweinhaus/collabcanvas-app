/**
 * Unit Tests for AI Tool Executor
 */

import { executeCreateShape, executeGetCanvasState, executeToolCall } from '../aiToolExecutor';
import { SHAPE_TYPES } from '../../utils/shapes';

// Mock uuid to avoid ESM issues in Jest
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

describe('aiToolExecutor', () => {
  describe('executeCreateShape', () => {
    let mockCanvasActions;

    beforeEach(() => {
      mockCanvasActions = {
        addShape: jest.fn().mockResolvedValue(undefined),
      };
    });

    it('should create a circle with valid arguments', async () => {
      const args = {
        type: 'circle',
        x: 100,
        y: 200,
        radius: 50,
        color: 'red',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.shape.type).toBe(SHAPE_TYPES.CIRCLE);
      expect(result.shape.x).toBe(100);
      expect(result.shape.y).toBe(200);
      expect(result.shape.radius).toBe(50);
      expect(result.shape.fill).toBe('#ff0000'); // normalized red
      expect(mockCanvasActions.addShape).toHaveBeenCalledWith(result.shape);
    });

    it('should create a rectangle with valid arguments', async () => {
      const args = {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#3498db',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.shape.type).toBe(SHAPE_TYPES.RECT);
      expect(result.shape.fill).toBe('#3498db');
      expect(result.shape.width).toBe(150);
      expect(result.shape.height).toBe(100);
    });

    it('should create text with valid arguments', async () => {
      const args = {
        type: 'text',
        x: 500,
        y: 600,
        text: 'Hello World',
        color: 'blue',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.shape.type).toBe(SHAPE_TYPES.TEXT);
      expect(result.shape.text).toBe('Hello World');
      expect(result.shape.fill).toBe('#0000ff');
    });

    it('should create a triangle with valid arguments', async () => {
      const args = {
        type: 'triangle',
        x: 200,
        y: 300,
        color: 'purple',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.shape.type).toBe(SHAPE_TYPES.TRIANGLE);
      expect(result.shape.fill).toBe('#800080');
    });

    it('should normalize color names to hex', async () => {
      const args = {
        type: 'circle',
        x: 100,
        y: 100,
        color: 'GREEN',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.shape.fill).toBe('#008000'); // normalized green
    });

    it('should fail when shape type is missing', async () => {
      const args = {
        x: 100,
        y: 200,
        color: 'red',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Shape type is required');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });

    it('should fail when coordinates are invalid', async () => {
      const args = {
        type: 'circle',
        x: 'invalid',
        y: 200,
        color: 'red',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('coordinates are required');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });

    it('should fail when color is missing', async () => {
      const args = {
        type: 'circle',
        x: 100,
        y: 200,
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Color is required');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });

    it('should fail when color is invalid', async () => {
      const args = {
        type: 'circle',
        x: 100,
        y: 200,
        color: 'notacolor',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid color');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });

    it('should fail when text shape has no text content', async () => {
      const args = {
        type: 'text',
        x: 100,
        y: 200,
        color: 'black',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Text content is required');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });

    it('should fail when shape type is unknown', async () => {
      const args = {
        type: 'hexagon',
        x: 100,
        y: 200,
        color: 'red',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown shape type');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });
  });

  describe('executeGetCanvasState', () => {
    it('should return canvas state with shapes', async () => {
      const mockCanvasState = {
        shapes: [
          { id: '1', type: 'circle', x: 100, y: 200, fill: '#ff0000', radius: 50 },
          { id: '2', type: 'rect', x: 300, y: 400, fill: '#0000ff', width: 100, height: 100 },
        ],
      };

      const result = await executeGetCanvasState({}, mockCanvasState);

      expect(result.success).toBe(true);
      expect(result.canvasState.shapeCount).toBe(2);
      expect(result.canvasState.shapes).toHaveLength(2);
      expect(result.canvasState.shapes[0].id).toBe('1');
      expect(result.canvasState.shapes[0].color).toBe('#ff0000');
    });

    it('should return empty canvas state when no shapes', async () => {
      const mockCanvasState = {
        shapes: [],
      };

      const result = await executeGetCanvasState({}, mockCanvasState);

      expect(result.success).toBe(true);
      expect(result.canvasState.shapeCount).toBe(0);
      expect(result.canvasState.shapes).toHaveLength(0);
    });

    it('should simplify shape properties', async () => {
      const mockCanvasState = {
        shapes: [
          {
            id: '1',
            type: 'circle',
            x: 100.6,
            y: 200.4,
            fill: '#ff0000',
            radius: 50.8,
            draggable: true,
            stroke: '#000000',
          },
        ],
      };

      const result = await executeGetCanvasState({}, mockCanvasState);

      expect(result.success).toBe(true);
      const shape = result.canvasState.shapes[0];
      expect(shape.x).toBe(101); // rounded
      expect(shape.y).toBe(200); // rounded
      expect(shape.radius).toBe(51); // rounded
      expect(shape.draggable).toBeUndefined(); // not included
      expect(shape.stroke).toBeUndefined(); // not included
    });
  });

  describe('executeToolCall', () => {
    let mockContext;

    beforeEach(() => {
      mockContext = {
        canvasActions: {
          addShape: jest.fn().mockResolvedValue(undefined),
        },
        canvasState: {
          shapes: [],
        },
      };
    });

    it('should execute createShape tool', async () => {
      const args = {
        type: 'circle',
        x: 100,
        y: 200,
        color: 'red',
      };

      const result = await executeToolCall('createShape', args, mockContext);

      expect(result.success).toBe(true);
      expect(mockContext.canvasActions.addShape).toHaveBeenCalled();
    });

    it('should execute getCanvasState tool', async () => {
      const result = await executeToolCall('getCanvasState', {}, mockContext);

      expect(result.success).toBe(true);
      expect(result.canvasState).toBeDefined();
      expect(result.canvasState.shapeCount).toBe(0);
    });

    it('should fail for unknown tool', async () => {
      const result = await executeToolCall('unknownTool', {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });
  });
});

