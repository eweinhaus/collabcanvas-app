/**
 * Unit tests for color utilities
 */

import { COLOR_PALETTE, getRandomColor, getColorByIndex, isValidHexColor } from '../colors';

describe('Color Utilities', () => {
  describe('COLOR_PALETTE', () => {
    it('should have at least 5 colors', () => {
      expect(COLOR_PALETTE.length).toBeGreaterThanOrEqual(5);
    });

    it('should contain valid hex colors', () => {
      COLOR_PALETTE.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('getRandomColor', () => {
    it('should return a color from the palette', () => {
      const color = getRandomColor();
      expect(COLOR_PALETTE).toContain(color);
    });

    it('should return a valid hex color', () => {
      const color = getRandomColor();
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should potentially return different colors on multiple calls', () => {
      const colors = new Set();
      // Call it 50 times to increase chance of getting different colors
      for (let i = 0; i < 50; i++) {
        colors.add(getRandomColor());
      }
      // With 10 colors and 50 attempts, we should get more than 1 unique color
      expect(colors.size).toBeGreaterThan(1);
    });
  });

  describe('getColorByIndex', () => {
    it('should return the correct color for a valid index', () => {
      expect(getColorByIndex(0)).toBe(COLOR_PALETTE[0]);
      expect(getColorByIndex(1)).toBe(COLOR_PALETTE[1]);
    });

    it('should wrap around for indices greater than palette length', () => {
      const paletteLength = COLOR_PALETTE.length;
      expect(getColorByIndex(paletteLength)).toBe(COLOR_PALETTE[0]);
      expect(getColorByIndex(paletteLength + 1)).toBe(COLOR_PALETTE[1]);
    });

    it('should return a valid hex color', () => {
      expect(getColorByIndex(5)).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('isValidHexColor', () => {
    it('should return true for valid hex colors', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#00ff00')).toBe(true);
      expect(isValidHexColor('#0000FF')).toBe(true);
      expect(isValidHexColor('#ABC123')).toBe(true);
    });

    it('should return false for invalid hex colors', () => {
      expect(isValidHexColor('FF0000')).toBe(false); // missing #
      expect(isValidHexColor('#FF00')).toBe(false); // too short
      expect(isValidHexColor('#FF00000')).toBe(false); // too long
      expect(isValidHexColor('#GGGGGG')).toBe(false); // invalid characters
      expect(isValidHexColor('not a color')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
    });
  });
});

