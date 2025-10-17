/**
 * Tests for colorNormalizer utility
 */

import { isValidColor, toHex, normalizeColor, normalizeColorSafe } from '../colorNormalizer';

describe('colorNormalizer', () => {
  describe('isValidColor', () => {
    test('validates 6-digit hex colors', () => {
      expect(isValidColor('#ff0000')).toBe(true);
      expect(isValidColor('#FF0000')).toBe(true);
      expect(isValidColor('#abc123')).toBe(true);
    });

    test('validates 3-digit hex colors', () => {
      expect(isValidColor('#fff')).toBe(true);
      expect(isValidColor('#000')).toBe(true);
      expect(isValidColor('#a1b')).toBe(true);
    });

    test('validates CSS color keywords', () => {
      expect(isValidColor('red')).toBe(true);
      expect(isValidColor('blue')).toBe(true);
      expect(isValidColor('cornflowerblue')).toBe(true);
      expect(isValidColor('rebeccapurple')).toBe(true);
    });

    test('validates rgb colors', () => {
      expect(isValidColor('rgb(255, 0, 0)')).toBe(true);
      expect(isValidColor('rgb(0,0,0)')).toBe(true);
      expect(isValidColor('rgb( 128 , 64 , 32 )')).toBe(true);
    });

    test('validates rgba colors', () => {
      expect(isValidColor('rgba(255, 0, 0, 1)')).toBe(true);
      expect(isValidColor('rgba(0,0,0,0.5)')).toBe(true);
    });

    test('validates hsl colors', () => {
      expect(isValidColor('hsl(0, 100%, 50%)')).toBe(true);
      expect(isValidColor('hsl(240,100%,50%)')).toBe(true);
    });

    test('validates hsla colors', () => {
      expect(isValidColor('hsla(0, 100%, 50%, 1)')).toBe(true);
      expect(isValidColor('hsla(120,50%,25%,0.8)')).toBe(true);
    });

    test('rejects invalid colors', () => {
      expect(isValidColor('blurple')).toBe(false);
      expect(isValidColor('#gg0000')).toBe(false);
      // Note: rgb(256, 0, 0) matches format regex but toHex will clamp the values
      expect(isValidColor('not-a-color')).toBe(false);
      expect(isValidColor('')).toBe(false);
      expect(isValidColor(null)).toBe(false);
      expect(isValidColor(undefined)).toBe(false);
    });
  });

  describe('toHex', () => {
    describe('hex color conversion', () => {
      test('converts 3-digit hex to 6-digit', () => {
        expect(toHex('#fff')).toBe('#ffffff');
        expect(toHex('#000')).toBe('#000000');
        expect(toHex('#abc')).toBe('#aabbcc');
        expect(toHex('#F0A')).toBe('#ff00aa');
      });

      test('preserves 6-digit hex', () => {
        expect(toHex('#ff0000')).toBe('#ff0000');
        expect(toHex('#00ff00')).toBe('#00ff00');
        expect(toHex('#0000ff')).toBe('#0000ff');
      });

      test('normalizes hex to lowercase', () => {
        expect(toHex('#FF0000')).toBe('#ff0000');
        expect(toHex('#ABC123')).toBe('#abc123');
        expect(toHex('#FFF')).toBe('#ffffff');
      });
    });

    describe('CSS keyword conversion', () => {
      test('converts common color keywords', () => {
        expect(toHex('red')).toBe('#ff0000');
        expect(toHex('blue')).toBe('#0000ff');
        expect(toHex('green')).toBe('#008000');
        expect(toHex('white')).toBe('#ffffff');
        expect(toHex('black')).toBe('#000000');
      });

      test('converts extended color keywords', () => {
        expect(toHex('cornflowerblue')).toBe('#6495ed');
        expect(toHex('rebeccapurple')).toBe('#663399');
        expect(toHex('mediumaquamarine')).toBe('#66cdaa');
        expect(toHex('darkslategray')).toBe('#2f4f4f');
      });

      test('handles case insensitivity', () => {
        expect(toHex('RED')).toBe('#ff0000');
        expect(toHex('Blue')).toBe('#0000ff');
        expect(toHex('CornflowerBlue')).toBe('#6495ed');
      });

      test('handles whitespace', () => {
        expect(toHex('  red  ')).toBe('#ff0000');
        expect(toHex('\tblue\n')).toBe('#0000ff');
      });
    });

    describe('RGB conversion', () => {
      test('converts rgb to hex', () => {
        expect(toHex('rgb(255, 0, 0)')).toBe('#ff0000');
        expect(toHex('rgb(0, 255, 0)')).toBe('#00ff00');
        expect(toHex('rgb(0, 0, 255)')).toBe('#0000ff');
      });

      test('converts rgb without spaces', () => {
        expect(toHex('rgb(255,0,0)')).toBe('#ff0000');
        expect(toHex('rgb(128,64,32)')).toBe('#804020');
      });

      test('handles rgba with alpha=1', () => {
        expect(toHex('rgba(255, 0, 0, 1)')).toBe('#ff0000');
        expect(toHex('rgba(0, 255, 0, 1.0)')).toBe('#00ff00');
      });

      test('rejects rgba with alpha<1', () => {
        expect(() => toHex('rgba(255, 0, 0, 0.5)')).toThrow(/alpha/);
        expect(() => toHex('rgba(0, 255, 0, 0)')).toThrow(/alpha/);
      });

      test('clamps out-of-range RGB values', () => {
        // Implementation should handle edge cases gracefully
        expect(toHex('rgb(300, 0, 0)')).toBe('#ff0000'); // Clamps to 255
        expect(toHex('rgb(-10, 0, 0)')).toBe('#000000'); // Clamps to 0
      });
    });

    describe('HSL conversion', () => {
      test('converts hsl to hex', () => {
        expect(toHex('hsl(0, 100%, 50%)')).toBe('#ff0000'); // Red
        expect(toHex('hsl(120, 100%, 50%)')).toBe('#00ff00'); // Green
        expect(toHex('hsl(240, 100%, 50%)')).toBe('#0000ff'); // Blue
      });

      test('converts hsl without spaces', () => {
        expect(toHex('hsl(0,100%,50%)')).toBe('#ff0000');
        expect(toHex('hsl(180,50%,50%)')).toBe('#40bfbf');
      });

      test('handles hsla with alpha=1', () => {
        expect(toHex('hsla(0, 100%, 50%, 1)')).toBe('#ff0000');
        expect(toHex('hsla(120, 100%, 50%, 1.0)')).toBe('#00ff00');
      });

      test('rejects hsla with alpha<1', () => {
        expect(() => toHex('hsla(0, 100%, 50%, 0.5)')).toThrow(/alpha/);
        expect(() => toHex('hsla(120, 100%, 50%, 0)')).toThrow(/alpha/);
      });

      test('converts various hsl combinations', () => {
        expect(toHex('hsl(0, 0%, 0%)')).toBe('#000000'); // Black
        expect(toHex('hsl(0, 0%, 100%)')).toBe('#ffffff'); // White
        expect(toHex('hsl(0, 0%, 50%)')).toBe('#808080'); // Gray
      });
    });

    describe('error handling', () => {
      test('throws on invalid color format', () => {
        expect(() => toHex('blurple')).toThrow(/Invalid color format/);
        expect(() => toHex('not-a-color')).toThrow(/Invalid color format/);
      });

      test('throws on empty or null input', () => {
        expect(() => toHex('')).toThrow(/Invalid color/);
        expect(() => toHex(null)).toThrow(/Invalid color/);
        expect(() => toHex(undefined)).toThrow(/Invalid color/);
      });

      test('throws on non-string input', () => {
        expect(() => toHex(123)).toThrow(/Invalid color/);
        expect(() => toHex({})).toThrow(/Invalid color/);
        expect(() => toHex([])).toThrow(/Invalid color/);
      });
    });
  });

  describe('normalizeColor', () => {
    test('returns object with ok=true and hex value', () => {
      const result = normalizeColor('#ff0000');
      expect(result).toEqual({ ok: true, hex: '#ff0000' });
    });

    test('normalizes various color formats', () => {
      expect(normalizeColor('red')).toEqual({ ok: true, hex: '#ff0000' });
      expect(normalizeColor('#fff')).toEqual({ ok: true, hex: '#ffffff' });
      expect(normalizeColor('rgb(0, 255, 0)')).toEqual({ ok: true, hex: '#00ff00' });
      expect(normalizeColor('hsl(240, 100%, 50%)')).toEqual({ ok: true, hex: '#0000ff' });
    });

    test('throws on invalid color', () => {
      expect(() => normalizeColor('invalid')).toThrow();
      expect(() => normalizeColor('blurple')).toThrow();
    });
  });

  describe('normalizeColorSafe', () => {
    test('returns object with ok=true on valid color', () => {
      const result = normalizeColorSafe('#ff0000');
      expect(result).toEqual({ ok: true, hex: '#ff0000' });
    });

    test('returns object with ok=false on invalid color', () => {
      const result = normalizeColorSafe('blurple');
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    test('handles various invalid inputs gracefully', () => {
      expect(normalizeColorSafe('')).toEqual({ ok: false, error: expect.any(String) });
      expect(normalizeColorSafe(null)).toEqual({ ok: false, error: expect.any(String) });
      expect(normalizeColorSafe('not-a-color')).toEqual({ ok: false, error: expect.any(String) });
    });

    test('normalizes valid colors correctly', () => {
      expect(normalizeColorSafe('blue')).toEqual({ ok: true, hex: '#0000ff' });
      expect(normalizeColorSafe('#abc')).toEqual({ ok: true, hex: '#aabbcc' });
      expect(normalizeColorSafe('rgb(255, 0, 0)')).toEqual({ ok: true, hex: '#ff0000' });
    });
  });
});

