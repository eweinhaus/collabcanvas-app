/**
 * Tests for shapeIdentification.js
 * Coverage: color families, exact hex, type matching, combos, recency bias, "all X", edge cases
 */

import {
  identifyShape,
  ShapeNotFoundError,
  identifyShapeById,
  identifyShapesByType,
  identifyShapesByColor,
} from '../shapeIdentification';

// Helper to create test shapes
function createTestShape(overrides = {}) {
  return {
    id: `shape-${Math.random()}`,
    type: 'rect',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2,
    draggable: true,
    zIndex: Date.now(),
    ...overrides,
  };
}

describe('shapeIdentification', () => {
  describe('identifyShape - basic functionality', () => {
    test('should identify shape by exact color match', () => {
      const shapes = [
        createTestShape({ fill: '#ff0000', zIndex: 1000 }),
        createTestShape({ fill: '#0000ff', zIndex: 2000 }),
        createTestShape({ fill: '#00ff00', zIndex: 3000 }),
      ];

      const result = identifyShape(shapes, 'red');
      expect(result).toBeTruthy();
      expect(result.fill).toBe('#ff0000');
    });

    test('should identify shape by type', () => {
      const shapes = [
        createTestShape({ type: 'rect', zIndex: 1000 }),
        createTestShape({ type: 'circle', zIndex: 2000 }),
        createTestShape({ type: 'text', zIndex: 3000 }),
      ];

      const result = identifyShape(shapes, 'circle');
      expect(result).toBeTruthy();
      expect(result.type).toBe('circle');
    });

    test('should identify shape by color + type combination', () => {
      const shapes = [
        createTestShape({ type: 'rect', fill: '#ff0000', zIndex: 1000 }),
        createTestShape({ type: 'circle', fill: '#ff0000', zIndex: 2000 }),
        createTestShape({ type: 'rect', fill: '#0000ff', zIndex: 3000 }),
      ];

      const result = identifyShape(shapes, 'red circle');
      expect(result).toBeTruthy();
      expect(result.type).toBe('circle');
      expect(result.fill).toBe('#ff0000');
    });

    test('should return null when no match found (allowPartial: true)', () => {
      const shapes = [
        createTestShape({ fill: '#ff0000', type: 'rect' }),
      ];

      const result = identifyShape(shapes, 'blue triangle');
      expect(result).toBeNull();
    });

    test('should throw error when no match found (allowPartial: false)', () => {
      const shapes = [
        createTestShape({ fill: '#ff0000', type: 'rect' }),
      ];

      expect(() => {
        identifyShape(shapes, 'blue triangle', { allowPartial: false });
      }).toThrow(ShapeNotFoundError);
    });
  });

  describe('identifyShape - color family matching', () => {
    test('should match blue family colors', () => {
      const shapes = [
        createTestShape({ fill: '#0000ff', zIndex: 1000 }), // pure blue
        createTestShape({ fill: '#1e90ff', zIndex: 2000 }), // dodgerblue
        createTestShape({ fill: '#87ceeb', zIndex: 3000 }), // skyblue
        createTestShape({ fill: '#ff0000', zIndex: 4000 }), // red (non-match)
      ];

      const result = identifyShape(shapes, 'blue', { returnMany: true });
      expect(result).toHaveLength(3);
      expect(result.every(s => ['#0000ff', '#1e90ff', '#87ceeb'].includes(s.fill))).toBe(true);
    });

    test('should match red family colors', () => {
      const shapes = [
        createTestShape({ fill: '#ff0000', zIndex: 1000 }), // pure red
        createTestShape({ fill: '#dc143c', zIndex: 2000 }), // crimson
        createTestShape({ fill: '#ff6347', zIndex: 3000 }), // tomato
        createTestShape({ fill: '#0000ff', zIndex: 4000 }), // blue (non-match)
      ];

      const result = identifyShape(shapes, 'red', { returnMany: true });
      expect(result).toHaveLength(3);
      expect(result.every(s => ['#ff0000', '#dc143c', '#ff6347'].includes(s.fill))).toBe(true);
    });

    test('should match green family colors', () => {
      const shapes = [
        createTestShape({ fill: '#008000', zIndex: 1000 }), // green
        createTestShape({ fill: '#00ff00', zIndex: 2000 }), // lime
        createTestShape({ fill: '#90ee90', zIndex: 3000 }), // lightgreen
        createTestShape({ fill: '#ff0000', zIndex: 4000 }), // red (non-match)
      ];

      const result = identifyShape(shapes, 'green', { returnMany: true });
      expect(result).toHaveLength(3);
    });

    test('should match purple family colors', () => {
      const shapes = [
        createTestShape({ fill: '#800080', zIndex: 1000 }), // purple
        createTestShape({ fill: '#9400d3', zIndex: 2000 }), // darkviolet
        createTestShape({ fill: '#ee82ee', zIndex: 3000 }), // violet
      ];

      const result = identifyShape(shapes, 'purple', { returnMany: true });
      expect(result).toHaveLength(3);
    });

    test('should handle both gray and grey spellings', () => {
      const shapes = [
        createTestShape({ fill: '#808080', zIndex: 1000 }),
        createTestShape({ fill: '#a9a9a9', zIndex: 2000 }),
      ];

      const result1 = identifyShape(shapes, 'gray', { returnMany: true });
      const result2 = identifyShape(shapes, 'grey', { returnMany: true });
      
      expect(result1).toHaveLength(2);
      expect(result2).toHaveLength(2);
    });

    test('should match CSS color keywords', () => {
      const shapes = [
        createTestShape({ fill: '#1e90ff', zIndex: 1000 }), // dodgerblue
      ];

      const result = identifyShape(shapes, 'dodgerblue');
      expect(result).toBeTruthy();
      expect(result.fill).toBe('#1e90ff');
    });
  });

  describe('identifyShape - type matching', () => {
    test('should match rectangle alias', () => {
      const shapes = [
        createTestShape({ type: 'rect', zIndex: 1000 }),
      ];

      const result = identifyShape(shapes, 'rectangle');
      expect(result).toBeTruthy();
      expect(result.type).toBe('rect');
    });

    test('should match square as rectangle', () => {
      const shapes = [
        createTestShape({ type: 'rect', width: 100, height: 100, zIndex: 1000 }),
      ];

      const result = identifyShape(shapes, 'square');
      expect(result).toBeTruthy();
      expect(result.type).toBe('rect');
    });

    test('should handle plural types (circles -> circle)', () => {
      const shapes = [
        createTestShape({ type: 'circle', zIndex: 1000 }),
        createTestShape({ type: 'circle', zIndex: 2000 }),
      ];

      const result = identifyShape(shapes, 'circles', { returnMany: true });
      expect(result).toHaveLength(2);
      expect(result.every(s => s.type === 'circle')).toBe(true);
    });

    test('should match triangle type', () => {
      const shapes = [
        createTestShape({ type: 'triangle', zIndex: 1000 }),
      ];

      const result = identifyShape(shapes, 'triangle');
      expect(result).toBeTruthy();
      expect(result.type).toBe('triangle');
    });

    test('should match text type', () => {
      const shapes = [
        createTestShape({ type: 'text', zIndex: 1000 }),
      ];

      const result = identifyShape(shapes, 'text');
      expect(result).toBeTruthy();
      expect(result.type).toBe('text');
    });
  });

  describe('identifyShape - recency bias', () => {
    test('should prefer more recent shape when multiple matches', () => {
      const shapes = [
        createTestShape({ fill: '#ff0000', zIndex: 1000 }), // oldest
        createTestShape({ fill: '#ff0000', zIndex: 2000 }),
        createTestShape({ fill: '#ff0000', zIndex: 3000 }), // newest
      ];

      const result = identifyShape(shapes, 'red');
      expect(result).toBeTruthy();
      expect(result.zIndex).toBe(3000); // Should return newest
    });

    test('should use zIndex as recency proxy', () => {
      const shapes = [
        createTestShape({ type: 'circle', zIndex: 100 }),
        createTestShape({ type: 'circle', zIndex: 500 }),
        createTestShape({ type: 'circle', zIndex: 300 }),
      ];

      const result = identifyShape(shapes, 'circle');
      expect(result.zIndex).toBe(500); // Highest zIndex = most recent
    });

    test('should handle shapes without zIndex gracefully', () => {
      const shapes = [
        { ...createTestShape({ fill: '#0000ff' }), zIndex: undefined }, // Explicitly no zIndex
        createTestShape({ fill: '#0000ff', zIndex: 1000 }),
      ];

      const result = identifyShape(shapes, 'blue');
      expect(result).toBeTruthy();
      expect(result.zIndex).toBe(1000); // Should pick the one with zIndex
    });
  });

  describe('identifyShape - "all X" queries', () => {
    test('should return all matches when "all" keyword present', () => {
      const shapes = [
        createTestShape({ type: 'circle', zIndex: 1000 }),
        createTestShape({ type: 'circle', zIndex: 2000 }),
        createTestShape({ type: 'rect', zIndex: 3000 }),
      ];

      const result = identifyShape(shapes, 'all circles');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result.every(s => s.type === 'circle')).toBe(true);
    });

    test('should return all red shapes', () => {
      const shapes = [
        createTestShape({ fill: '#ff0000', zIndex: 1000 }),
        createTestShape({ fill: '#dc143c', zIndex: 2000 }),
        createTestShape({ fill: '#0000ff', zIndex: 3000 }),
      ];

      const result = identifyShape(shapes, 'all red');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    test('should force returnMany with option', () => {
      const shapes = [
        createTestShape({ type: 'rect', zIndex: 1000 }),
        createTestShape({ type: 'rect', zIndex: 2000 }),
      ];

      const result = identifyShape(shapes, 'rectangle', { returnMany: true });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    test('should return empty array when no matches with returnMany', () => {
      const shapes = [
        createTestShape({ fill: '#ff0000' }),
      ];

      const result = identifyShape(shapes, 'all blue', { returnMany: true });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    test('should sort results by recency (descending)', () => {
      const shapes = [
        createTestShape({ fill: '#0000ff', zIndex: 300 }),
        createTestShape({ fill: '#0000ff', zIndex: 100 }),
        createTestShape({ fill: '#0000ff', zIndex: 500 }),
      ];

      const result = identifyShape(shapes, 'all blue');
      expect(result[0].zIndex).toBe(500);
      expect(result[1].zIndex).toBe(300);
      expect(result[2].zIndex).toBe(100);
    });
  });

  describe('identifyShape - hex color matching', () => {
    test('should match exact hex color', () => {
      const shapes = [
        createTestShape({ fill: '#ff5733', zIndex: 1000 }),
        createTestShape({ fill: '#0000ff', zIndex: 2000 }),
      ];

      const result = identifyShape(shapes, '#ff5733');
      expect(result).toBeTruthy();
      expect(result.fill).toBe('#ff5733');
    });

    test('should handle hex without # prefix', () => {
      const shapes = [
        createTestShape({ fill: '#ff5733', zIndex: 1000 }),
      ];

      const result = identifyShape(shapes, 'ff5733');
      expect(result).toBeTruthy();
      expect(result.fill).toBe('#ff5733');
    });

    test('should match 3-digit hex (expanded to 6-digit)', () => {
      const shapes = [
        createTestShape({ fill: '#ffffff', zIndex: 1000 }),
      ];

      const result = identifyShape(shapes, '#fff');
      expect(result).toBeTruthy();
      expect(result.fill).toBe('#ffffff');
    });

    test('should be case-insensitive for hex', () => {
      const shapes = [
        createTestShape({ fill: '#ff5733', zIndex: 1000 }),
      ];

      const result = identifyShape(shapes, '#FF5733');
      expect(result).toBeTruthy();
      expect(result.fill).toBe('#ff5733');
    });
  });

  describe('identifyShape - combined criteria', () => {
    test('should match "blue rectangle"', () => {
      const shapes = [
        createTestShape({ type: 'rect', fill: '#0000ff', zIndex: 1000 }),
        createTestShape({ type: 'circle', fill: '#0000ff', zIndex: 2000 }),
        createTestShape({ type: 'rect', fill: '#ff0000', zIndex: 3000 }),
      ];

      const result = identifyShape(shapes, 'blue rectangle');
      expect(result).toBeTruthy();
      expect(result.type).toBe('rect');
      expect(result.fill).toBe('#0000ff');
    });

    test('should match "red circle"', () => {
      const shapes = [
        createTestShape({ type: 'circle', fill: '#ff0000', zIndex: 1000 }),
        createTestShape({ type: 'rect', fill: '#ff0000', zIndex: 2000 }),
      ];

      const result = identifyShape(shapes, 'red circle');
      expect(result).toBeTruthy();
      expect(result.type).toBe('circle');
      expect(result.fill).toBe('#ff0000');
    });

    test('should match "all green triangles"', () => {
      const shapes = [
        createTestShape({ type: 'triangle', fill: '#00ff00', zIndex: 1000 }),
        createTestShape({ type: 'triangle', fill: '#90ee90', zIndex: 2000 }),
        createTestShape({ type: 'rect', fill: '#00ff00', zIndex: 3000 }),
      ];

      const result = identifyShape(shapes, 'all green triangles');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result.every(s => s.type === 'triangle')).toBe(true);
    });

    test('should prioritize higher scoring matches', () => {
      const shapes = [
        createTestShape({ type: 'rect', fill: '#0000ff', zIndex: 1000 }), // color + type match
        createTestShape({ type: 'circle', fill: '#0000ff', zIndex: 2000 }), // only color match
      ];

      const result = identifyShape(shapes, 'blue rectangle');
      expect(result.type).toBe('rect');
    });
  });

  describe('identifyShape - edge cases', () => {
    test('should handle empty shapes array', () => {
      const result = identifyShape([], 'red');
      expect(result).toBeNull();
    });

    test('should throw TypeError for non-array shapes', () => {
      expect(() => {
        identifyShape(null, 'red');
      }).toThrow(TypeError);

      expect(() => {
        identifyShape('not an array', 'red');
      }).toThrow(TypeError);
    });

    test('should throw TypeError for non-string descriptor', () => {
      expect(() => {
        identifyShape([], null);
      }).toThrow(TypeError);

      expect(() => {
        identifyShape([], 123);
      }).toThrow(TypeError);
    });

    test('should handle descriptor with only whitespace', () => {
      const shapes = [createTestShape()];
      const result = identifyShape(shapes, '   ');
      expect(result).toBeNull();
    });

    test('should handle descriptor with punctuation', () => {
      const shapes = [
        createTestShape({ type: 'circle', fill: '#ff0000', zIndex: 1000 }),
      ];

      const result = identifyShape(shapes, 'red, circle!');
      expect(result).toBeTruthy();
      expect(result.type).toBe('circle');
    });

    test('should handle unknown color gracefully', () => {
      const shapes = [createTestShape({ fill: '#ff0000' })];
      const result = identifyShape(shapes, 'unknown-color');
      expect(result).toBeNull();
    });

    test('should handle unknown type gracefully', () => {
      const shapes = [createTestShape({ type: 'rect' })];
      const result = identifyShape(shapes, 'unknown-type');
      expect(result).toBeNull();
    });

    test('should handle case-insensitive matching', () => {
      const shapes = [
        createTestShape({ type: 'circle', fill: '#0000ff', zIndex: 1000 }),
      ];

      const result1 = identifyShape(shapes, 'BLUE CIRCLE');
      const result2 = identifyShape(shapes, 'Blue Circle');
      const result3 = identifyShape(shapes, 'blue circle');

      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(result3).toBeTruthy();
    });
  });

  describe('Helper functions', () => {
    test('identifyShapeById should find shape by ID', () => {
      const shapes = [
        createTestShape({ id: 'shape-1' }),
        createTestShape({ id: 'shape-2' }),
      ];

      const result = identifyShapeById(shapes, 'shape-1');
      expect(result).toBeTruthy();
      expect(result.id).toBe('shape-1');
    });

    test('identifyShapeById should return null for non-existent ID', () => {
      const shapes = [createTestShape({ id: 'shape-1' })];
      const result = identifyShapeById(shapes, 'non-existent');
      expect(result).toBeNull();
    });

    test('identifyShapesByType should return all shapes of type', () => {
      const shapes = [
        createTestShape({ type: 'circle' }),
        createTestShape({ type: 'rect' }),
        createTestShape({ type: 'circle' }),
      ];

      const result = identifyShapesByType(shapes, 'circle');
      expect(result).toHaveLength(2);
      expect(result.every(s => s.type === 'circle')).toBe(true);
    });

    test('identifyShapesByColor should return all shapes of color', () => {
      const shapes = [
        createTestShape({ fill: '#ff0000' }),
        createTestShape({ fill: '#0000ff' }),
        createTestShape({ fill: '#dc143c' }), // crimson (red family)
      ];

      const result = identifyShapesByColor(shapes, 'red');
      expect(result).toHaveLength(2);
    });
  });

  describe('Performance tests', () => {
    test('should handle large shape arrays efficiently', () => {
      // Create 1000 shapes
      const shapes = Array.from({ length: 1000 }, (_, i) =>
        createTestShape({
          type: i % 3 === 0 ? 'rect' : i % 3 === 1 ? 'circle' : 'triangle',
          fill: i % 5 === 0 ? '#ff0000' : i % 5 === 1 ? '#0000ff' : i % 5 === 2 ? '#00ff00' : i % 5 === 3 ? '#ffff00' : '#ff00ff',
          zIndex: 1000 + i,
        })
      );

      const start = performance.now();
      
      // Run 100 queries
      for (let i = 0; i < 100; i++) {
        identifyShape(shapes, 'red rectangle');
      }
      
      const end = performance.now();
      const avgTime = (end - start) / 100;

      // Should average < 15ms per query on 1000 shapes (accounts for system load)
      expect(avgTime).toBeLessThan(15);
    });

    test('should handle "all" queries on large arrays efficiently', () => {
      const shapes = Array.from({ length: 500 }, (_, i) =>
        createTestShape({
          type: 'circle',
          fill: '#0000ff',
          zIndex: 1000 + i,
        })
      );

      const start = performance.now();
      const result = identifyShape(shapes, 'all blue circles');
      const end = performance.now();

      expect(result).toHaveLength(500);
      expect(end - start).toBeLessThan(10); // Should complete in < 10ms
    });
  });
});

