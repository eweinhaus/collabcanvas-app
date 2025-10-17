/**
 * Tests for AI Tool Executor - Complex Commands (PR 17)
 * Tests executeCreateShapesVertically and executeCreateShapesHorizontally
 */

import { createAIToolExecutor } from '../aiToolExecutor';

describe('AI Tool Executor - Complex Commands', () => {
  let mockAddShapesBatch;
  let executor;

  beforeEach(() => {
    mockAddShapesBatch = jest.fn().mockResolvedValue(undefined);

    executor = createAIToolExecutor({
      addShape: jest.fn(),
      addShapesBatch: mockAddShapesBatch,
      updateShape: jest.fn(),
      getShapes: () => [],
      getViewportCenter: () => ({ x: 500, y: 400 }),
    });
  });

  describe('executeCreateShapesVertically', () => {
    it('should create shapes vertically with default spacing', async () => {
      const args = {
        shapes: [
          { type: 'text', color: '#2C3E50', text: 'Username:', width: 300, height: 24 },
          { type: 'rectangle', color: '#FFFFFF', width: 300, height: 40, stroke: '#CCCCCC', strokeWidth: 2 },
        ],
        originX: 300,
        originY: 200,
      };

      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(2);
      expect(result.shapeIds).toHaveLength(2);
      expect(mockAddShapesBatch).toHaveBeenCalledTimes(1);

      const shapesCreated = mockAddShapesBatch.mock.calls[0][0];
      expect(shapesCreated).toHaveLength(2);

      // Check first shape (text)
      expect(shapesCreated[0]).toMatchObject({
        type: 'text',
        x: 300,
        y: 200,
        fill: '#2c3e50',
        text: 'Username:',
        width: 300,
        height: 24,
      });

      // Check second shape (rectangle) - should be 24 + 25 = 49 pixels below
      expect(shapesCreated[1]).toMatchObject({
        type: 'rect',
        x: 300,
        y: 249, // 200 + 24 (height of first) + 25 (spacing)
        fill: '#ffffff',
        width: 300,
        height: 40,
        stroke: '#cccccc',
        strokeWidth: 2,
      });
    });

    it('should use custom spacing', async () => {
      const args = {
        shapes: [
          { type: 'rectangle', color: 'blue', width: 100, height: 50 },
          { type: 'rectangle', color: 'red', width: 100, height: 50 },
        ],
        originX: 100,
        originY: 100,
        spacing: 40,
      };

      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(true);

      const shapesCreated = mockAddShapesBatch.mock.calls[0][0];
      expect(shapesCreated[0].y).toBe(100);
      expect(shapesCreated[1].y).toBe(190); // 100 + 50 + 40
    });

    it('should handle login form creation', async () => {
      const args = {
        shapes: [
          { type: 'text', color: '#2C3E50', text: 'Username:', width: 300, height: 24 },
          { type: 'rectangle', color: '#FFFFFF', width: 300, height: 40, stroke: '#CCCCCC', strokeWidth: 2 },
          { type: 'text', color: '#2C3E50', text: 'Password:', width: 300, height: 24 },
          { type: 'rectangle', color: '#FFFFFF', width: 300, height: 40, stroke: '#CCCCCC', strokeWidth: 2 },
          { type: 'rectangle', color: '#4CAF50', width: 120, height: 40 },
          { type: 'text', color: '#FFFFFF', text: 'Submit', width: 80, height: 24 },
        ],
        originX: 300,
        originY: 200,
        spacing: 30,
      };

      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(6);

      const shapesCreated = mockAddShapesBatch.mock.calls[0][0];
      expect(shapesCreated).toHaveLength(6);

      // Verify all shapes have correct types and positions
      expect(shapesCreated[0].type).toBe('text');
      expect(shapesCreated[1].type).toBe('rect');
      expect(shapesCreated[4].fill).toBe('#4caf50'); // button color
      expect(shapesCreated[5].text).toBe('Submit');
    });

    it('should reject if shapes array is missing', async () => {
      const args = { originX: 100, originY: 100 };
      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('shapes (array)');
    });

    it('should reject if originX is missing', async () => {
      const args = {
        shapes: [
          { type: 'rectangle', color: 'blue' },
          { type: 'rectangle', color: 'red' },
        ],
        originY: 100,
      };

      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('originX');
    });

    it('should reject if originY is missing', async () => {
      const args = {
        shapes: [
          { type: 'rectangle', color: 'blue' },
          { type: 'rectangle', color: 'red' },
        ],
        originX: 100,
      };

      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('originY');
    });

    it('should reject if less than 2 shapes', async () => {
      const args = {
        shapes: [{ type: 'rectangle', color: 'blue' }],
        originX: 100,
        originY: 100,
      };

      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 shapes');
    });

    it('should reject if more than 100 shapes', async () => {
      const shapes = Array(101)
        .fill(null)
        .map(() => ({ type: 'rectangle', color: 'blue' }));

      const args = { shapes, originX: 100, originY: 100 };
      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many shapes');
      expect(result.error).toContain('101');
    });

    it('should reject if shape has invalid type', async () => {
      const args = {
        shapes: [
          { type: 'rectangle', color: 'blue' },
          { type: 'pentagon', color: 'red' }, // invalid
        ],
        originX: 100,
        originY: 100,
      };

      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('index 1');
      expect(result.error).toContain('Invalid shape type');
    });

    it('should reject if text shape is missing text content', async () => {
      const args = {
        shapes: [
          { type: 'rectangle', color: 'blue' },
          { type: 'text', color: 'black' }, // missing text
        ],
        originX: 100,
        originY: 100,
      };

      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('requires text content');
    });

    it('should normalize shape colors', async () => {
      const args = {
        shapes: [
          { type: 'rectangle', color: 'blue' }, // CSS color
          { type: 'rectangle', color: '#FF0000' }, // hex
        ],
        originX: 100,
        originY: 100,
      };

      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(true);

      const shapesCreated = mockAddShapesBatch.mock.calls[0][0];
      expect(shapesCreated[0].fill).toBe('#0000ff'); // normalized blue
      expect(shapesCreated[1].fill).toBe('#ff0000'); // normalized hex
    });

    it('should handle stroke properties', async () => {
      const args = {
        shapes: [
          {
            type: 'rectangle',
            color: '#FFFFFF',
            stroke: '#CCCCCC',
            strokeWidth: 2,
          },
          {
            type: 'rectangle',
            color: '#FFFFFF',
            stroke: 'red',
            strokeWidth: 3,
          },
        ],
        originX: 100,
        originY: 100,
      };

      const result = await executor.executeCreateShapesVertically(args);

      expect(result.success).toBe(true);

      const shapesCreated = mockAddShapesBatch.mock.calls[0][0];
      expect(shapesCreated[0].stroke).toBe('#cccccc');
      expect(shapesCreated[0].strokeWidth).toBe(2);
      expect(shapesCreated[1].stroke).toBe('#ff0000');
      expect(shapesCreated[1].strokeWidth).toBe(3);
    });
  });

  describe('executeCreateShapesHorizontally', () => {
    it('should create shapes horizontally with default spacing', async () => {
      const args = {
        shapes: [
          { type: 'text', color: '#2C3E50', text: 'Home', width: 80, height: 40 },
          { type: 'text', color: '#2C3E50', text: 'About', width: 80, height: 40 },
          { type: 'text', color: '#2C3E50', text: 'Contact', width: 90, height: 40 },
        ],
        originX: 300,
        originY: 100,
      };

      const result = await executor.executeCreateShapesHorizontally(args);

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(3);
      expect(mockAddShapesBatch).toHaveBeenCalledTimes(1);

      const shapesCreated = mockAddShapesBatch.mock.calls[0][0];
      expect(shapesCreated).toHaveLength(3);

      // All shapes should have same Y coordinate
      expect(shapesCreated[0].y).toBe(100);
      expect(shapesCreated[1].y).toBe(100);
      expect(shapesCreated[2].y).toBe(100);

      // Check X positions with default spacing (20px)
      expect(shapesCreated[0].x).toBe(300);
      expect(shapesCreated[1].x).toBe(400); // 300 + 80 + 20
      expect(shapesCreated[2].x).toBe(500); // 400 + 80 + 20
    });

    it('should use custom spacing', async () => {
      const args = {
        shapes: [
          { type: 'rectangle', color: 'blue', width: 100, height: 40 },
          { type: 'rectangle', color: 'red', width: 100, height: 40 },
        ],
        originX: 200,
        originY: 150,
        spacing: 50,
      };

      const result = await executor.executeCreateShapesHorizontally(args);

      expect(result.success).toBe(true);

      const shapesCreated = mockAddShapesBatch.mock.calls[0][0];
      expect(shapesCreated[0].x).toBe(200);
      expect(shapesCreated[1].x).toBe(350); // 200 + 100 + 50
    });

    it('should handle navigation bar creation', async () => {
      const args = {
        shapes: [
          { type: 'text', color: '#2C3E50', text: 'Home', width: 80, height: 40 },
          { type: 'text', color: '#2C3E50', text: 'About', width: 80, height: 40 },
          { type: 'text', color: '#2C3E50', text: 'Services', width: 100, height: 40 },
          { type: 'text', color: '#2C3E50', text: 'Contact', width: 90, height: 40 },
        ],
        originX: 300,
        originY: 100,
        spacing: 40,
      };

      const result = await executor.executeCreateShapesHorizontally(args);

      expect(result.success).toBe(true);
      expect(result.totalShapes).toBe(4);

      const shapesCreated = mockAddShapesBatch.mock.calls[0][0];
      expect(shapesCreated).toHaveLength(4);

      // Verify all are text shapes with correct content
      expect(shapesCreated[0].text).toBe('Home');
      expect(shapesCreated[1].text).toBe('About');
      expect(shapesCreated[2].text).toBe('Services');
      expect(shapesCreated[3].text).toBe('Contact');

      // All should be at same Y
      expect(new Set(shapesCreated.map(s => s.y)).size).toBe(1);
    });

    it('should reject if shapes array is missing', async () => {
      const args = { originX: 100, originY: 100 };
      const result = await executor.executeCreateShapesHorizontally(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('shapes (array)');
    });

    it('should reject if originX is missing', async () => {
      const args = {
        shapes: [
          { type: 'rectangle', color: 'blue' },
          { type: 'rectangle', color: 'red' },
        ],
        originY: 100,
      };

      const result = await executor.executeCreateShapesHorizontally(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('originX');
    });

    it('should reject if originY is missing', async () => {
      const args = {
        shapes: [
          { type: 'rectangle', color: 'blue' },
          { type: 'rectangle', color: 'red' },
        ],
        originX: 100,
      };

      const result = await executor.executeCreateShapesHorizontally(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('originY');
    });

    it('should reject if less than 2 shapes', async () => {
      const args = {
        shapes: [{ type: 'rectangle', color: 'blue' }],
        originX: 100,
        originY: 100,
      };

      const result = await executor.executeCreateShapesHorizontally(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 shapes');
    });

    it('should reject if more than 100 shapes', async () => {
      const shapes = Array(101)
        .fill(null)
        .map(() => ({ type: 'rectangle', color: 'blue' }));

      const args = { shapes, originX: 100, originY: 100 };
      const result = await executor.executeCreateShapesHorizontally(args);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many shapes');
    });

    it('should handle mixed shape types', async () => {
      const args = {
        shapes: [
          { type: 'circle', color: 'blue', radius: 30 },
          { type: 'rectangle', color: 'red', width: 80, height: 40 },
          { type: 'triangle', color: 'green', width: 60, height: 60 },
        ],
        originX: 200,
        originY: 200,
      };

      const result = await executor.executeCreateShapesHorizontally(args);

      expect(result.success).toBe(true);

      const shapesCreated = mockAddShapesBatch.mock.calls[0][0];
      expect(shapesCreated[0].type).toBe('circle');
      expect(shapesCreated[1].type).toBe('rect');
      expect(shapesCreated[2].type).toBe('triangle');

      // All at same Y
      expect(shapesCreated[0].y).toBe(200);
      expect(shapesCreated[1].y).toBe(200);
      expect(shapesCreated[2].y).toBe(200);
    });

    it('should assign IDs to all shapes', async () => {
      const args = {
        shapes: [
          { type: 'rectangle', color: 'blue' },
          { type: 'rectangle', color: 'red' },
          { type: 'rectangle', color: 'green' },
        ],
        originX: 100,
        originY: 100,
      };

      const result = await executor.executeCreateShapesHorizontally(args);

      expect(result.success).toBe(true);

      const shapesCreated = mockAddShapesBatch.mock.calls[0][0];
      const ids = shapesCreated.map(s => s.id);

      // All shapes should have IDs
      expect(ids).toHaveLength(3);
      
      // All IDs should be defined strings
      ids.forEach(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
      });
    });
  });

  describe('Integration with other tools', () => {
    it('should work alongside createShape tool', async () => {
      const mockAddShape = jest.fn().mockResolvedValue(undefined);

      const exec = createAIToolExecutor({
        addShape: mockAddShape,
        addShapesBatch: mockAddShapesBatch,
        updateShape: jest.fn(),
        getShapes: () => [],
        getViewportCenter: () => ({ x: 500, y: 400 }),
      });

      // Create single shape
      await exec.executeCreateShape({
        shapeType: 'circle',
        x: 100,
        y: 100,
        fill: 'blue',
      });

      // Create vertical layout
      await exec.executeCreateShapesVertically({
        shapes: [
          { type: 'rectangle', color: 'red' },
          { type: 'rectangle', color: 'green' },
        ],
        originX: 300,
        originY: 200,
      });

      expect(mockAddShape).toHaveBeenCalledTimes(1);
      expect(mockAddShapesBatch).toHaveBeenCalledTimes(1);
    });
  });
});

