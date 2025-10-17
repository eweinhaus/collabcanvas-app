/**
 * Tests for Batch Create Utilities
 * Tests normalization, positioning, and validation for complex command layouts
 */

import {
  normalizeShapeSpec,
  getShapeSize,
  calcVerticalPositions,
  calcHorizontalPositions,
  convertToShapeObjects,
  validateShapeBatch,
} from '../batchCreate';

describe('normalizeShapeSpec', () => {
  describe('Basic validation', () => {
    it('should throw error if type is missing', () => {
      expect(() => normalizeShapeSpec({ color: '#FF0000' })).toThrow('requires a type');
    });

    it('should throw error if color is missing', () => {
      expect(() => normalizeShapeSpec({ type: 'rectangle' })).toThrow('requires a color');
    });

    it('should throw error for invalid shape type', () => {
      expect(() => normalizeShapeSpec({ type: 'pentagon', color: '#FF0000' })).toThrow(
        'Invalid shape type'
      );
    });
  });

  describe('Rectangle normalization', () => {
    it('should normalize rectangle with defaults', () => {
      const result = normalizeShapeSpec({ type: 'rectangle', color: '#FF0000' });
      expect(result.type).toBe('rectangle');
      expect(result.fill).toBe('#ff0000'); // normalized hex
      expect(result.width).toBe(150); // default
      expect(result.height).toBe(100); // default
      expect(result.stroke).toBe('#000000');
      expect(result.strokeWidth).toBe(2);
    });

    it('should use provided width and height', () => {
      const result = normalizeShapeSpec({
        type: 'rectangle',
        color: 'blue',
        width: 200,
        height: 150,
      });
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });

    it('should clamp dimensions to valid range', () => {
      const result = normalizeShapeSpec({
        type: 'rectangle',
        color: 'red',
        width: 5, // below min (10)
        height: 600, // above max (500)
      });
      expect(result.width).toBe(10); // clamped to min
      expect(result.height).toBe(500); // clamped to max
    });

    it('should handle square type with equal sides', () => {
      const result = normalizeShapeSpec({
        type: 'square',
        color: 'green',
        width: 120,
        height: 80,
      });
      expect(result.type).toBe('rectangle');
      expect(result.width).toBe(120); // uses larger value
      expect(result.height).toBe(120); // matches width
    });

    it('should accept rect as alias for rectangle', () => {
      const result = normalizeShapeSpec({ type: 'rect', color: '#FF0000' });
      expect(result.type).toBe('rectangle');
    });
  });

  describe('Circle normalization', () => {
    it('should normalize circle with default radius', () => {
      const result = normalizeShapeSpec({ type: 'circle', color: '#0000FF' });
      expect(result.type).toBe('circle');
      expect(result.radius).toBe(50); // default
    });

    it('should use provided radius', () => {
      const result = normalizeShapeSpec({ type: 'circle', color: 'red', radius: 75 });
      expect(result.radius).toBe(75);
    });

    it('should clamp radius to valid range', () => {
      const smallResult = normalizeShapeSpec({ type: 'circle', color: 'blue', radius: 5 });
      expect(smallResult.radius).toBe(10); // clamped to min

      const largeResult = normalizeShapeSpec({ type: 'circle', color: 'blue', radius: 600 });
      expect(largeResult.radius).toBe(500); // clamped to max
    });
  });

  describe('Triangle normalization', () => {
    it('should normalize triangle with defaults', () => {
      const result = normalizeShapeSpec({ type: 'triangle', color: '#FF00FF' });
      expect(result.type).toBe('triangle');
      expect(result.width).toBe(100); // default
      expect(result.height).toBe(100); // default
    });

    it('should use provided dimensions', () => {
      const result = normalizeShapeSpec({
        type: 'triangle',
        color: 'purple',
        width: 120,
        height: 150,
      });
      expect(result.width).toBe(120);
      expect(result.height).toBe(150);
    });
  });

  describe('Text normalization', () => {
    it('should throw error if text content is missing', () => {
      expect(() => normalizeShapeSpec({ type: 'text', color: '#000000' })).toThrow(
        'requires text content'
      );
    });

    it('should normalize text with defaults', () => {
      const result = normalizeShapeSpec({
        type: 'text',
        color: '#000000',
        text: 'Hello World',
      });
      expect(result.type).toBe('text');
      expect(result.text).toBe('Hello World');
      expect(result.fontSize).toBe(16); // default
      expect(result.width).toBe(200); // default
      expect(result.height).toBe(30); // default
    });

    it('should use provided fontSize', () => {
      const result = normalizeShapeSpec({
        type: 'text',
        color: 'black',
        text: 'Test',
        fontSize: 24,
      });
      expect(result.fontSize).toBe(24);
    });

    it('should clamp fontSize to valid range', () => {
      const smallResult = normalizeShapeSpec({
        type: 'text',
        color: 'black',
        text: 'Test',
        fontSize: 5,
      });
      expect(smallResult.fontSize).toBe(8); // clamped to min

      const largeResult = normalizeShapeSpec({
        type: 'text',
        color: 'black',
        text: 'Test',
        fontSize: 100,
      });
      expect(largeResult.fontSize).toBe(72); // clamped to max
    });
  });

  describe('Color normalization', () => {
    it('should normalize CSS color names', () => {
      const result = normalizeShapeSpec({ type: 'circle', color: 'red' });
      expect(result.fill).toBe('#ff0000'); // normalized to hex
    });

    it('should normalize hex colors', () => {
      const result = normalizeShapeSpec({ type: 'circle', color: '#FF5733' });
      expect(result.fill).toBe('#ff5733'); // normalized to lowercase
    });

    it('should throw error for invalid color', () => {
      expect(() => normalizeShapeSpec({ type: 'circle', color: 'notacolor' })).toThrow(
        'Invalid color'
      );
    });
  });

  describe('Stroke properties', () => {
    it('should use default stroke if not provided', () => {
      const result = normalizeShapeSpec({ type: 'rectangle', color: 'blue' });
      expect(result.stroke).toBe('#000000');
      expect(result.strokeWidth).toBe(2);
    });

    it('should normalize provided stroke color', () => {
      const result = normalizeShapeSpec({
        type: 'rectangle',
        color: 'blue',
        stroke: 'red',
        strokeWidth: 3,
      });
      expect(result.stroke).toBe('#ff0000');
      expect(result.strokeWidth).toBe(3);
    });

    it('should use default stroke for invalid stroke color', () => {
      const result = normalizeShapeSpec({
        type: 'rectangle',
        color: 'blue',
        stroke: 'invalidcolor',
      });
      expect(result.stroke).toBe('#000000'); // fallback to black
    });

    it('should clamp strokeWidth to valid range', () => {
      const result = normalizeShapeSpec({
        type: 'rectangle',
        color: 'blue',
        strokeWidth: 15,
      });
      expect(result.strokeWidth).toBe(10); // clamped to max
    });
  });
});

