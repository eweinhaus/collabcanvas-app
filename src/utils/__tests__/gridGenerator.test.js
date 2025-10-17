/**
 * @jest-environment jsdom
 */

import { generateGrid, validateGridConfig } from '../gridGenerator';

describe('gridGenerator', () => {
  describe('generateGrid - Happy Paths', () => {
    test('generates 3x3 grid of red squares with default spacing', () => {
      const result = generateGrid({
        shapeType: 'rectangle',
        rows: 3,
        cols: 3,
        color: 'red'
      });

      expect(result).toHaveLength(9);
      
      // Verify first shape (top-left)
      expect(result[0]).toMatchObject({
        x: 200, // default originX
        y: 200, // default originY
        fill: 'red',
        type: 'rectangle',
        width: 100, // size * 2 (default size = 50)
        height: 75 // size * 1.5
      });

      // Verify last shape (bottom-right)
      expect(result[8]).toMatchObject({
        x: 200 + 2 * 120, // originX + 2 * spacing (default 120)
        y: 200 + 2 * 120,
        fill: 'red',
        type: 'rectangle'
      });

      // All shapes have zIndex
      result.forEach(shape => {
        expect(shape.zIndex).toBeDefined();
        expect(typeof shape.zIndex).toBe('number');
      });
    });

    test('generates 2x5 grid of blue circles at custom position with custom spacing', () => {
      const result = generateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 5,
        color: 'blue',
        originX: 400,
        originY: 300,
        spacing: 150
      });

      expect(result).toHaveLength(10);

      // Verify first shape
      expect(result[0]).toMatchObject({
        x: 400,
        y: 300,
        fill: 'blue',
        type: 'circle',
        radius: 50 // default size
      });

      // Verify shape at position (1, 2) - row 1, col 2
      const shape = result[1 * 5 + 2]; // row * cols + col
      expect(shape).toMatchObject({
        x: 400 + 2 * 150, // originX + col * spacing
        y: 300 + 1 * 150, // originY + row * spacing
        fill: 'blue',
        type: 'circle'
      });
    });

    test('generates 10x10 grid (100 shapes max limit)', () => {
      const result = generateGrid({
        shapeType: 'circle',
        rows: 10,
        cols: 10,
        color: 'green',
        size: 30,
        spacing: 80
      });

      expect(result).toHaveLength(100);

      // Verify all shapes have correct radius
      result.forEach(shape => {
        expect(shape.radius).toBe(30);
        expect(shape.type).toBe('circle');
      });

      // Verify zIndex ordering (should be sequential)
      for (let i = 1; i < result.length; i++) {
        expect(result[i].zIndex).toBeGreaterThan(result[i - 1].zIndex);
      }
    });

    test('generates grid of triangles', () => {
      const result = generateGrid({
        shapeType: 'triangle',
        rows: 2,
        cols: 3,
        color: 'purple',
        size: 60
      });

      expect(result).toHaveLength(6);

      result.forEach(shape => {
        expect(shape.type).toBe('triangle');
        expect(shape.radius).toBe(60);
        expect(shape.fill).toBe('purple');
      });
    });

    test('generates grid of text shapes', () => {
      const result = generateGrid({
        shapeType: 'text',
        rows: 2,
        cols: 2,
        color: 'black',
        text: 'Test Label',
        fontSize: 20,
        size: 40
      });

      expect(result).toHaveLength(4);

      result.forEach(shape => {
        expect(shape.type).toBe('text');
        expect(shape.text).toBe('Test Label');
        expect(shape.fontSize).toBe(20);
        expect(shape.width).toBe(160); // size * 4
        expect(shape.height).toBe(30); // fontSize * 1.5
      });
    });

    test('uses default values correctly', () => {
      const result = generateGrid({
        shapeType: 'circle',
        rows: 1,
        cols: 1,
        color: '#FF0000'
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        x: 200, // default originX
        y: 200, // default originY
        radius: 50, // default size
        fill: '#FF0000',
        type: 'circle'
      });
    });

    test('accepts hex color codes', () => {
      const result = generateGrid({
        shapeType: 'rectangle',
        rows: 1,
        cols: 1,
        color: '#3498db'
      });

      expect(result[0].fill).toBe('#3498db');
    });

    test('handles custom size for each shape type', () => {
      const circleGrid = generateGrid({
        shapeType: 'circle',
        rows: 1,
        cols: 1,
        color: 'red',
        size: 75
      });
      expect(circleGrid[0].radius).toBe(75);

      const rectGrid = generateGrid({
        shapeType: 'rectangle',
        rows: 1,
        cols: 1,
        color: 'blue',
        size: 40
      });
      expect(rectGrid[0].width).toBe(80); // size * 2
      expect(rectGrid[0].height).toBe(60); // size * 1.5
    });
  });

  describe('generateGrid - Validation & Edge Cases', () => {
    test('throws on missing options object', () => {
      expect(() => generateGrid()).toThrow(TypeError);
      expect(() => generateGrid()).toThrow('Options object is required');
    });

    test('throws on invalid options type', () => {
      expect(() => generateGrid('invalid')).toThrow(TypeError);
      expect(() => generateGrid(123)).toThrow(TypeError);
    });

    test('throws on missing required fields', () => {
      expect(() => generateGrid({
        rows: 3,
        cols: 3,
        color: 'red'
        // missing shapeType
      })).toThrow(TypeError);

      expect(() => generateGrid({
        shapeType: 'circle',
        cols: 3,
        color: 'red'
        // missing rows
      })).toThrow(RangeError);

      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 3,
        color: 'red'
        // missing cols
      })).toThrow(RangeError);

      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 3,
        cols: 3
        // missing color
      })).toThrow(TypeError);
    });

    test('throws on invalid shapeType', () => {
      expect(() => generateGrid({
        shapeType: 'pentagon',
        rows: 2,
        cols: 2,
        color: 'red'
      })).toThrow(TypeError);
      expect(() => generateGrid({
        shapeType: 'pentagon',
        rows: 2,
        cols: 2,
        color: 'red'
      })).toThrow('Invalid shapeType');
    });

    test('throws when grid exceeds 100 shapes (15x15 = 225)', () => {
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 15,
        cols: 15,
        color: 'red'
      })).toThrow(RangeError);
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 15,
        cols: 15,
        color: 'red'
      })).toThrow('exceeds limit of 100 shapes');
    });

    test('throws when rows exceeds 20', () => {
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 21,
        cols: 1,
        color: 'red'
      })).toThrow(RangeError);
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 21,
        cols: 1,
        color: 'red'
      })).toThrow('rows cannot exceed 20');
    });

    test('throws when cols exceeds 20', () => {
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 1,
        cols: 21,
        color: 'red'
      })).toThrow(RangeError);
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 1,
        cols: 21,
        color: 'red'
      })).toThrow('cols cannot exceed 20');
    });

    test('throws on zero or negative rows', () => {
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 0,
        cols: 3,
        color: 'red'
      })).toThrow(RangeError);

      expect(() => generateGrid({
        shapeType: 'circle',
        rows: -1,
        cols: 3,
        color: 'red'
      })).toThrow(RangeError);
    });

    test('throws on zero or negative cols', () => {
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 3,
        cols: 0,
        color: 'red'
      })).toThrow(RangeError);

      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 3,
        cols: -2,
        color: 'red'
      })).toThrow(RangeError);
    });

    test('throws on invalid spacing range', () => {
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        spacing: 5 // below min of 10
      })).toThrow(RangeError);
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        spacing: 5
      })).toThrow('spacing must be between 10 and 500');

      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        spacing: 600 // above max of 500
      })).toThrow(RangeError);
    });

    test('throws on invalid size range', () => {
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        size: 5 // below min of 10
      })).toThrow(RangeError);

      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        size: 250 // above max of 200
      })).toThrow(RangeError);
    });

    test('throws on negative origin coordinates', () => {
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        originX: -10,
        originY: 200
      })).toThrow(RangeError);
      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        originX: -10,
        originY: 200
      })).toThrow('origin coordinates cannot be negative');

      expect(() => generateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        originX: 200,
        originY: -50
      })).toThrow(RangeError);
    });

    test('throws when text shape missing text content', () => {
      expect(() => generateGrid({
        shapeType: 'text',
        rows: 2,
        cols: 2,
        color: 'black'
        // missing text property
      })).toThrow(TypeError);
      expect(() => generateGrid({
        shapeType: 'text',
        rows: 2,
        cols: 2,
        color: 'black'
      })).toThrow('text content is required for text shapes');
    });
  });

  describe('generateGrid - Position Calculations', () => {
    test('calculates positions correctly for 3x3 grid', () => {
      const result = generateGrid({
        shapeType: 'circle',
        rows: 3,
        cols: 3,
        color: 'blue',
        originX: 100,
        originY: 100,
        spacing: 100
      });

      // Expected positions (row, col) -> (x, y)
      const expected = [
        { row: 0, col: 0, x: 100, y: 100 },
        { row: 0, col: 1, x: 200, y: 100 },
        { row: 0, col: 2, x: 300, y: 100 },
        { row: 1, col: 0, x: 100, y: 200 },
        { row: 1, col: 1, x: 200, y: 200 },
        { row: 1, col: 2, x: 300, y: 200 },
        { row: 2, col: 0, x: 100, y: 300 },
        { row: 2, col: 1, x: 200, y: 300 },
        { row: 2, col: 2, x: 300, y: 300 }
      ];

      expected.forEach((exp, i) => {
        expect(result[i].x).toBe(exp.x);
        expect(result[i].y).toBe(exp.y);
      });
    });

    test('rounds coordinates to 2 decimal places', () => {
      const result = generateGrid({
        shapeType: 'circle',
        rows: 2,
        cols: 2,
        color: 'red',
        originX: 100.123456,
        originY: 200.987654,
        spacing: 33.333333
      });

      // Check that values are rounded
      result.forEach(shape => {
        const xDecimals = (shape.x.toString().split('.')[1] || '').length;
        const yDecimals = (shape.y.toString().split('.')[1] || '').length;
        expect(xDecimals).toBeLessThanOrEqual(2);
        expect(yDecimals).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('generateGrid - Performance', () => {
    test('generates 100-shape grid in under 2ms', () => {
      const start = performance.now();
      
      generateGrid({
        shapeType: 'circle',
        rows: 10,
        cols: 10,
        color: 'red',
        size: 30,
        spacing: 80
      });

      const duration = performance.now() - start;
      
      // Should be very fast (pure calculation)
      expect(duration).toBeLessThan(2);
    });

    test('handles maximum dimensions efficiently', () => {
      const start = performance.now();
      
      generateGrid({
        shapeType: 'rectangle',
        rows: 20,
        cols: 5,
        color: 'blue',
        spacing: 150,
        size: 60
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(2);
    });
  });

  describe('validateGridConfig', () => {
    test('returns valid for correct configuration', () => {
      const result = validateGridConfig({
        shapeType: 'circle',
        rows: 3,
        cols: 3,
        color: 'red'
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('returns invalid with error message for bad configuration', () => {
      const result = validateGridConfig({
        shapeType: 'circle',
        rows: 15,
        cols: 15,
        color: 'red'
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds limit of 100 shapes');
    });

    test('returns invalid for missing required fields', () => {
      const result = validateGridConfig({
        rows: 3,
        cols: 3,
        color: 'red'
        // missing shapeType
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generateGrid - Snapshot Tests', () => {
    test('snapshot of first and last items in 3x3 grid', () => {
      const result = generateGrid({
        shapeType: 'rectangle',
        rows: 3,
        cols: 3,
        color: '#FF0000',
        originX: 300,
        originY: 200,
        spacing: 120,
        size: 50
      });

      // First item (top-left)
      expect(result[0]).toMatchObject({
        x: 300,
        y: 200,
        fill: '#FF0000',
        type: 'rectangle',
        width: 100,
        height: 75
      });

      // Last item (bottom-right)
      expect(result[8]).toMatchObject({
        x: 540, // 300 + 2 * 120
        y: 440, // 200 + 2 * 120
        fill: '#FF0000',
        type: 'rectangle',
        width: 100,
        height: 75
      });
    });
  });
});

