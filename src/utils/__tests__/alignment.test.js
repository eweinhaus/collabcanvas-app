/**
 * Unit tests for alignment utilities
 * Tests all alignment and distribution functions
 */

import {
  getShapeBounds,
  getSelectionBounds,
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  distributeHorizontally,
  distributeVertically,
  canAlign,
  canDistribute,
} from '../alignment';

describe('alignment utilities', () => {
  describe('getShapeBounds', () => {
    it('calculates bounds for a rectangle', () => {
      const shape = {
        id: 'rect1',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
      };

      const bounds = getShapeBounds(shape);

      expect(bounds).toEqual({
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        centerX: 175,
        centerY: 250,
        originalX: 100,
        originalY: 200,
        originalWidth: 150,
        originalHeight: 100,
      });
    });

    it('calculates bounds for a circle', () => {
      const shape = {
        id: 'circle1',
        type: 'circle',
        x: 100, // Center x
        y: 100, // Center y
        radius: 50,
      };

      const bounds = getShapeBounds(shape);

      expect(bounds).toEqual({
        x: 50, // Top-left x (center - radius)
        y: 50, // Top-left y (center - radius)
        width: 100,
        height: 100,
        centerX: 100,
        centerY: 100,
        originalX: 50,
        originalY: 50,
        originalWidth: 100,
        originalHeight: 100,
      });
    });

    it('calculates bounds for text', () => {
      const shape = {
        id: 'text1',
        type: 'text',
        x: 50,
        y: 75,
        width: 200,
        fontSize: 24,
      };

      const bounds = getShapeBounds(shape);

      expect(bounds.x).toBe(50);
      expect(bounds.y).toBe(75);
      expect(bounds.width).toBe(200);
      expect(bounds.height).toBe(24);
      expect(bounds.centerX).toBe(150);
      expect(bounds.centerY).toBe(87);
    });

    it('calculates bounds for a triangle', () => {
      const shape = {
        id: 'tri1',
        type: 'triangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      };

      const bounds = getShapeBounds(shape);

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(100);
      expect(bounds.width).toBe(100);
      expect(bounds.height).toBe(100);
    });

    it('handles rotated shapes', () => {
      const shape = {
        id: 'rect1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 50,
        rotation: 90, // 90 degrees
      };

      const bounds = getShapeBounds(shape);

      // At 90 degrees, width and height swap
      // Rotated width ≈ original height, rotated height ≈ original width
      expect(bounds.width).toBeCloseTo(50, 1);
      expect(bounds.height).toBeCloseTo(100, 1);
      expect(bounds.centerX).toBe(150); // Original center
      expect(bounds.centerY).toBe(125);
    });

    it('handles shapes with missing dimensions', () => {
      const shape = {
        id: 'incomplete',
        type: 'rectangle',
        x: 50,
        y: 50,
      };

      const bounds = getShapeBounds(shape);

      expect(bounds.width).toBe(100); // Default
      expect(bounds.height).toBe(100); // Default
    });
  });

  describe('getSelectionBounds', () => {
    it('calculates collective bounds for multiple shapes', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 150, y: 50, width: 100, height: 100 },
        { id: '3', type: 'rectangle', x: 50, y: 200, width: 100, height: 100 },
      ];

      const bounds = getSelectionBounds(shapes);

      expect(bounds.x).toBe(0); // Leftmost
      expect(bounds.y).toBe(0); // Topmost
      expect(bounds.width).toBe(250); // 0 to 250
      expect(bounds.height).toBe(300); // 0 to 300
      expect(bounds.centerX).toBe(125);
      expect(bounds.centerY).toBe(150);
    });

    it('returns zero bounds for empty array', () => {
      const bounds = getSelectionBounds([]);

      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        centerX: 0,
        centerY: 0,
      });
    });

    it('handles single shape', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 100, y: 200, width: 50, height: 75 },
      ];

      const bounds = getSelectionBounds(shapes);

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(200);
      expect(bounds.width).toBe(50);
      expect(bounds.height).toBe(75);
    });
  });

  describe('alignLeft', () => {
    it('aligns shapes to the leftmost edge', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 100, y: 50, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 200, y: 150, width: 100, height: 100 },
        { id: '3', type: 'rectangle', x: 50, y: 250, width: 100, height: 100 },
      ];

      const updates = alignLeft(shapes);

      // All shapes should align to x = 50 (the leftmost)
      expect(updates).toEqual([
        { id: '1', x: 50, y: 50 },
        { id: '2', x: 50, y: 150 },
        { id: '3', x: 50, y: 250 },
      ]);
    });

    it('returns empty array for less than 2 shapes', () => {
      expect(alignLeft([])).toEqual([]);
      expect(alignLeft([{ id: '1', x: 0, y: 0 }])).toEqual([]);
    });

    it('handles circles correctly', () => {
      const shapes = [
        { id: '1', type: 'circle', x: 100, y: 100, radius: 50 }, // Bounds: x=50 (center - radius)
        { id: '2', type: 'rectangle', x: 200, y: 200, width: 100, height: 100 },
      ];

      const updates = alignLeft(shapes);

      // Circle bounds start at x=50 (100 - 50), rectangle at x=200
      // Both should align to x = 50 (circle's left edge)
      expect(updates[0].x).toBe(100); // Circle stays (already leftmost at bounds x=50)
      expect(updates[1].x).toBe(50); // Rectangle moves to align its left edge to x=50, so shape.x = 50
    });
  });

  describe('alignCenter', () => {
    it('aligns shapes to horizontal center of selection', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 200, y: 100, width: 100, height: 100 },
      ];

      const updates = alignCenter(shapes);

      // Selection spans x=0 to x=300, center at x=150
      // Shape 1 center: 50, needs to move to 150 → x = 100
      // Shape 2 center: 250, needs to move to 150 → x = 100
      expect(updates).toEqual([
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 100, y: 100 },
      ]);
    });

    it('returns empty array for less than 2 shapes', () => {
      expect(alignCenter([])).toEqual([]);
    });
  });

  describe('alignRight', () => {
    it('aligns shapes to the rightmost edge', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 200, y: 100, width: 100, height: 100 },
        { id: '3', type: 'rectangle', x: 100, y: 200, width: 50, height: 100 },
      ];

      const updates = alignRight(shapes);

      // Rightmost edge is at x=300 (shape 2)
      // Shape 1: move to x=200 (300 - 100)
      // Shape 2: stay at x=200
      // Shape 3: move to x=250 (300 - 50)
      expect(updates).toEqual([
        { id: '1', x: 200, y: 0 },
        { id: '2', x: 200, y: 100 },
        { id: '3', x: 250, y: 200 },
      ]);
    });

    it('returns empty array for less than 2 shapes', () => {
      expect(alignRight([])).toEqual([]);
    });
  });

  describe('alignTop', () => {
    it('aligns shapes to the topmost edge', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 100, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 150, y: 50, width: 100, height: 100 },
        { id: '3', type: 'rectangle', x: 300, y: 200, width: 100, height: 100 },
      ];

      const updates = alignTop(shapes);

      // All shapes should align to y = 50 (the topmost)
      expect(updates).toEqual([
        { id: '1', x: 0, y: 50 },
        { id: '2', x: 150, y: 50 },
        { id: '3', x: 300, y: 50 },
      ]);
    });

    it('returns empty array for less than 2 shapes', () => {
      expect(alignTop([])).toEqual([]);
    });
  });

  describe('alignMiddle', () => {
    it('aligns shapes to vertical center of selection', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 200, y: 200, width: 100, height: 100 },
      ];

      const updates = alignMiddle(shapes);

      // Selection spans y=0 to y=300, center at y=150
      // Shape 1 center: 50, needs to move to 150 → y = 100
      // Shape 2 center: 250, needs to move to 150 → y = 100
      expect(updates).toEqual([
        { id: '1', x: 0, y: 100 },
        { id: '2', x: 200, y: 100 },
      ]);
    });

    it('returns empty array for less than 2 shapes', () => {
      expect(alignMiddle([])).toEqual([]);
    });
  });

  describe('alignBottom', () => {
    it('aligns shapes to the bottommost edge', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 150, y: 200, width: 100, height: 150 },
        { id: '3', type: 'rectangle', x: 300, y: 100, width: 100, height: 50 },
      ];

      const updates = alignBottom(shapes);

      // Bottommost edge is at y=350 (shape 2: y=200 + height=150)
      // Shape 1: move to y=250 (350 - 100)
      // Shape 2: stay at y=200 (350 - 150)
      // Shape 3: move to y=300 (350 - 50)
      expect(updates).toEqual([
        { id: '1', x: 0, y: 250 },
        { id: '2', x: 150, y: 200 },
        { id: '3', x: 300, y: 300 },
      ]);
    });

    it('returns empty array for less than 2 shapes', () => {
      expect(alignBottom([])).toEqual([]);
    });
  });

  describe('distributeHorizontally', () => {
    it('distributes shapes evenly horizontally', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 50, height: 100 },
        { id: '2', type: 'rectangle', x: 100, y: 0, width: 50, height: 100 },
        { id: '3', type: 'rectangle', x: 200, y: 0, width: 50, height: 100 },
      ];

      const updates = distributeHorizontally(shapes);

      // Total span: 0 to 250 (250 units)
      // Total shape width: 150
      // Available space: 100
      // Gap between shapes: 100 / 2 = 50
      // Positions: 0, 100 (50 + 50 gap), 200 (100 + 50 + 50 gap)
      expect(updates[0]).toEqual({ id: '1', x: 0, y: 0 }); // Leftmost stays
      expect(updates[1].x).toBeCloseTo(100, 1);
      expect(updates[2].x).toBeCloseTo(200, 1);
    });

    it('returns empty array for less than 3 shapes', () => {
      expect(distributeHorizontally([])).toEqual([]);
      expect(distributeHorizontally([{ id: '1', x: 0, y: 0 }])).toEqual([]);
      expect(distributeHorizontally([
        { id: '1', x: 0, y: 0 },
        { id: '2', x: 100, y: 0 },
      ])).toEqual([]);
    });

    it('handles shapes with different widths', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 200, y: 0, width: 50, height: 100 },
        { id: '3', type: 'rectangle', x: 400, y: 0, width: 150, height: 100 },
      ];

      const updates = distributeHorizontally(shapes);

      // Total span: 0 to 550
      // Total shape width: 300
      // Available space: 250
      // Gap: 250 / 2 = 125
      expect(updates[0]).toEqual({ id: '1', x: 0, y: 0 }); // Leftmost stays
      expect(updates[1].x).toBeCloseTo(225, 1); // 100 + 125
      expect(updates[2].x).toBeCloseTo(400, 1); // 225 + 50 + 125
    });

    it('sorts shapes by x position before distributing', () => {
      const shapes = [
        { id: '3', type: 'rectangle', x: 400, y: 0, width: 50, height: 100 },
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 50, height: 100 },
        { id: '2', type: 'rectangle', x: 200, y: 0, width: 50, height: 100 },
      ];

      const updates = distributeHorizontally(shapes);

      // Should sort by x first, then distribute
      expect(updates.length).toBe(3);
      expect(updates[0].id).toBe('1'); // Leftmost
      expect(updates[2].id).toBe('3'); // Rightmost
    });
  });

  describe('distributeVertically', () => {
    it('distributes shapes evenly vertically', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 50 },
        { id: '2', type: 'rectangle', x: 0, y: 100, width: 100, height: 50 },
        { id: '3', type: 'rectangle', x: 0, y: 200, width: 100, height: 50 },
      ];

      const updates = distributeVertically(shapes);

      // Total span: 0 to 250 (250 units)
      // Total shape height: 150
      // Available space: 100
      // Gap between shapes: 100 / 2 = 50
      expect(updates[0]).toEqual({ id: '1', x: 0, y: 0 }); // Topmost stays
      expect(updates[1].y).toBeCloseTo(100, 1);
      expect(updates[2].y).toBeCloseTo(200, 1);
    });

    it('returns empty array for less than 3 shapes', () => {
      expect(distributeVertically([])).toEqual([]);
      expect(distributeVertically([{ id: '1', x: 0, y: 0 }])).toEqual([]);
    });

    it('handles shapes with different heights', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 0, y: 200, width: 100, height: 50 },
        { id: '3', type: 'rectangle', x: 0, y: 400, width: 100, height: 150 },
      ];

      const updates = distributeVertically(shapes);

      // Total span: 0 to 550
      // Total shape height: 300
      // Available space: 250
      // Gap: 250 / 2 = 125
      expect(updates[0]).toEqual({ id: '1', x: 0, y: 0 }); // Topmost stays
      expect(updates[1].y).toBeCloseTo(225, 1); // 100 + 125
      expect(updates[2].y).toBeCloseTo(400, 1); // 225 + 50 + 125
    });

    it('sorts shapes by y position before distributing', () => {
      const shapes = [
        { id: '3', type: 'rectangle', x: 0, y: 400, width: 100, height: 50 },
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 50 },
        { id: '2', type: 'rectangle', x: 0, y: 200, width: 100, height: 50 },
      ];

      const updates = distributeVertically(shapes);

      // Should sort by y first, then distribute
      expect(updates.length).toBe(3);
      expect(updates[0].id).toBe('1'); // Topmost
      expect(updates[2].id).toBe('3'); // Bottommost
    });
  });

  describe('canAlign', () => {
    it('returns true for 2 or more shapes', () => {
      expect(canAlign([{}, {}])).toBe(true);
      expect(canAlign([{}, {}, {}])).toBe(true);
    });

    it('returns false for less than 2 shapes', () => {
      expect(canAlign([])).toBe(false);
      expect(canAlign([{}])).toBe(false);
      expect(canAlign(null)).toBe(false);
      expect(canAlign(undefined)).toBe(false);
    });
  });

  describe('canDistribute', () => {
    it('returns true for 3 or more shapes', () => {
      expect(canDistribute([{}, {}, {}])).toBe(true);
      expect(canDistribute([{}, {}, {}, {}])).toBe(true);
    });

    it('returns false for less than 3 shapes', () => {
      expect(canDistribute([])).toBe(false);
      expect(canDistribute([{}])).toBe(false);
      expect(canDistribute([{}, {}])).toBe(false);
      expect(canDistribute(null)).toBe(false);
      expect(canDistribute(undefined)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles negative coordinates', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: -100, y: -100, width: 50, height: 50 },
        { id: '2', type: 'rectangle', x: 0, y: 0, width: 50, height: 50 },
      ];

      const updates = alignLeft(shapes);

      expect(updates[0].x).toBe(-100); // Already leftmost
      expect(updates[1].x).toBe(-100); // Moves to match
    });

    it('handles very large coordinates', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 10000, y: 10000, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 20000, y: 20000, width: 100, height: 100 },
      ];

      const updates = alignLeft(shapes);

      expect(updates[0].x).toBe(10000);
      expect(updates[1].x).toBe(10000);
    });

    it('handles shapes with zero dimensions', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 100, y: 100, width: 0, height: 0 },
        { id: '2', type: 'rectangle', x: 200, y: 200, width: 100, height: 100 },
      ];

      const bounds = getShapeBounds(shapes[0]);
      // If width/height are explicitly 0, they're preserved (not defaulted)
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
      
      // Test that alignment still works with zero dimensions
      const updates = alignLeft(shapes);
      expect(updates.length).toBe(2);
    });

    it('handles mixed shape types in alignment', () => {
      const shapes = [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { id: '2', type: 'circle', x: 200, y: 200, radius: 50 },
        { id: '3', type: 'text', x: 300, y: 300, width: 150, fontSize: 20 },
      ];

      const updates = alignLeft(shapes);

      expect(updates.length).toBe(3);
      // All should align to x = 0 (leftmost)
      expect(updates[0].x).toBe(0);
    });
  });
});