describe('getShapeSize', () => {
  it('should return correct size for rectangle', () => {
    const shape = { type: 'rectangle', width: 200, height: 150 };
    const size = getShapeSize(shape);
    expect(size).toEqual({ width: 200, height: 150 });
  });

  it('should return correct size for circle', () => {
    const shape = { type: 'circle', radius: 50 };
    const size = getShapeSize(shape);
    expect(size).toEqual({ width: 100, height: 100 }); // diameter
  });

  it('should return correct size for triangle', () => {
    const shape = { type: 'triangle', width: 120, height: 140 };
    const size = getShapeSize(shape);
    expect(size).toEqual({ width: 120, height: 140 });
  });

  it('should return correct size for text', () => {
    const shape = { type: 'text', width: 200, height: 30 };
    const size = getShapeSize(shape);
    expect(size).toEqual({ width: 200, height: 30 });
  });

  it('should return default size for unknown type', () => {
    const shape = { type: 'unknown' };
    const size = getShapeSize(shape);
    expect(size).toEqual({ width: 100, height: 100 });
  });
});

describe('calcVerticalPositions', () => {
  it('should calculate vertical positions with default spacing', () => {
    const shapes = [
      { type: 'rectangle', fill: '#FF0000', width: 100, height: 50 },
      { type: 'rectangle', fill: '#00FF00', width: 100, height: 60 },
      { type: 'rectangle', fill: '#0000FF', width: 100, height: 40 },
    ];

    const result = calcVerticalPositions(shapes, {
      originX: 300,
      originY: 200,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ x: 300, y: 200 });
    expect(result[1]).toMatchObject({ x: 300, y: 275 }); // 200 + 50 (height) + 25 (spacing)
    expect(result[2]).toMatchObject({ x: 300, y: 360 }); // 275 + 60 + 25
  });

  it('should use custom spacing', () => {
    const shapes = [
      { type: 'rectangle', fill: '#FF0000', width: 100, height: 50 },
      { type: 'rectangle', fill: '#00FF00', width: 100, height: 50 },
    ];

    const result = calcVerticalPositions(shapes, {
      originX: 100,
      originY: 100,
      spacing: 40,
    });

    expect(result[0]).toMatchObject({ x: 100, y: 100 });
    expect(result[1]).toMatchObject({ x: 100, y: 190 }); // 100 + 50 + 40
  });

  it('should clamp spacing to valid range', () => {
    const shapes = [
      { type: 'rectangle', fill: '#FF0000', width: 100, height: 50 },
      { type: 'rectangle', fill: '#00FF00', width: 100, height: 50 },
    ];

    const result = calcVerticalPositions(shapes, {
      originX: 100,
      originY: 100,
      spacing: 1000, // above max (500)
    });

    expect(result[1].y).toBe(650); // 100 + 50 + 500 (clamped to max 500)
  });
});

