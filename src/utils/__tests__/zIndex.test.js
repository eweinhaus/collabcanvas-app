/**
 * Unit tests for zIndex utilities
 */

import {
  getMaxZIndex,
  getMinZIndex,
  calculateBringToFront,
  calculateSendToBack,
  calculateBringForward,
  calculateSendBackward,
  normalizeZIndexes,
  sortShapesByZIndex,
} from '../zIndex';

describe('zIndex utilities', () => {
  const mockShapes = [
    { id: '1', zIndex: 0 },
    { id: '2', zIndex: 1 },
    { id: '3', zIndex: 2 },
    { id: '4', zIndex: 3 },
  ];

  describe('getMaxZIndex', () => {
    it('should return max zIndex from shapes', () => {
      expect(getMaxZIndex(mockShapes)).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(getMaxZIndex([])).toBe(0);
    });

    it('should handle shapes without zIndex', () => {
      const shapes = [{ id: '1' }, { id: '2', zIndex: 5 }];
      expect(getMaxZIndex(shapes)).toBe(5);
    });
  });

  describe('getMinZIndex', () => {
    it('should return min zIndex from shapes', () => {
      expect(getMinZIndex(mockShapes)).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(getMinZIndex([])).toBe(0);
    });

    it('should handle negative zIndex', () => {
      const shapes = [{ id: '1', zIndex: -5 }, { id: '2', zIndex: 10 }];
      expect(getMinZIndex(shapes)).toBe(-5);
    });
  });

  describe('calculateBringToFront', () => {
    it('should return max + 1', () => {
      expect(calculateBringToFront(mockShapes)).toBe(4);
    });

    it('should work with empty array', () => {
      expect(calculateBringToFront([])).toBe(1);
    });
  });

  describe('calculateSendToBack', () => {
    it('should return min - 1', () => {
      expect(calculateSendToBack(mockShapes)).toBe(-1);
    });

    it('should work with empty array', () => {
      expect(calculateSendToBack([])).toBe(-1);
    });
  });

  describe('calculateBringForward', () => {
    it('should swap with next higher shape', () => {
      const result = calculateBringForward('2', mockShapes);
      expect(result).toEqual({
        shapeId: '2',
        newZIndex: 2,
        swapShapeId: '3',
        swapZIndex: 1,
      });
    });

    it('should return null if already at front', () => {
      const result = calculateBringForward('4', mockShapes);
      expect(result).toBeNull();
    });

    it('should return null if shape not found', () => {
      const result = calculateBringForward('999', mockShapes);
      expect(result).toBeNull();
    });
  });

  describe('calculateSendBackward', () => {
    it('should swap with next lower shape', () => {
      const result = calculateSendBackward('3', mockShapes);
      expect(result).toEqual({
        shapeId: '3',
        newZIndex: 1,
        swapShapeId: '2',
        swapZIndex: 2,
      });
    });

    it('should return null if already at back', () => {
      const result = calculateSendBackward('1', mockShapes);
      expect(result).toBeNull();
    });

    it('should return null if shape not found', () => {
      const result = calculateSendBackward('999', mockShapes);
      expect(result).toBeNull();
    });
  });

  describe('normalizeZIndexes', () => {
    it('should assign sequential zIndex values', () => {
      const result = normalizeZIndexes(mockShapes);
      expect(result).toEqual([
        { id: '1', zIndex: 0 },
        { id: '2', zIndex: 1 },
        { id: '3', zIndex: 2 },
        { id: '4', zIndex: 3 },
      ]);
    });

    it('should handle shapes with duplicate zIndex', () => {
      const shapes = [
        { id: '1', zIndex: 0, createdAt: 100 },
        { id: '2', zIndex: 0, createdAt: 200 },
        { id: '3', zIndex: 1, createdAt: 300 },
      ];
      const result = normalizeZIndexes(shapes);
      expect(result).toEqual([
        { id: '1', zIndex: 0 },
        { id: '2', zIndex: 1 },
        { id: '3', zIndex: 2 },
      ]);
    });

    it('should use createdAt as tiebreaker', () => {
      const shapes = [
        { id: '3', zIndex: 5, createdAt: 300 },
        { id: '1', zIndex: 5, createdAt: 100 },
        { id: '2', zIndex: 5, createdAt: 200 },
      ];
      const result = normalizeZIndexes(shapes);
      expect(result[0].id).toBe('1'); // oldest first
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });
  });

  describe('sortShapesByZIndex', () => {
    it('should sort shapes by zIndex ascending', () => {
      const unsorted = [
        { id: '3', zIndex: 2 },
        { id: '1', zIndex: 0 },
        { id: '4', zIndex: 3 },
        { id: '2', zIndex: 1 },
      ];
      const sorted = sortShapesByZIndex(unsorted);
      expect(sorted.map(s => s.id)).toEqual(['1', '2', '3', '4']);
    });

    it('should handle shapes without zIndex', () => {
      const shapes = [
        { id: '2', zIndex: 10 },
        { id: '1' }, // missing zIndex, should be 0
      ];
      const sorted = sortShapesByZIndex(shapes);
      expect(sorted[0].id).toBe('1'); // zIndex 0 comes first
      expect(sorted[1].id).toBe('2'); // zIndex 10 comes second
    });

    it('should not mutate original array', () => {
      const original = [
        { id: '2', zIndex: 1 },
        { id: '1', zIndex: 0 },
      ];
      const sorted = sortShapesByZIndex(original);
      expect(original[0].id).toBe('2'); // original unchanged
      expect(sorted[0].id).toBe('1'); // sorted is different
    });
  });
});

