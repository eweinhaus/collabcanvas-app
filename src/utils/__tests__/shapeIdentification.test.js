/**
 * Tests for Shape Identification Utility
 * 
 * Tests shape identification by color, type, position, and descriptors.
 */

import {
  identifyShape,
  findByColor,
  findByType,
  findByColorAndType,
  findNearestToPosition,
  findById,
  findMostRecent,
  matchesColorFamily,
  parseQuery,
} from '../shapeIdentification';

describe('Shape Identification Utility', () => {
  // Mock shapes for testing
  const mockShapes = [
    {
      id: 'shape-1',
      type: 'circle',
      x: 100,
      y: 100,
      fill: '#ff0000', // red
      isRecent: false,
    },
    {
      id: 'shape-2',
      type: 'rectangle',
      x: 200,
      y: 200,
      fill: '#0000ff', // blue
      isRecent: true,
    },
    {
      id: 'shape-3',
      type: 'circle',
      x: 300,
      y: 300,
      fill: '#0000ff', // blue
      isRecent: false,
    },
    {
      id: 'shape-4',
      type: 'text',
      x: 400,
      y: 400,
      fill: '#00ff00', // green
      isRecent: false,
    },
    {
      id: 'shape-5',
      type: 'triangle',
      x: 500,
      y: 500,
      fill: '#800080', // purple
      isRecent: false,
    },
  ];

  describe('matchesColorFamily', () => {
    it('should match red colors', () => {
      expect(matchesColorFamily('#ff0000', 'red')).toBe(true);
      expect(matchesColorFamily('#cc0000', 'red')).toBe(true);
      expect(matchesColorFamily('#0000ff', 'red')).toBe(false);
    });

    it('should match blue colors', () => {
      expect(matchesColorFamily('#0000ff', 'blue')).toBe(true);
      expect(matchesColorFamily('#3366ff', 'blue')).toBe(true);
      expect(matchesColorFamily('#ff0000', 'blue')).toBe(false);
    });

    it('should match green colors', () => {
      expect(matchesColorFamily('#00ff00', 'green')).toBe(true);
      expect(matchesColorFamily('#00cc00', 'green')).toBe(true);
      expect(matchesColorFamily('#ff0000', 'green')).toBe(false);
    });

    it('should match purple colors', () => {
      expect(matchesColorFamily('#800080', 'purple')).toBe(true);
      expect(matchesColorFamily('#9b59b6', 'purple')).toBe(true);
      expect(matchesColorFamily('#ff0000', 'purple')).toBe(false);
    });

    it('should handle invalid inputs', () => {
      expect(matchesColorFamily(null, 'red')).toBe(false);
      expect(matchesColorFamily('#ff0000', null)).toBe(false);
    });
  });

  describe('findByColor', () => {
    it('should find shapes by exact hex color', () => {
      const result = findByColor(mockShapes, '#ff0000');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('shape-1');
    });

    it('should find shapes by color family', () => {
      const result = findByColor(mockShapes, 'blue');
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toContain('shape-2');
      expect(result.map((s) => s.id)).toContain('shape-3');
    });

    it('should return empty array if no matches', () => {
      const result = findByColor(mockShapes, 'yellow');
      expect(result).toEqual([]);
    });

    it('should handle invalid inputs', () => {
      expect(findByColor(null, 'red')).toEqual([]);
      expect(findByColor(mockShapes, null)).toEqual([]);
    });
  });

  describe('findByType', () => {
    it('should find shapes by type', () => {
      const result = findByType(mockShapes, 'circle');
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toContain('shape-1');
      expect(result.map((s) => s.id)).toContain('shape-3');
    });

    it('should handle type aliases', () => {
      const result = findByType(mockShapes, 'rect');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('shape-2');
    });

    it('should be case-insensitive', () => {
      const result = findByType(mockShapes, 'CIRCLE');
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no matches', () => {
      const result = findByType(mockShapes, 'pentagon');
      expect(result).toEqual([]);
    });
  });

  describe('findByColorAndType', () => {
    it('should find shapes by both color and type', () => {
      const result = findByColorAndType(mockShapes, 'blue', 'circle');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('shape-3');
    });

    it('should return empty array if no matches', () => {
      const result = findByColorAndType(mockShapes, 'red', 'rectangle');
      expect(result).toEqual([]);
    });

    it('should handle null color (type only)', () => {
      const result = findByColorAndType(mockShapes, null, 'circle');
      expect(result).toHaveLength(2);
    });

    it('should handle null type (color only)', () => {
      const result = findByColorAndType(mockShapes, 'blue', null);
      expect(result).toHaveLength(2);
    });
  });

  describe('findNearestToPosition', () => {
    it('should find shape nearest to position', () => {
      const result = findNearestToPosition(mockShapes, 105, 105);
      expect(result.id).toBe('shape-1');
    });

    it('should find shape nearest to another position', () => {
      const result = findNearestToPosition(mockShapes, 205, 205);
      expect(result.id).toBe('shape-2');
    });

    it('should return null for empty array', () => {
      const result = findNearestToPosition([], 100, 100);
      expect(result).toBeNull();
    });

    it('should handle invalid input', () => {
      const result = findNearestToPosition(null, 100, 100);
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find shape by ID', () => {
      const result = findById(mockShapes, 'shape-3');
      expect(result).not.toBeNull();
      expect(result.id).toBe('shape-3');
    });

    it('should return null if ID not found', () => {
      const result = findById(mockShapes, 'non-existent');
      expect(result).toBeNull();
    });

    it('should handle invalid inputs', () => {
      expect(findById(null, 'shape-1')).toBeNull();
      expect(findById(mockShapes, null)).toBeNull();
    });
  });

  describe('findMostRecent', () => {
    it('should find most recent shape by flag', () => {
      const result = findMostRecent(mockShapes);
      expect(result.id).toBe('shape-2');
    });

    it('should return first shape if no isRecent flag', () => {
      const shapesWithoutFlag = mockShapes.map((s) => ({ ...s, isRecent: false }));
      const result = findMostRecent(shapesWithoutFlag);
      expect(result.id).toBe('shape-1');
    });

    it('should return null for empty array', () => {
      const result = findMostRecent([]);
      expect(result).toBeNull();
    });

    it('should handle invalid input', () => {
      const result = findMostRecent(null);
      expect(result).toBeNull();
    });
  });

  describe('identifyShape', () => {
    it('should identify shape by ID', () => {
      const result = identifyShape(mockShapes, { id: 'shape-3' });
      expect(result.success).toBe(true);
      expect(result.shape.id).toBe('shape-3');
      expect(result.count).toBe(1);
    });

    it('should identify shape by color', () => {
      const result = identifyShape(mockShapes, { color: 'blue' });
      expect(result.success).toBe(true);
      expect(result.shape.id).toBe('shape-2'); // First blue shape
      expect(result.count).toBe(2); // Two blue shapes total
    });

    it('should identify shape by type', () => {
      const result = identifyShape(mockShapes, { type: 'circle' });
      expect(result.success).toBe(true);
      expect(result.shape.id).toBe('shape-1'); // First circle
      expect(result.count).toBe(2);
    });

    it('should identify shape by color and type', () => {
      const result = identifyShape(mockShapes, { color: 'blue', type: 'circle' });
      expect(result.success).toBe(true);
      expect(result.shape.id).toBe('shape-3');
      expect(result.count).toBe(1);
    });

    it('should identify shape by position', () => {
      const result = identifyShape(mockShapes, { position: { x: 105, y: 105 } });
      expect(result.success).toBe(true);
      expect(result.shape.id).toBe('shape-1');
      expect(result.count).toBe(1);
    });

    it('should return all shapes with all flag', () => {
      const result = identifyShape(mockShapes, { color: 'blue', all: true });
      expect(result.success).toBe(true);
      expect(result.shapes).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should select shape by index', () => {
      const result = identifyShape(mockShapes, { color: 'blue', index: 1 });
      expect(result.success).toBe(true);
      expect(result.shape.id).toBe('shape-3'); // Second blue shape
    });

    it('should fail if no shapes on canvas', () => {
      const result = identifyShape([], { color: 'red' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('No shapes on canvas');
    });

    it('should fail if color not found', () => {
      const result = identifyShape(mockShapes, { color: 'yellow' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('No yellow shapes found');
    });

    it('should fail if type not found', () => {
      const result = identifyShape(mockShapes, { type: 'pentagon' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('No pentagon shapes found');
    });

    it('should fail if ID not found', () => {
      const result = identifyShape(mockShapes, { id: 'non-existent' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Shape with ID "non-existent" not found');
    });

    it('should handle invalid shapes array', () => {
      const result = identifyShape(null, { color: 'red' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid shapes array');
    });

    it('should fail if index out of range', () => {
      const result = identifyShape(mockShapes, { color: 'blue', index: 5 });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Index 5 out of range (2 matches found)');
    });
  });

  describe('parseQuery', () => {
    it('should parse "all" keyword', () => {
      const result = parseQuery('all circles');
      expect(result.all).toBe(true);
      expect(result.type).toBe('circle');
    });

    it('should parse color', () => {
      const result = parseQuery('the blue shape');
      expect(result.color).toBe('blue');
    });

    it('should parse type', () => {
      const result = parseQuery('the rectangle');
      expect(result.type).toBe('rectangle');
    });

    it('should parse color and type', () => {
      const result = parseQuery('all red circles');
      expect(result.all).toBe(true);
      expect(result.color).toBe('red');
      expect(result.type).toBe('circle');
    });

    it('should handle empty string', () => {
      const result = parseQuery('');
      expect(result).toEqual({});
    });

    it('should handle null input', () => {
      const result = parseQuery(null);
      expect(result).toEqual({});
    });
  });
});