describe('calcHorizontalPositions', () => {
  it('should calculate horizontal positions with default spacing', () => {
    const shapes = [
      { type: 'rectangle', fill: '#FF0000', width: 80, height: 40 },
      { type: 'rectangle', fill: '#00FF00', width: 90, height: 40 },
      { type: 'rectangle', fill: '#0000FF', width: 70, height: 40 },
    ];

    const result = calcHorizontalPositions(shapes, {
      originX: 300,
      originY: 100,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ x: 300, y: 100 });
    expect(result[1]).toMatchObject({ x: 400, y: 100 }); // 300 + 80 (width) + 20 (spacing)
    expect(result[2]).toMatchObject({ x: 510, y: 100 }); // 400 + 90 + 20
  });

  it('should use custom spacing', () => {
    const shapes = [
      { type: 'rectangle', fill: '#FF0000', width: 100, height: 40 },
      { type: 'rectangle', fill: '#00FF00', width: 100, height: 40 },
    ];

    const result = calcHorizontalPositions(shapes, {
      originX: 200,
      originY: 150,
      spacing: 50,
    });

    expect(result[0]).toMatchObject({ x: 200, y: 150 });
    expect(result[1]).toMatchObject({ x: 350, y: 150 }); // 200 + 100 + 50
  });

  it('should keep all shapes at same Y position', () => {
    const shapes = [
      { type: 'rectangle', fill: '#FF0000', width: 50, height: 30 },
      { type: 'rectangle', fill: '#00FF00', width: 60, height: 50 }, // different height
      { type: 'rectangle', fill: '#0000FF', width: 70, height: 20 },
    ];

    const result = calcHorizontalPositions(shapes, {
      originX: 100,
      originY: 200,
    });

    // All shapes should have same Y coordinate
    expect(result[0].y).toBe(200);
    expect(result[1].y).toBe(200);
    expect(result[2].y).toBe(200);
  });
});

