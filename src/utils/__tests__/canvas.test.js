/**
 * Unit tests for canvas utility functions (zoom and pan)
 */

import {
  MIN_SCALE,
  MAX_SCALE,
  ZOOM_SPEED,
  constrainScale,
  calculateNewScale,
  calculateZoomPosition,
} from '../canvas';

describe('Canvas Utilities', () => {
  describe('Constants', () => {
    it('should have valid zoom constraints', () => {
      expect(MIN_SCALE).toBe(0.1);
      expect(MAX_SCALE).toBe(3.0);
      expect(ZOOM_SPEED).toBe(0.1);
    });
  });

  describe('constrainScale', () => {
    it('should return the same value if within bounds', () => {
      expect(constrainScale(1.0)).toBe(1.0);
      expect(constrainScale(0.5)).toBe(0.5);
      expect(constrainScale(2.0)).toBe(2.0);
    });

    it('should constrain to MIN_SCALE if below minimum', () => {
      expect(constrainScale(0.05)).toBe(MIN_SCALE);
      expect(constrainScale(0)).toBe(MIN_SCALE);
      expect(constrainScale(-1)).toBe(MIN_SCALE);
    });

    it('should constrain to MAX_SCALE if above maximum', () => {
      expect(constrainScale(5.0)).toBe(MAX_SCALE);
      expect(constrainScale(10.0)).toBe(MAX_SCALE);
    });

    it('should handle edge cases', () => {
      expect(constrainScale(MIN_SCALE)).toBe(MIN_SCALE);
      expect(constrainScale(MAX_SCALE)).toBe(MAX_SCALE);
    });
  });

  describe('calculateNewScale', () => {
    it('should increase scale when scrolling up (negative deltaY)', () => {
      const currentScale = 1.0;
      const newScale = calculateNewScale(currentScale, -1);
      
      expect(newScale).toBeGreaterThan(currentScale);
    });

    it('should decrease scale when scrolling down (positive deltaY)', () => {
      const currentScale = 1.0;
      const newScale = calculateNewScale(currentScale, 1);
      
      expect(newScale).toBeLessThan(currentScale);
    });

    it('should respect minimum scale constraint', () => {
      const currentScale = 0.15;
      const newScale = calculateNewScale(currentScale, 1); // zoom out
      
      expect(newScale).toBeGreaterThanOrEqual(MIN_SCALE);
    });

    it('should respect maximum scale constraint', () => {
      const currentScale = 2.9;
      const newScale = calculateNewScale(currentScale, -1); // zoom in
      
      expect(newScale).toBeLessThanOrEqual(MAX_SCALE);
    });

    it('should calculate correct zoom factor', () => {
      const currentScale = 1.0;
      const zoomInScale = calculateNewScale(currentScale, -1);
      const zoomOutScale = calculateNewScale(currentScale, 1);
      
      expect(zoomInScale).toBeCloseTo(1.1, 5); // 1 + ZOOM_SPEED
      expect(zoomOutScale).toBeCloseTo(0.9, 5); // 1 - ZOOM_SPEED
    });
  });

  describe('calculateZoomPosition', () => {
    it('should calculate correct position for zoom towards cursor', () => {
      const mockStage = {
        x: () => 0,
        y: () => 0,
      };
      
      const oldScale = 1.0;
      const newScale = 2.0;
      const pointerPosition = { x: 400, y: 300 };
      
      const newPosition = calculateZoomPosition(mockStage, oldScale, newScale, pointerPosition);
      
      expect(newPosition).toHaveProperty('x');
      expect(newPosition).toHaveProperty('y');
      expect(typeof newPosition.x).toBe('number');
      expect(typeof newPosition.y).toBe('number');
    });

    it('should keep pointer position fixed during zoom', () => {
      const mockStage = {
        x: () => 100,
        y: () => 50,
      };
      
      const oldScale = 1.0;
      const newScale = 2.0;
      const pointerPosition = { x: 500, y: 400 };
      
      const newPosition = calculateZoomPosition(mockStage, oldScale, newScale, pointerPosition);
      
      // The math should result in pointer staying at same world position
      // mousePointTo.x = (500 - 100) / 1.0 = 400
      // newPosition.x = 500 - 400 * 2.0 = -300
      // mousePointTo.y = (400 - 50) / 1.0 = 350
      // newPosition.y = 400 - 350 * 2.0 = -300
      expect(newPosition.x).toBe(-300);
      expect(newPosition.y).toBe(-300);
    });

    it('should handle zoom out correctly', () => {
      const mockStage = {
        x: () => 0,
        y: () => 0,
      };
      
      const oldScale = 2.0;
      const newScale = 1.0;
      const pointerPosition = { x: 400, y: 300 };
      
      const newPosition = calculateZoomPosition(mockStage, oldScale, newScale, pointerPosition);
      
      expect(newPosition.x).toBe(200);
      expect(newPosition.y).toBe(150);
    });

    it('should handle stage offset correctly', () => {
      const mockStage = {
        x: () => -100,
        y: () => -50,
      };
      
      const oldScale = 1.0;
      const newScale = 1.5;
      const pointerPosition = { x: 300, y: 200 };
      
      const newPosition = calculateZoomPosition(mockStage, oldScale, newScale, pointerPosition);
      
      // mousePointTo.x = (300 - (-100)) / 1.0 = 400
      // newPosition.x = 300 - 400 * 1.5 = -300
      expect(newPosition.x).toBe(-300);
      expect(newPosition.y).toBe(-175);
    });
  });
});

