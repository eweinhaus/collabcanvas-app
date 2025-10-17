/**
 * @jest-environment jsdom
 */

import { createAIToolExecutor } from '../aiToolExecutor';

// Mock dependencies
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

describe('aiToolExecutor - executeCreateGrid', () => {
  let executor;
  let mockAddShape;
  let mockAddShapesBatch;
  let mockUpdateShape;
  let mockGetShapes;
  let mockGetViewportCenter;

  beforeEach(() => {
    // Reset mocks
    mockAddShape = jest.fn().mockResolvedValue(undefined);
    mockAddShapesBatch = jest.fn().mockResolvedValue(undefined);
    mockUpdateShape = jest.fn().mockResolvedValue(undefined);
    mockGetShapes = jest.fn().mockReturnValue([]);
    mockGetViewportCenter = jest.fn().mockReturnValue({ x: 500, y: 400 });

    // Create executor with mocked dependencies
    executor = createAIToolExecutor({
      addShape: mockAddShape,
      addShapesBatch: mockAddShapesBatch,
      updateShape: mockUpdateShape,
      getShapes: mockGetShapes,
      getViewportCenter: mockGetViewportCenter,
    });

    // Mock uuid to return sequential IDs
    let idCounter = 0;
    const { v4 } = require('uuid');
    v4.mockImplementation(() => `grid-shape-${idCounter++}`);
  });

  describe('Happy Paths (16.20-16.22)', () => {
    test('creates 3x3 grid of red squares with default spacing', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'rectangle',
        rows: 3,
        cols: 3,
        color: 'red',
      });

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(9);
      expect(result.shapeIds).toHaveLength(9);
      expect(result.message).toContain('9 rectangles');
      expect(result.message).toContain('3×3 grid');

      // Verify batch create was called with 9 shapes
      expect(mockAddShapesBatch).toHaveBeenCalledTimes(1);
      const shapes = mockAddShapesBatch.mock.calls[0][0];
      expect(shapes).toHaveLength(9);

      // Verify first shape
      expect(shapes[0]).toMatchObject({
        type: 'rect', // internal type
        x: 200, // default originX
        y: 200, // default originY
        fill: '#ff0000', // normalized red (lowercase)
        createdBy: 'AI',
      });

      // Verify all shapes have required properties
      shapes.forEach(shape => {
        expect(shape).toHaveProperty('id');
        expect(shape).toHaveProperty('type', 'rect');
        expect(shape).toHaveProperty('fill', '#ff0000');
        expect(shape).toHaveProperty('width');
        expect(shape).toHaveProperty('height');
        expect(shape).toHaveProperty('zIndex');
      });
    });

    test('creates 2x5 grid of blue circles at custom position with custom spacing', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 5,
        color: 'blue',
        originX: 400,
        originY: 300,
        spacing: 150,
        size: 60,
      });

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(10);
      expect(result.message).toContain('10 circles');
      expect(result.message).toContain('2×5 grid');
      expect(result.message).toContain('(400, 300)');

      const shapes = mockAddShapesBatch.mock.calls[0][0];
      expect(shapes).toHaveLength(10);

      // Verify first shape position
      expect(shapes[0]).toMatchObject({
        type: 'circle',
        x: 400,
        y: 300,
        fill: '#0000ff', // normalized blue (lowercase)
        radius: 60,
      });
    });

    test('creates 10x10 grid (100 shapes - max limit)', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 10,
        cols: 10,
        color: 'green',
        size: 30,
        spacing: 80,
      });

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(100);
      expect(result.shapeIds).toHaveLength(100);

      const shapes = mockAddShapesBatch.mock.calls[0][0];
      expect(shapes).toHaveLength(100);

      // Verify all shapes have correct radius
      shapes.forEach(shape => {
        expect(shape.radius).toBe(30);
        expect(shape.type).toBe('circle');
        expect(shape.fill).toBe('#008000');
      });
    });

    test('creates grid of triangles', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'triangle',
        rows: 2,
        cols: 3,
        color: 'purple',
        size: 60,
      });

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(6);

      const shapes = mockAddShapesBatch.mock.calls[0][0];
      shapes.forEach(shape => {
        expect(shape.type).toBe('triangle');
        expect(shape.fill).toBe('#800080');
      });
    });

    test('creates grid of text shapes', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'text',
        rows: 2,
        cols: 2,
        color: 'black',
        text: 'Label',
        fontSize: 20,
        size: 40,
      });

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(4);

      const shapes = mockAddShapesBatch.mock.calls[0][0];
      shapes.forEach(shape => {
        expect(shape.type).toBe('text');
        expect(shape.text).toBe('Label');
        expect(shape.fontSize).toBe(20);
        expect(shape.fill).toBe('#000000');
      });
    });

    test('accepts hex color codes', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'rectangle',
        rows: 1,
        cols: 1,
        color: '#3498db',
      });

      expect(result.success).toBe(true);

      const shapes = mockAddShapesBatch.mock.calls[0][0];
      expect(shapes[0].fill).toBe('#3498db'); // normalized hex (lowercase)
    });

    test('supports alternative parameter names (type instead of shapeType)', async () => {
      const result = await executor.executeCreateGrid({
        type: 'circle', // using 'type' instead of 'shapeType'
        rows: 2,
        cols: 2,
        color: 'red',
      });

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(4);
    });

    test('supports alternative parameter names (fill instead of color)', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'rectangle',
        rows: 2,
        cols: 2,
        fill: 'blue', // using 'fill' instead of 'color'
      });

      expect(result.success).toBe(true);

      const shapes = mockAddShapesBatch.mock.calls[0][0];
      expect(shapes[0].fill).toBe('#0000ff'); // lowercase
    });
  });

  describe('Validation Tests (16.13, 16.26)', () => {
    test('rejects missing shapeType', async () => {
      const result = await executor.executeCreateGrid({
        rows: 3,
        cols: 3,
        color: 'red',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required field: shapeType');
      expect(mockAddShapesBatch).not.toHaveBeenCalled();
    });

    test('rejects missing rows', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        cols: 3,
        color: 'red',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required field: rows');
    });

    test('rejects missing cols', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 3,
        color: 'red',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required field: cols');
    });

    test('rejects missing color', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 3,
        cols: 3,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required field: color');
    });

    test('rejects invalid shapeType', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'pentagon',
        rows: 2,
        cols: 2,
        color: 'red',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid shape type');
      expect(result.error).toContain('pentagon');
    });

    test('rejects grid exceeding 100 shapes (15x15 = 225)', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 15,
        cols: 15,
        color: 'red',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds limit of 100 shapes');
      expect(mockAddShapesBatch).not.toHaveBeenCalled();
    });

    test('rejects rows exceeding 20', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 21,
        cols: 1,
        color: 'red',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('rows cannot exceed 20');
    });

    test('rejects cols exceeding 20', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 1,
        cols: 21,
        color: 'red',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('cols cannot exceed 20');
    });

    test('rejects invalid spacing (below minimum)', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        spacing: 5, // below min of 10
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('spacing must be between 10 and 500');
    });

    test('rejects invalid spacing (above maximum)', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        spacing: 600, // above max of 500
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('spacing must be between 10 and 500');
    });

    test('rejects invalid size', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        size: 250, // above max of 200
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('size must be between 10 and 200');
    });

    test('rejects negative origin coordinates', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        originX: -10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('origin coordinates cannot be negative');
    });

    test('rejects text grid without text content', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'text',
        rows: 2,
        cols: 2,
        color: 'black',
        // missing text property
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Text grid requires text content');
    });

    test('rejects invalid color', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'notacolor123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid color');
    });
  });

  describe('Error Handling (16.27)', () => {
    test('handles Firestore batch write error gracefully', async () => {
      mockAddShapesBatch.mockRejectedValueOnce(new Error('Firestore permission denied'));

      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'blue',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create grid');
      expect(result.error).toContain('Firestore permission denied');
    });

    test('handles grid generation error', async () => {
      // This shouldn't happen if validation works, but test defensive code
      const result = await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 0, // invalid, should be caught by validation
        cols: 2,
        color: 'red',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Integration Tests (16.19)', () => {
    test('end-to-end: grid generation → batch write', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'rectangle',
        rows: 3,
        cols: 3,
        color: '#FF0000',
        originX: 300,
        originY: 200,
        spacing: 120,
        size: 50,
      });

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(9);

      // Verify batch write was called
      expect(mockAddShapesBatch).toHaveBeenCalledTimes(1);

      const shapes = mockAddShapesBatch.mock.calls[0][0];

      // Verify positions are calculated correctly
      expect(shapes[0].x).toBe(300); // origin
      expect(shapes[0].y).toBe(200);

      expect(shapes[1].x).toBe(420); // origin + spacing
      expect(shapes[1].y).toBe(200);

      expect(shapes[3].x).toBe(300); // second row, first col
      expect(shapes[3].y).toBe(320); // origin + spacing

      // Verify all shapes have proper structure
      shapes.forEach((shape, i) => {
        expect(shape).toMatchObject({
          id: `grid-shape-${i}`,
          type: 'rect', // internal type
          fill: '#ff0000', // lowercase hex
          stroke: '#000000',
          strokeWidth: 2,
          draggable: true,
          createdBy: 'AI',
        });
        expect(typeof shape.zIndex).toBe('number');
        expect(typeof shape.width).toBe('number');
        expect(typeof shape.height).toBe('number');
      });
    });

    test('creates correct shape structure for each type', async () => {
      // Test circles
      await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 1,
        cols: 1,
        color: 'red',
        size: 75,
      });
      let shapes = mockAddShapesBatch.mock.calls[0][0];
      expect(shapes[0]).toHaveProperty('radius', 75);
      expect(shapes[0]).not.toHaveProperty('width');

      mockAddShapesBatch.mockClear();

      // Test rectangles
      await executor.executeCreateGrid({
        shapeType: 'rectangle',
        rows: 1,
        cols: 1,
        color: 'blue',
        size: 40,
      });
      shapes = mockAddShapesBatch.mock.calls[0][0];
      expect(shapes[0]).toHaveProperty('width', 80); // size * 2
      expect(shapes[0]).toHaveProperty('height', 60); // size * 1.5

      mockAddShapesBatch.mockClear();

      // Test text
      await executor.executeCreateGrid({
        shapeType: 'text',
        rows: 1,
        cols: 1,
        color: 'black',
        text: 'Test',
        fontSize: 18,
        size: 30,
      });
      shapes = mockAddShapesBatch.mock.calls[0][0];
      expect(shapes[0]).toHaveProperty('text', 'Test');
      expect(shapes[0]).toHaveProperty('fontSize', 18);
    });
  });

  describe('Performance Tests (16.29)', () => {
    test('generates 100-shape grid efficiently', async () => {
      const start = performance.now();

      await executor.executeCreateGrid({
        shapeType: 'circle',
        rows: 10,
        cols: 10,
        color: 'red',
        spacing: 80,
        size: 30,
      });

      const duration = performance.now() - start;

      // Should complete in under 50ms (includes mocked async operations)
      expect(duration).toBeLessThan(50);
    });

    test('handles maximum grid size efficiently', async () => {
      const start = performance.now();

      await executor.executeCreateGrid({
        shapeType: 'rectangle',
        rows: 20,
        cols: 5,
        color: 'blue',
        spacing: 150,
        size: 60,
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(mockAddShapesBatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Shape Type Normalization', () => {
    test('normalizes "rect" to internal type', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'rect',
        rows: 1,
        cols: 1,
        color: 'red',
      });

      expect(result.success).toBe(true);
      const shapes = mockAddShapesBatch.mock.calls[0][0];
      expect(shapes[0].type).toBe('rect'); // internal type constant
    });

    test('handles case-insensitive shape types', async () => {
      const result = await executor.executeCreateGrid({
        shapeType: 'CIRCLE',
        rows: 1,
        cols: 1,
        color: 'red',
      });

      expect(result.success).toBe(true);
      const shapes = mockAddShapesBatch.mock.calls[0][0];
      expect(shapes[0].type).toBe('circle');
    });
  });
});

