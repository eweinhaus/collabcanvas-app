/**
 * @jest-environment jsdom
 */

import {
  arrangeHorizontally,
  arrangeVertically,
  distributeEvenly,
  validateArrangement,
  DEFAULT_SPACING
} from '../arrangementAlgorithms';

describe('arrangementAlgorithms', () => {
  // Mock shapes for testing
  const createMockShape = (id, x, y, type = 'circle') => ({
    id,
    x,
    y,
    type,
    fill: '#000000'
  });

  describe('arrangeHorizontally', () => {
    it('should arrange shapes horizontally with default spacing', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 200, 150),
        createMockShape('3', 300, 120)
      ];

      const updates = arrangeHorizontally(shapes);

      expect(updates).toHaveLength(3);
      // Shapes should be sorted by x position
      expect(updates[0].id).toBe('1');
      expect(updates[1].id).toBe('2');
      expect(updates[2].id).toBe('3');
      // Check horizontal spacing
      expect(updates[0].x).toBe(100);
      expect(updates[1].x).toBe(100 + DEFAULT_SPACING);
      expect(updates[2].x).toBe(100 + DEFAULT_SPACING * 2);
      // Check y alignment (should be averaged)
      const avgY = Math.round((100 + 150 + 120) / 3);
      expect(updates[0].y).toBe(avgY);
      expect(updates[1].y).toBe(avgY);
      expect(updates[2].y).toBe(avgY);
    });

    it('should arrange shapes horizontally with custom spacing', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 200, 100)
      ];

      const updates = arrangeHorizontally(shapes, 50);

      expect(updates).toHaveLength(2);
      expect(updates[0].x).toBe(100);
      expect(updates[1].x).toBe(150); // 100 + 50
    });

    it('should handle single shape (no updates)', () => {
      const shapes = [createMockShape('1', 100, 100)];
      const updates = arrangeHorizontally(shapes);
      expect(updates).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const updates = arrangeHorizontally([]);
      expect(updates).toHaveLength(0);
    });

    it('should handle null/undefined', () => {
      expect(arrangeHorizontally(null)).toHaveLength(0);
      expect(arrangeHorizontally(undefined)).toHaveLength(0);
    });

    it('should sort shapes by x position before arranging', () => {
      const shapes = [
        createMockShape('3', 300, 100),
        createMockShape('1', 100, 100),
        createMockShape('2', 200, 100)
      ];

      const updates = arrangeHorizontally(shapes);

      expect(updates[0].id).toBe('1'); // Leftmost
      expect(updates[1].id).toBe('2');
      expect(updates[2].id).toBe('3');
    });

    it('should clamp negative coordinates to 0', () => {
      const shapes = [
        createMockShape('1', -50, -30),
        createMockShape('2', -40, -20)
      ];

      const updates = arrangeHorizontally(shapes);

      // All coordinates should be >= 0
      updates.forEach(update => {
        expect(update.x).toBeGreaterThanOrEqual(0);
        expect(update.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle shapes with identical x positions', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 100, 200),
        createMockShape('3', 100, 150)
      ];

      const updates = arrangeHorizontally(shapes);

      expect(updates).toHaveLength(3);
      expect(updates[0].x).toBe(100);
      expect(updates[1].x).toBe(120);
      expect(updates[2].x).toBe(140);
    });
  });

  describe('arrangeVertically', () => {
    it('should arrange shapes vertically with default spacing', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 150, 200),
        createMockShape('3', 120, 300)
      ];

      const updates = arrangeVertically(shapes);

      expect(updates).toHaveLength(3);
      // Shapes should be sorted by y position
      expect(updates[0].id).toBe('1');
      expect(updates[1].id).toBe('2');
      expect(updates[2].id).toBe('3');
      // Check vertical spacing
      expect(updates[0].y).toBe(100);
      expect(updates[1].y).toBe(100 + DEFAULT_SPACING);
      expect(updates[2].y).toBe(100 + DEFAULT_SPACING * 2);
      // Check x alignment (should be averaged)
      const avgX = Math.round((100 + 150 + 120) / 3);
      expect(updates[0].x).toBe(avgX);
      expect(updates[1].x).toBe(avgX);
      expect(updates[2].x).toBe(avgX);
    });

    it('should arrange shapes vertically with custom spacing', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 100, 200)
      ];

      const updates = arrangeVertically(shapes, 80);

      expect(updates).toHaveLength(2);
      expect(updates[0].y).toBe(100);
      expect(updates[1].y).toBe(180); // 100 + 80
    });

    it('should handle single shape (no updates)', () => {
      const shapes = [createMockShape('1', 100, 100)];
      const updates = arrangeVertically(shapes);
      expect(updates).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const updates = arrangeVertically([]);
      expect(updates).toHaveLength(0);
    });

    it('should sort shapes by y position before arranging', () => {
      const shapes = [
        createMockShape('3', 100, 300),
        createMockShape('1', 100, 100),
        createMockShape('2', 100, 200)
      ];

      const updates = arrangeVertically(shapes);

      expect(updates[0].id).toBe('1'); // Topmost
      expect(updates[1].id).toBe('2');
      expect(updates[2].id).toBe('3');
    });

    it('should clamp negative coordinates to 0', () => {
      const shapes = [
        createMockShape('1', -30, -50),
        createMockShape('2', -20, -40)
      ];

      const updates = arrangeVertically(shapes);

      // All coordinates should be >= 0
      updates.forEach(update => {
        expect(update.x).toBeGreaterThanOrEqual(0);
        expect(update.y).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('distributeEvenly', () => {
    it('should distribute shapes evenly along x-axis', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 150, 100),
        createMockShape('3', 300, 100)
      ];

      const updates = distributeEvenly(shapes, 'x');

      expect(updates).toHaveLength(3);
      // First shape stays at 100
      expect(updates[0].x).toBe(100);
      // Last shape stays at 300
      expect(updates[2].x).toBe(300);
      // Middle shape should be halfway between
      expect(updates[1].x).toBe(200); // (100 + 300) / 2
      // Y positions should be preserved
      expect(updates[0].y).toBe(100);
      expect(updates[1].y).toBe(100);
      expect(updates[2].y).toBe(100);
    });

    it('should distribute shapes evenly along y-axis', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 100, 150),
        createMockShape('3', 100, 400)
      ];

      const updates = distributeEvenly(shapes, 'y');

      expect(updates).toHaveLength(3);
      // First shape stays at 100
      expect(updates[0].y).toBe(100);
      // Last shape stays at 400
      expect(updates[2].y).toBe(400);
      // Middle shape should be halfway between
      expect(updates[1].y).toBe(250); // (100 + 400) / 2
      // X positions should be preserved
      expect(updates[0].x).toBe(100);
      expect(updates[1].x).toBe(100);
      expect(updates[2].x).toBe(100);
    });

    it('should distribute 4 shapes evenly', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 120, 100),
        createMockShape('3', 180, 100),
        createMockShape('4', 400, 100)
      ];

      const updates = distributeEvenly(shapes, 'x');

      expect(updates).toHaveLength(4);
      // First and last stay in place
      expect(updates[0].x).toBe(100);
      expect(updates[3].x).toBe(400);
      // Middle shapes evenly distributed
      // Total distance: 300, gaps: 3, spacing: 100
      expect(updates[1].x).toBe(200); // 100 + 100
      expect(updates[2].x).toBe(300); // 100 + 200
    });

    it('should distribute 5 shapes evenly', () => {
      const shapes = [
        createMockShape('1', 0, 100),
        createMockShape('2', 50, 100),
        createMockShape('3', 100, 100),
        createMockShape('4', 150, 100),
        createMockShape('5', 400, 100)
      ];

      const updates = distributeEvenly(shapes, 'x');

      expect(updates).toHaveLength(5);
      expect(updates[0].x).toBe(0);
      expect(updates[1].x).toBe(100); // 0 + 100
      expect(updates[2].x).toBe(200); // 0 + 200
      expect(updates[3].x).toBe(300); // 0 + 300
      expect(updates[4].x).toBe(400);
    });

    it('should handle 2 shapes (no distribution needed)', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 200, 100)
      ];

      const updates = distributeEvenly(shapes, 'x');

      expect(updates).toHaveLength(0);
    });

    it('should handle single shape', () => {
      const shapes = [createMockShape('1', 100, 100)];
      const updates = distributeEvenly(shapes, 'x');
      expect(updates).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const updates = distributeEvenly([]);
      expect(updates).toHaveLength(0);
    });

    it('should throw error for invalid axis', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 200, 100),
        createMockShape('3', 300, 100)
      ];

      expect(() => distributeEvenly(shapes, 'z')).toThrow('Axis must be "x" or "y"');
      expect(() => distributeEvenly(shapes, '')).toThrow('Axis must be "x" or "y"');
    });

    it('should sort shapes by axis position before distributing', () => {
      const shapes = [
        createMockShape('3', 300, 100),
        createMockShape('1', 100, 100),
        createMockShape('2', 200, 100)
      ];

      const updates = distributeEvenly(shapes, 'x');

      expect(updates[0].id).toBe('1'); // Should be leftmost
      expect(updates[2].id).toBe('3'); // Should be rightmost
    });

    it('should clamp negative coordinates to 0', () => {
      const shapes = [
        createMockShape('1', -50, -30),
        createMockShape('2', 0, 0),
        createMockShape('3', 100, 50)
      ];

      const updates = distributeEvenly(shapes, 'x');

      updates.forEach(update => {
        expect(update.x).toBeGreaterThanOrEqual(0);
        expect(update.y).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('validateArrangement', () => {
    it('should validate valid shape array', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 200, 200)
      ];

      const result = validateArrangement(shapes);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-array input', () => {
      const result = validateArrangement(null);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Shapes must be an array');
    });

    it('should reject empty array for default minCount (2)', () => {
      const result = validateArrangement([]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('At least 2 shapes required');
    });

    it('should reject single shape for default minCount (2)', () => {
      const shapes = [createMockShape('1', 100, 100)];
      const result = validateArrangement(shapes);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('At least 2 shapes required');
    });

    it('should respect custom minCount', () => {
      const shapes = [
        createMockShape('1', 100, 100),
        createMockShape('2', 200, 200)
      ];

      const result = validateArrangement(shapes, 3);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('At least 3 shapes required');
    });

    it('should reject shapes missing required properties', () => {
      const shapes = [
        { id: '1', x: 100 }, // Missing y
        createMockShape('2', 200, 200)
      ];

      const result = validateArrangement(shapes);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have id, x, and y properties');
    });

    it('should reject shapes with non-numeric coordinates', () => {
      const shapes = [
        { id: '1', x: '100', y: 100 }, // x is string
        createMockShape('2', 200, 200)
      ];

      const result = validateArrangement(shapes);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have id, x, and y properties');
    });

    it('should reject shapes missing id', () => {
      const shapes = [
        { x: 100, y: 100 }, // Missing id
        createMockShape('2', 200, 200)
      ];

      const result = validateArrangement(shapes);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have id, x, and y properties');
    });

    it('should accept shapes with extra properties', () => {
      const shapes = [
        { id: '1', x: 100, y: 100, type: 'circle', fill: '#ff0000', radius: 50 },
        { id: '2', x: 200, y: 200, type: 'rectangle', width: 100, height: 80 }
      ];

      const result = validateArrangement(shapes);

      expect(result.valid).toBe(true);
    });
  });

  describe('DEFAULT_SPACING constant', () => {
    it('should have correct default spacing value', () => {
      expect(DEFAULT_SPACING).toBe(20);
    });
  });

  describe('edge cases and performance', () => {
    it('should handle large number of shapes efficiently', () => {
      const shapes = Array.from({ length: 50 }, (_, i) => 
        createMockShape(`shape-${i}`, i * 10, 100)
      );

      const start = Date.now();
      const updates = arrangeHorizontally(shapes, 30);
      const duration = Date.now() - start;

      expect(updates).toHaveLength(50);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should handle shapes with very large coordinates', () => {
      const shapes = [
        createMockShape('1', 10000, 10000),
        createMockShape('2', 20000, 10000)
      ];

      const updates = arrangeHorizontally(shapes);

      expect(updates).toHaveLength(2);
      expect(updates[0].x).toBe(10000);
      expect(updates[1].x).toBe(10020);
    });

    it('should round floating point coordinates', () => {
      const shapes = [
        createMockShape('1', 100.7, 100.3),
        createMockShape('2', 200.9, 150.1),
        createMockShape('3', 300.4, 120.8)
      ];

      const updates = arrangeHorizontally(shapes);

      updates.forEach(update => {
        expect(Number.isInteger(update.x)).toBe(true);
        expect(Number.isInteger(update.y)).toBe(true);
      });
    });
  });
});