describe('convertToShapeObjects', () => {
  it('should convert shape configs to full shape objects', () => {
    const configs = [
      { type: 'rectangle', x: 100, y: 200, fill: '#FF0000', width: 150, height: 100, stroke: '#000000', strokeWidth: 2 },
      { type: 'circle', x: 300, y: 200, fill: '#0000FF', radius: 50, stroke: '#000000', strokeWidth: 2 },
    ];

    const result = convertToShapeObjects(configs);

    expect(result).toHaveLength(2);
    
    // Check first shape
    expect(result[0]).toMatchObject({
      type: 'rect', // internal type constant
      x: 100,
      y: 200,
      fill: '#FF0000',
      width: 150,
      height: 100,
      stroke: '#000000',
      strokeWidth: 2,
      draggable: true,
      createdBy: 'AI',
    });
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('zIndex');

    // Check second shape
    expect(result[1]).toMatchObject({
      type: 'circle',
      x: 300,
      y: 200,
      fill: '#0000FF',
      radius: 50,
      draggable: true,
      createdBy: 'AI',
    });
    expect(result[1]).toHaveProperty('id');
    expect(result[1]).toHaveProperty('zIndex');
  });

  it('should assign increasing zIndex values', () => {
    const configs = [
      { type: 'rectangle', x: 100, y: 100, fill: '#FF0000', width: 100, height: 100, stroke: '#000000', strokeWidth: 2 },
      { type: 'rectangle', x: 200, y: 100, fill: '#00FF00', width: 100, height: 100, stroke: '#000000', strokeWidth: 2 },
      { type: 'rectangle', x: 300, y: 100, fill: '#0000FF', width: 100, height: 100, stroke: '#000000', strokeWidth: 2 },
    ];

    const result = convertToShapeObjects(configs);

    // zIndex values should increase
    expect(result[0].zIndex).toBeLessThan(result[1].zIndex);
    expect(result[1].zIndex).toBeLessThan(result[2].zIndex);
  });

  it('should handle text shapes with fontSize', () => {
    const configs = [
      { type: 'text', x: 100, y: 100, fill: '#000000', text: 'Hello', fontSize: 20, width: 200, height: 30, stroke: '#000000', strokeWidth: 2 },
    ];

    const result = convertToShapeObjects(configs);

    expect(result[0]).toMatchObject({
      type: 'text',
      text: 'Hello',
      fontSize: 20,
      width: 200,
      height: 30,
    });
  });

  it('should generate IDs for each shape', () => {
    const configs = [
      { type: 'rectangle', x: 100, y: 100, fill: '#FF0000', width: 100, height: 100, stroke: '#000000', strokeWidth: 2 },
      { type: 'rectangle', x: 200, y: 100, fill: '#00FF00', width: 100, height: 100, stroke: '#000000', strokeWidth: 2 },
    ];

    const result = convertToShapeObjects(configs);

    // In tests, uuid is mocked to return consistent values
    expect(result[0].id).toBeDefined();
    expect(result[1].id).toBeDefined();
    expect(typeof result[0].id).toBe('string');
    expect(typeof result[1].id).toBe('string');
  });
});

describe('validateShapeBatch', () => {
  it('should validate empty array', () => {
    const result = validateShapeBatch([]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No shapes provided');
  });

  it('should validate non-array input', () => {
    const result = validateShapeBatch(null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No shapes provided');
  });

  it('should reject batch with too many shapes', () => {
    const shapes = Array(101).fill({
      id: 'test',
      type: 'rect',
      x: 100,
      y: 100,
      fill: '#FF0000',
    });

    const result = validateShapeBatch(shapes);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Too many shapes');
    expect(result.error).toContain('101');
  });

  it('should accept valid batch with 100 shapes', () => {
    const shapes = Array(100).fill({
      id: 'test',
      type: 'rect',
      x: 100,
      y: 100,
      fill: '#FF0000',
    });

    const result = validateShapeBatch(shapes);
    expect(result.valid).toBe(true);
  });

  it('should reject shape missing required properties', () => {
    const shapes = [
      { id: '1', type: 'rect', x: 100, y: 100, fill: '#FF0000' },
      { id: '2', type: 'rect', x: 200 }, // missing y and fill
    ];

    const result = validateShapeBatch(shapes);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('index 1');
    expect(result.error).toContain('missing required properties');
  });

  it('should accept valid batch of shapes', () => {
    const shapes = [
      { id: '1', type: 'rect', x: 100, y: 100, fill: '#FF0000', width: 100, height: 100 },
      { id: '2', type: 'circle', x: 300, y: 100, fill: '#0000FF', radius: 50 },
      { id: '3', type: 'text', x: 500, y: 100, fill: '#000000', text: 'Hello', width: 200, height: 30 },
    ];

    const result = validateShapeBatch(shapes);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

