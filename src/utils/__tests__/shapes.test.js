/**
 * Unit tests for shape utilities
 */

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

import {
  SHAPE_TYPES,
  DEFAULT_RECT_SIZE,
  DEFAULT_CIRCLE_RADIUS,
  DEFAULT_TEXT_SIZE,
  createRectangle,
  createCircle,
  createText,
  createShape,
} from '../shapes';

describe('Shape Utilities', () => {
  describe('SHAPE_TYPES', () => {
    it('should define all shape types', () => {
      expect(SHAPE_TYPES.RECT).toBe('rect');
      expect(SHAPE_TYPES.CIRCLE).toBe('circle');
      expect(SHAPE_TYPES.TEXT).toBe('text');
    });
  });

  describe('createRectangle', () => {
    it('should create a rectangle with default properties centered at given position', () => {
      const rect = createRectangle(100, 200);
      
      expect(rect).toHaveProperty('id');
      expect(rect.type).toBe(SHAPE_TYPES.RECT);
      // Rectangle is centered at (100, 200), so top-left is offset by half the dimensions
      expect(rect.x).toBe(50); // 100 - 100/2
      expect(rect.y).toBe(150); // 200 - 100/2
      expect(rect.width).toBe(DEFAULT_RECT_SIZE.width);
      expect(rect.height).toBe(DEFAULT_RECT_SIZE.height);
      expect(rect.fill).toMatch(/^#[0-9A-F]{6}$/i);
      expect(rect.stroke).toBe('#000000');
      expect(rect.strokeWidth).toBe(2);
      expect(rect.draggable).toBe(true);
    });

    it('should accept override properties and center accordingly', () => {
      const rect = createRectangle(100, 200, { width: 150, fill: '#FF0000' });
      
      expect(rect.width).toBe(150);
      expect(rect.fill).toBe('#FF0000');
      expect(rect.x).toBe(25); // 100 - 150/2
      expect(rect.height).toBe(DEFAULT_RECT_SIZE.height); // unchanged
    });

    it('should generate IDs', () => {
      const rect = createRectangle(0, 0);
      
      expect(rect.id).toBeDefined();
      expect(typeof rect.id).toBe('string');
    });
  });

  describe('createCircle', () => {
    it('should create a circle with default properties', () => {
      const circle = createCircle(100, 200);
      
      expect(circle).toHaveProperty('id');
      expect(circle.type).toBe(SHAPE_TYPES.CIRCLE);
      expect(circle.x).toBe(100);
      expect(circle.y).toBe(200);
      expect(circle.radius).toBe(DEFAULT_CIRCLE_RADIUS);
      expect(circle.fill).toMatch(/^#[0-9A-F]{6}$/i);
      expect(circle.stroke).toBe('#000000');
      expect(circle.strokeWidth).toBe(2);
      expect(circle.draggable).toBe(true);
    });

    it('should accept override properties', () => {
      const circle = createCircle(100, 200, { radius: 75, fill: '#00FF00' });
      
      expect(circle.radius).toBe(75);
      expect(circle.fill).toBe('#00FF00');
    });

    it('should generate IDs', () => {
      const circle = createCircle(0, 0);
      
      expect(circle.id).toBeDefined();
      expect(typeof circle.id).toBe('string');
    });
  });

  describe('createText', () => {
    it('should create a text shape with default properties centered at given position', () => {
      const text = createText(100, 200);
      
      expect(text).toHaveProperty('id');
      expect(text.type).toBe(SHAPE_TYPES.TEXT);
      // Text is centered at (100, 200) with estimated positioning
      // Default text "Double-click to edit" (20 chars including spaces), fontSize 16
      // Estimated width: 20 * 16 * 0.6 = 192, so x = 100 - 96 = 4
      // y offset: 200 - 16/2 = 192
      expect(text.x).toBe(4);
      expect(text.y).toBe(192);
      expect(text.text).toBe('Double-click to edit');
      expect(text.fontSize).toBe(DEFAULT_TEXT_SIZE);
      expect(text.fill).toBe('#000000');
      expect(text.draggable).toBe(true);
    });

    it('should accept custom text content and center accordingly', () => {
      const text = createText(100, 200, 'Hello World');
      
      expect(text.text).toBe('Hello World');
      // "Hello World" (11 chars), fontSize 16
      // Estimated width: 11 * 16 * 0.6 = 105.6, so x = 100 - 52.8 = 47.2
      expect(text.x).toBeCloseTo(47.2, 1);
    });

    it('should accept override properties', () => {
      const text = createText(100, 200, 'Test', { fontSize: 24, fill: '#0000FF' });
      
      expect(text.text).toBe('Test');
      expect(text.fontSize).toBe(24);
      expect(text.fill).toBe('#0000FF');
    });

    it('should generate IDs', () => {
      const text = createText(0, 0);
      
      expect(text.id).toBeDefined();
      expect(typeof text.id).toBe('string');
    });
  });

  describe('createShape', () => {
    it('should create a rectangle when type is rect', () => {
      const shape = createShape(SHAPE_TYPES.RECT, 100, 200);
      
      expect(shape.type).toBe(SHAPE_TYPES.RECT);
      // Rectangle is centered, so position is offset
      expect(shape.x).toBe(50); // 100 - 100/2
      expect(shape.y).toBe(150); // 200 - 100/2
      expect(shape.width).toBeDefined();
    });

    it('should create a circle when type is circle', () => {
      const shape = createShape(SHAPE_TYPES.CIRCLE, 100, 200);
      
      expect(shape.type).toBe(SHAPE_TYPES.CIRCLE);
      expect(shape.radius).toBeDefined();
    });

    it('should create a text when type is text', () => {
      const shape = createShape(SHAPE_TYPES.TEXT, 100, 200);
      
      expect(shape.type).toBe(SHAPE_TYPES.TEXT);
      expect(shape.text).toBeDefined();
    });

    it('should throw error for unknown shape type', () => {
      expect(() => createShape('unknown', 100, 200)).toThrow('Unknown shape type: unknown');
    });

    it('should pass overrides to the shape creator', () => {
      const shape = createShape(SHAPE_TYPES.RECT, 100, 200, { fill: '#ABCDEF' });
      
      expect(shape.fill).toBe('#ABCDEF');
    });
  });
});

