/**
 * Unit tests for SelectionBox component
 */

import SelectionBox from '../SelectionBox';

// Mock Konva
jest.mock('react-konva', () => ({
  Rect: () => null,
}));

describe('SelectionBox Component', () => {
  it('should return null when visible is false', () => {
    const result = SelectionBox({ x: 10, y: 20, width: 100, height: 50, visible: false });
    expect(result).toBeNull();
  });
  
  it('should return null when width is 0', () => {
    const result = SelectionBox({ x: 10, y: 20, width: 0, height: 50, visible: true });
    expect(result).toBeNull();
  });
  
  it('should return null when height is 0', () => {
    const result = SelectionBox({ x: 10, y: 20, width: 100, height: 0, visible: true });
    expect(result).toBeNull();
  });

  
  it('should render Konva Rect when visible with valid dimensions', () => {
    const result = SelectionBox({ x: 10, y: 20, width: 100, height: 50, visible: true });
    expect(result).not.toBeNull();
    expect(result.type.name).toBe('Rect');
  });
  
  it('should handle negative coordinates', () => {
    const result = SelectionBox({ x: -10, y: -20, width: 100, height: 50, visible: true });
    expect(result).not.toBeNull();
  });
});

