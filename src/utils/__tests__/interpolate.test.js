import { interpolatePosition, isTeleport } from '../interpolate';

describe('interpolate utilities', () => {
  describe('interpolatePosition', () => {
    it('should interpolate between two positions at alpha=0', () => {
      const prev = { x: 0, y: 0 };
      const next = { x: 100, y: 100 };
      const result = interpolatePosition(prev, next, 0);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should interpolate between two positions at alpha=1', () => {
      const prev = { x: 0, y: 0 };
      const next = { x: 100, y: 100 };
      const result = interpolatePosition(prev, next, 1);
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('should interpolate between two positions at alpha=0.5', () => {
      const prev = { x: 0, y: 0 };
      const next = { x: 100, y: 200 };
      const result = interpolatePosition(prev, next, 0.5);
      expect(result).toEqual({ x: 50, y: 100 });
    });

    it('should clamp alpha to [0, 1] range', () => {
      const prev = { x: 0, y: 0 };
      const next = { x: 100, y: 100 };
      
      const resultNegative = interpolatePosition(prev, next, -0.5);
      expect(resultNegative).toEqual({ x: 0, y: 0 });
      
      const resultOver = interpolatePosition(prev, next, 1.5);
      expect(resultOver).toEqual({ x: 100, y: 100 });
    });

    it('should handle null/undefined positions', () => {
      const pos = { x: 50, y: 50 };
      
      expect(interpolatePosition(null, pos, 0.5)).toEqual(pos);
      expect(interpolatePosition(pos, null, 0.5)).toEqual(pos);
      expect(interpolatePosition(null, null, 0.5)).toEqual({ x: 0, y: 0 });
    });
  });

  describe('isTeleport', () => {
    it('should detect large jumps', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 600, y: 0 };
      expect(isTeleport(pos1, pos2, 500)).toBe(true);
    });

    it('should not flag small movements', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 100, y: 100 };
      expect(isTeleport(pos1, pos2, 500)).toBe(false);
    });

    it('should use default threshold of 500', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 400, y: 300 }; // distance = 500
      expect(isTeleport(pos1, pos2)).toBe(false);
      
      const pos3 = { x: 0, y: 0 };
      const pos4 = { x: 400, y: 400 }; // distance ~565
      expect(isTeleport(pos3, pos4)).toBe(true);
    });

    it('should handle null/undefined positions', () => {
      const pos = { x: 50, y: 50 };
      expect(isTeleport(null, pos)).toBe(false);
      expect(isTeleport(pos, null)).toBe(false);
      expect(isTeleport(null, null)).toBe(false);
    });
  });
});

