/**
 * Tests for Grid Generator Utility
 */

// Mock uuid module (used by shapes.js)
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

import {
  generateGrid,
  generateGridPositions,
  validateGridParams,
  calculateGridDimensions,
  DEFAULT_GRID_CONFIG,
} from '../gridGenerator';
import { SHAPE_TYPES } from '../shapes';

describe('gridGenerator', () => {
  describe('validateGridParams', () => {
    it('validates correct parameters', () => {
      const params = {
        rows: 3,
        cols: 3,
        spacing: 100,
        originX: 200,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('rejects non-integer rows', () => {
      const params = {
        rows: 3.5,
        cols: 3,
        spacing: 100,
        originX: 200,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Rows must be an integer');
    });

    it('rejects rows out of range', () => {
      const params = {
        rows: 25,
        cols: 3,
        spacing: 100,
        originX: 200,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Rows must be between 1 and 20');
    });

    it('rejects rows less than 1', () => {
      const params = {
        rows: 0,
        cols: 3,
        spacing: 100,
        originX: 200,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Rows must be between 1 and 20');
    });

    it('rejects non-integer cols', () => {
      const params = {
        rows: 3,
        cols: 4.2,
        spacing: 100,
        originX: 200,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cols must be an integer');
    });

    it('rejects cols out of range', () => {
      const params = {
        rows: 3,
        cols: 30,
        spacing: 100,
        originX: 200,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cols must be between 1 and 20');
    });

    it('rejects spacing out of range (too small)', () => {
      const params = {
        rows: 3,
        cols: 3,
        spacing: 5,
        originX: 200,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Spacing must be between 10 and 500 pixels');
    });

    it('rejects spacing out of range (too large)', () => {
      const params = {
        rows: 3,
        cols: 3,
        spacing: 600,
        originX: 200,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Spacing must be between 10 and 500 pixels');
    });

    it('allows negative originX (off-canvas positioning)', () => {
      const params = {
        rows: 3,
        cols: 3,
        spacing: 100,
        originX: -10,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('allows negative originY (off-canvas positioning)', () => {
      const params = {
        rows: 3,
        cols: 3,
        spacing: 100,
        originX: 200,
        originY: -50,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('rejects grids with too many shapes', () => {
      const params = {
        rows: 20,
        cols: 20,
        spacing: 100,
        originX: 200,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Grid cannot exceed 100 shapes (rows × cols ≤ 100)');
    });

    it('accepts grid with exactly 100 shapes', () => {
      const params = {
        rows: 10,
        cols: 10,
        spacing: 100,
        originX: 200,
        originY: 200,
      };
      const result = validateGridParams(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('generateGridPositions', () => {
    it('generates correct positions for a 3x3 grid', () => {
      const config = {
        rows: 3,
        cols: 3,
        spacing: 100,
        originX: 200,
        originY: 200,
      };
      const positions = generateGridPositions(config);
      
      expect(positions).toHaveLength(9);
      
      // Check first position (top-left)
      expect(positions[0]).toEqual({ x: 200, y: 200, row: 0, col: 0 });
      
      // Check last position (bottom-right)
      expect(positions[8]).toEqual({ x: 400, y: 400, row: 2, col: 2 });
      
      // Check middle position
      expect(positions[4]).toEqual({ x: 300, y: 300, row: 1, col: 1 });
    });

    it('generates correct positions for a 2x5 grid', () => {
      const config = {
        rows: 2,
        cols: 5,
        spacing: 120,
        originX: 0,
        originY: 0,
      };
      const positions = generateGridPositions(config);
      
      expect(positions).toHaveLength(10);
      
      // First row positions
      expect(positions[0]).toEqual({ x: 0, y: 0, row: 0, col: 0 });
      expect(positions[4]).toEqual({ x: 480, y: 0, row: 0, col: 4 });
      
      // Second row positions
      expect(positions[5]).toEqual({ x: 0, y: 120, row: 1, col: 0 });
      expect(positions[9]).toEqual({ x: 480, y: 120, row: 1, col: 4 });
    });

    it('generates positions in row-major order', () => {
      const config = {
        rows: 2,
        cols: 3,
        spacing: 50,
        originX: 0,
        originY: 0,
      };
      const positions = generateGridPositions(config);
      
      // Row 0: (0,0), (50,0), (100,0)
      // Row 1: (0,50), (50,50), (100,50)
      expect(positions[0]).toEqual({ x: 0, y: 0, row: 0, col: 0 });
      expect(positions[1]).toEqual({ x: 50, y: 0, row: 0, col: 1 });
      expect(positions[2]).toEqual({ x: 100, y: 0, row: 0, col: 2 });
      expect(positions[3]).toEqual({ x: 0, y: 50, row: 1, col: 0 });
      expect(positions[4]).toEqual({ x: 50, y: 50, row: 1, col: 1 });
      expect(positions[5]).toEqual({ x: 100, y: 50, row: 1, col: 2 });
    });
  });

  describe('generateGrid', () => {
    it('generates circle grid configuration', () => {
      const params = {
        rows: 2,
        cols: 2,
        spacing: 100,
        originX: 200,
        originY: 200,
        shapeType: SHAPE_TYPES.CIRCLE,
        color: '#ff0000',
        shapeProps: { radius: 30 },
      };
      
      const configs = generateGrid(params);
      
      expect(configs).toHaveLength(4);
      expect(configs[0]).toMatchObject({
        type: SHAPE_TYPES.CIRCLE,
        x: 200,
        y: 200,
        color: '#ff0000',
        radius: 30,
        gridPosition: { row: 0, col: 0 },
      });
    });

    it('generates rectangle grid configuration', () => {
      const params = {
        rows: 3,
        cols: 3,
        spacing: 120,
        originX: 100,
        originY: 100,
        shapeType: SHAPE_TYPES.RECT,
        color: '#0000ff',
        shapeProps: { width: 80, height: 60 },
      };
      
      const configs = generateGrid(params);
      
      expect(configs).toHaveLength(9);
      expect(configs[0]).toMatchObject({
        type: SHAPE_TYPES.RECT,
        x: 100,
        y: 100,
        color: '#0000ff',
        width: 80,
        height: 60,
      });
    });

    it('generates triangle grid configuration', () => {
      const params = {
        rows: 2,
        cols: 3,
        spacing: 100,
        originX: 0,
        originY: 0,
        shapeType: SHAPE_TYPES.TRIANGLE,
        color: '#00ff00',
        shapeProps: { width: 50, height: 50 },
      };
      
      const configs = generateGrid(params);
      
      expect(configs).toHaveLength(6);
      expect(configs[0]).toMatchObject({
        type: SHAPE_TYPES.TRIANGLE,
        x: 0,
        y: 0,
        color: '#00ff00',
        width: 50,
        height: 50,
      });
    });

    it('generates text grid configuration with default text', () => {
      const params = {
        rows: 2,
        cols: 2,
        spacing: 150,
        originX: 300,
        originY: 300,
        shapeType: SHAPE_TYPES.TEXT,
        color: '#000000',
        shapeProps: {},
      };
      
      const configs = generateGrid(params);
      
      expect(configs).toHaveLength(4);
      // Text should show grid position by default
      expect(configs[0].text).toBe('(0,0)');
      expect(configs[3].text).toBe('(1,1)');
    });

    it('throws error for invalid rows', () => {
      const params = {
        rows: 25,
        cols: 3,
        spacing: 100,
        originX: 200,
        originY: 200,
        shapeType: SHAPE_TYPES.CIRCLE,
        color: '#ff0000',
      };
      
      expect(() => generateGrid(params)).toThrow('Invalid grid parameters');
    });

    it('throws error for invalid shape type', () => {
      const params = {
        rows: 3,
        cols: 3,
        spacing: 100,
        originX: 200,
        originY: 200,
        shapeType: 'invalid',
        color: '#ff0000',
      };
      
      expect(() => generateGrid(params)).toThrow('Invalid shape type: invalid');
    });

    it('applies default radius for circles', () => {
      const params = {
        rows: 1,
        cols: 1,
        spacing: 100,
        originX: 0,
        originY: 0,
        shapeType: SHAPE_TYPES.CIRCLE,
        color: '#ff0000',
        shapeProps: {},
      };
      
      const configs = generateGrid(params);
      
      expect(configs[0].radius).toBe(DEFAULT_GRID_CONFIG.shapeSize);
    });

    it('applies default dimensions for rectangles', () => {
      const params = {
        rows: 1,
        cols: 1,
        spacing: 100,
        originX: 0,
        originY: 0,
        shapeType: SHAPE_TYPES.RECT,
        color: '#0000ff',
        shapeProps: {},
      };
      
      const configs = generateGrid(params);
      
      expect(configs[0].width).toBe(DEFAULT_GRID_CONFIG.shapeSize * 2);
      expect(configs[0].height).toBe(DEFAULT_GRID_CONFIG.shapeSize * 2);
    });
  });

  describe('calculateGridDimensions', () => {
    it('calculates dimensions for a 3x3 grid', () => {
      const config = {
        rows: 3,
        cols: 3,
        spacing: 100,
        shapeSize: 50,
      };
      
      const dimensions = calculateGridDimensions(config);
      
      expect(dimensions.width).toBe(300); // (3-1)*100 + 50*2
      expect(dimensions.height).toBe(300);
      expect(dimensions.totalShapes).toBe(9);
    });

    it('calculates dimensions for a 2x5 grid', () => {
      const config = {
        rows: 2,
        cols: 5,
        spacing: 120,
        shapeSize: 40,
      };
      
      const dimensions = calculateGridDimensions(config);
      
      expect(dimensions.width).toBe(560); // (5-1)*120 + 40*2
      expect(dimensions.height).toBe(200); // (2-1)*120 + 40*2
      expect(dimensions.totalShapes).toBe(10);
    });

    it('uses default shape size if not provided', () => {
      const config = {
        rows: 2,
        cols: 2,
        spacing: 100,
      };
      
      const dimensions = calculateGridDimensions(config);
      
      expect(dimensions.width).toBe(200); // (2-1)*100 + 50*2
      expect(dimensions.height).toBe(200);
      expect(dimensions.totalShapes).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('handles 1x1 grid (single shape)', () => {
      const params = {
        rows: 1,
        cols: 1,
        spacing: 100,
        originX: 500,
        originY: 500,
        shapeType: SHAPE_TYPES.CIRCLE,
        color: '#ff0000',
      };
      
      const configs = generateGrid(params);
      
      expect(configs).toHaveLength(1);
      expect(configs[0].x).toBe(500);
      expect(configs[0].y).toBe(500);
    });

    it('handles 1xN grid (single row)', () => {
      const params = {
        rows: 1,
        cols: 5,
        spacing: 80,
        originX: 0,
        originY: 0,
        shapeType: SHAPE_TYPES.RECT,
        color: '#00ff00',
      };
      
      const configs = generateGrid(params);
      
      expect(configs).toHaveLength(5);
      expect(configs[0].x).toBe(0);
      expect(configs[4].x).toBe(320); // 4 * 80
    });

    it('handles Nx1 grid (single column)', () => {
      const params = {
        rows: 4,
        cols: 1,
        spacing: 100,
        originX: 0,
        originY: 0,
        shapeType: SHAPE_TYPES.CIRCLE,
        color: '#0000ff',
      };
      
      const configs = generateGrid(params);
      
      expect(configs).toHaveLength(4);
      expect(configs[0].y).toBe(0);
      expect(configs[3].y).toBe(300); // 3 * 100
    });

    it('preserves custom shapeProps', () => {
      const params = {
        rows: 2,
        cols: 2,
        spacing: 100,
        originX: 0,
        originY: 0,
        shapeType: SHAPE_TYPES.CIRCLE,
        color: '#ff0000',
        shapeProps: {
          radius: 75,
          strokeWidth: 5,
          opacity: 0.8,
        },
      };
      
      const configs = generateGrid(params);
      
      expect(configs[0].radius).toBe(75);
      expect(configs[0].strokeWidth).toBe(5);
      expect(configs[0].opacity).toBe(0.8);
    });
  });
});

