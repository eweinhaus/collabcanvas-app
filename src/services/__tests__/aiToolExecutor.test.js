/**
 * Tests for aiToolExecutor
 */

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

import { createAIToolExecutor } from '../aiToolExecutor';
import { SHAPE_TYPES } from '../../utils/shapes';

describe('aiToolExecutor', () => {
  let mockAddShape;
  let mockAddShapesBatch;
  let mockGetShapes;
  let executor;

  beforeEach(() => {
    mockAddShape = jest.fn().mockResolvedValue(undefined);
    mockAddShapesBatch = jest.fn().mockResolvedValue(undefined);
    mockGetShapes = jest.fn().mockReturnValue([]);

    executor = createAIToolExecutor({
      addShape: mockAddShape,
      addShapesBatch: mockAddShapesBatch,
      getShapes: mockGetShapes,
    });
  });

  describe('executeCreateShape', () => {
    describe('rectangle creation', () => {
      test('creates rectangle with valid args', async () => {
        const args = {
          shapeType: 'rectangle',
          x: 300,
          y: 400,
          fill: 'red',
          width: 100,
          height: 80,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(result.shapeId).toBeDefined();
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SHAPE_TYPES.RECT,
            x: 300,
            y: 400,
            fill: '#ff0000',
            width: 100,
            height: 80,
            createdBy: 'AI',
          })
        );
      });

      test('accepts "rect" as alias for "rectangle"', async () => {
        const args = {
          shapeType: 'rect',
          x: 100,
          y: 100,
          fill: '#00ff00',
          width: 50,
          height: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SHAPE_TYPES.RECT,
          })
        );
      });

      test('uses default dimensions when not provided', async () => {
        const args = {
          shapeType: 'rectangle',
          x: 300,
          y: 400,
          fill: 'red',
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SHAPE_TYPES.RECT,
            width: 100, // default
            height: 100, // default
          })
        );
      });

      test('enforces minimum size', async () => {
        const args = {
          type: 'rectangle',
          x: 300,
          y: 400,
          color: 'red',
          width: 5, // Too small
          height: 3, // Too small
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            width: 10, // Clamped to minimum
            height: 10, // Clamped to minimum
          })
        );
      });
    });

    describe('circle creation', () => {
      test('creates circle with valid args', async () => {
        const args = {
          type: 'circle',
          x: 500,
          y: 300,
          color: 'blue',
          radius: 60,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(result.shapeId).toBeDefined();
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SHAPE_TYPES.CIRCLE,
            x: 500,
            y: 300,
            fill: '#0000ff',
            radius: 60,
            createdBy: 'AI',
          })
        );
      });

      test('uses default radius when not provided', async () => {
        const args = {
          shapeType: 'circle',
          x: 500,
          y: 300,
          fill: 'blue',
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SHAPE_TYPES.CIRCLE,
            radius: 50, // default
          })
        );
      });

      test('enforces minimum radius', async () => {
        const args = {
          type: 'circle',
          x: 500,
          y: 300,
          color: 'blue',
          radius: 2, // Too small
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            radius: 5, // Clamped to minimum
          })
        );
      });
    });

    describe('text creation', () => {
      test('creates text shape with valid args', async () => {
        const args = {
          type: 'text',
          x: 200,
          y: 150,
          color: 'black',
          text: 'Hello World',
          fontSize: 24,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(result.shapeId).toBeDefined();
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SHAPE_TYPES.TEXT,
            x: 200,
            y: 150,
            fill: '#000000',
            text: 'Hello World',
            fontSize: 24,
            createdBy: 'AI',
          })
        );
      });

      test('uses default font size if not specified', async () => {
        const args = {
          type: 'text',
          x: 200,
          y: 150,
          color: 'black',
          text: 'Hello',
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            fontSize: 16, // Default
          })
        );
      });

      test('requires text content', async () => {
        const args = {
          type: 'text',
          x: 200,
          y: 150,
          color: 'black',
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(false);
        expect(result.error).toContain('text content');
      });
    });

    describe('triangle creation', () => {
      test('creates triangle with valid args', async () => {
        const args = {
          type: 'triangle',
          x: 400,
          y: 500,
          color: 'green',
          width: 120,
          height: 100,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(result.shapeId).toBeDefined();
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SHAPE_TYPES.TRIANGLE,
            x: 400,
            y: 500,
            fill: '#008000',
            width: 120,
            height: 100,
            rotation: 0,
            createdBy: 'AI',
          })
        );
      });

      test('uses default dimensions when not provided', async () => {
        const args = {
          shapeType: 'triangle',
          x: 400,
          y: 500,
          fill: 'green',
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SHAPE_TYPES.TRIANGLE,
            width: 100, // default
            height: 100, // default
          })
        );
      });
    });

    describe('color normalization', () => {
      test('normalizes CSS color keywords', async () => {
        const args = {
          type: 'circle',
          x: 100,
          y: 100,
          color: 'cornflowerblue',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            fill: '#6495ed',
          })
        );
      });

      test('normalizes 3-digit hex colors', async () => {
        const args = {
          type: 'circle',
          x: 100,
          y: 100,
          color: '#abc',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            fill: '#aabbcc',
          })
        );
      });

      test('normalizes rgb colors', async () => {
        const args = {
          type: 'circle',
          x: 100,
          y: 100,
          color: 'rgb(255, 128, 0)',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            fill: '#ff8000',
          })
        );
      });

      test('normalizes hsl colors', async () => {
        const args = {
          type: 'circle',
          x: 100,
          y: 100,
          color: 'hsl(0, 100%, 50%)',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            fill: '#ff0000',
          })
        );
      });

      test('rejects invalid colors', async () => {
        const args = {
          type: 'circle',
          x: 100,
          y: 100,
          color: 'blurple',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid color');
      });

      test('rejects rgba with transparency', async () => {
        const args = {
          type: 'circle',
          x: 100,
          y: 100,
          color: 'rgba(255, 0, 0, 0.5)',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(false);
        expect(result.error).toContain('alpha');
      });
    });

    describe('coordinate validation', () => {
      test('clamps x coordinate to canvas bounds', async () => {
        const args = {
          type: 'circle',
          x: 5000, // Beyond max
          y: 500,
          color: 'red',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            x: 1920, // Clamped to max
          })
        );
      });

      test('clamps y coordinate to canvas bounds', async () => {
        const args = {
          type: 'circle',
          x: 500,
          y: -100, // Below min
          color: 'red',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            y: 0, // Clamped to min
          })
        );
      });

      test('accepts valid coordinates unchanged', async () => {
        const args = {
          type: 'circle',
          x: 960,
          y: 540,
          color: 'red',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(true);
        expect(mockAddShape).toHaveBeenCalledWith(
          expect.objectContaining({
            x: 960,
            y: 540,
          })
        );
      });
    });

    describe('validation', () => {
      test('requires type field', async () => {
        const args = {
          x: 100,
          y: 100,
          fill: 'red',
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(false);
        expect(result.error).toContain('shapeType');
      });

      test('requires x coordinate', async () => {
        const args = {
          type: 'circle',
          y: 100,
          color: 'red',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(false);
        expect(result.error).toContain('x');
      });

      test('requires y coordinate', async () => {
        const args = {
          type: 'circle',
          x: 100,
          color: 'red',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(false);
        expect(result.error).toContain('y');
      });

      test('requires color field', async () => {
        const args = {
          type: 'circle',
          x: 100,
          y: 100,
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(false);
        expect(result.error).toContain('color');
      });

      test('rejects invalid shape type', async () => {
        const args = {
          type: 'hexagon',
          x: 100,
          y: 100,
          color: 'red',
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid shape type');
      });
    });

    describe('error handling', () => {
      test('handles addShape failure gracefully', async () => {
        mockAddShape.mockRejectedValue(new Error('Network error'));

        const args = {
          type: 'circle',
          x: 100,
          y: 100,
          color: 'red',
          radius: 50,
        };

        const result = await executor.executeCreateShape(args);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Network error');
      });
    });
  });

  describe('executeGetCanvasState', () => {
    test('returns empty shapes array when canvas is empty', () => {
      mockGetShapes.mockReturnValue([]);

      const result = executor.executeGetCanvasState();

      expect(result.success).toBe(true);
      expect(result.shapes).toEqual([]);
      expect(result.totalShapes).toBe(0);
    });

    test('returns simplified shape data', () => {
      mockGetShapes.mockReturnValue([
        {
          id: 'shape1',
          type: 'rect',
          x: 100,
          y: 200,
          width: 50,
          height: 60,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2,
          draggable: true,
          zIndex: 1000,
          createdBy: 'user1',
        },
      ]);

      const result = executor.executeGetCanvasState();

      expect(result.success).toBe(true);
      expect(result.shapes).toHaveLength(1);
      expect(result.shapes[0]).toEqual({
        id: 'shape1',
        type: 'rect',
        x: 100,
        y: 200,
        width: 50,
        height: 60,
        fill: '#ff0000',
        isRecent: true,
      });
      expect(result.totalShapes).toBe(1);
    });

    test('sorts shapes by creation time (newest first)', () => {
      mockGetShapes.mockReturnValue([
        { id: 'shape1', type: 'rect', x: 0, y: 0, fill: '#000', zIndex: 1000 },
        { id: 'shape2', type: 'circle', x: 0, y: 0, fill: '#000', zIndex: 3000 }, // Newest
        { id: 'shape3', type: 'text', x: 0, y: 0, fill: '#000', zIndex: 2000 },
      ]);

      const result = executor.executeGetCanvasState();

      expect(result.success).toBe(true);
      expect(result.shapes.map(s => s.id)).toEqual(['shape2', 'shape3', 'shape1']);
    });

    test('marks most recent shape with isRecent flag', () => {
      mockGetShapes.mockReturnValue([
        { id: 'shape1', type: 'rect', x: 0, y: 0, fill: '#000', zIndex: 1000 },
        { id: 'shape2', type: 'circle', x: 0, y: 0, fill: '#000', zIndex: 3000 },
      ]);

      const result = executor.executeGetCanvasState();

      expect(result.success).toBe(true);
      expect(result.shapes[0].isRecent).toBe(true);
      expect(result.shapes[1].isRecent).toBe(false);
    });

    test('uses createdAt if available instead of zIndex', () => {
      mockGetShapes.mockReturnValue([
        { id: 'shape1', type: 'rect', x: 0, y: 0, fill: '#000', createdAt: 1000, zIndex: 9999 },
        { id: 'shape2', type: 'circle', x: 0, y: 0, fill: '#000', createdAt: 3000, zIndex: 1 },
      ]);

      const result = executor.executeGetCanvasState();

      expect(result.success).toBe(true);
      expect(result.shapes[0].id).toBe('shape2'); // Newer createdAt
    });

    test('includes optional shape properties when present', () => {
      mockGetShapes.mockReturnValue([
        {
          id: 'text1',
          type: 'text',
          x: 100,
          y: 200,
          fill: '#000',
          text: 'Hello',
          fontSize: 24,
          zIndex: 1000,
        },
        {
          id: 'circle1',
          type: 'circle',
          x: 300,
          y: 400,
          fill: '#f00',
          radius: 50,
          zIndex: 2000,
        },
      ]);

      const result = executor.executeGetCanvasState();

      expect(result.success).toBe(true);
      expect(result.shapes[0]).toMatchObject({
        id: 'circle1',
        radius: 50,
      });
      expect(result.shapes[1]).toMatchObject({
        id: 'text1',
        text: 'Hello',
        fontSize: 24,
      });
    });

    test('handles errors gracefully', () => {
      mockGetShapes.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = executor.executeGetCanvasState();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
      expect(result.shapes).toEqual([]);
    });
  });
});

