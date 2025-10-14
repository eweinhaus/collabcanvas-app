import { normalizeColor, isValidColor } from '../colorNormalizer';

describe('colorNormalizer', () => {
  describe('normalizeColor', () => {
    describe('Hex colors', () => {
      test('should normalize 6-digit hex with # prefix', () => {
        expect(normalizeColor('#FF0000')).toBe('#ff0000');
        expect(normalizeColor('#00FF00')).toBe('#00ff00');
        expect(normalizeColor('#0000FF')).toBe('#0000ff');
      });

      test('should normalize 6-digit hex without # prefix', () => {
        expect(normalizeColor('FF0000')).toBe('#ff0000');
        expect(normalizeColor('00FF00')).toBe('#00ff00');
        expect(normalizeColor('0000FF')).toBe('#0000ff');
      });

      test('should expand 3-digit hex to 6 digits', () => {
        expect(normalizeColor('#F00')).toBe('#ff0000');
        expect(normalizeColor('#0F0')).toBe('#00ff00');
        expect(normalizeColor('#00F')).toBe('#0000ff');
        expect(normalizeColor('#ABC')).toBe('#aabbcc');
      });

      test('should expand 3-digit hex without # prefix', () => {
        expect(normalizeColor('F00')).toBe('#ff0000');
        expect(normalizeColor('0F0')).toBe('#00ff00');
        expect(normalizeColor('ABC')).toBe('#aabbcc');
      });

      test('should handle lowercase hex values', () => {
        expect(normalizeColor('#ff0000')).toBe('#ff0000');
        expect(normalizeColor('ff0000')).toBe('#ff0000');
      });

      test('should handle mixed case hex values', () => {
        expect(normalizeColor('#Ff0000')).toBe('#ff0000');
        expect(normalizeColor('fF0000')).toBe('#ff0000');
      });
    });

    describe('CSS color names', () => {
      test('should normalize basic color names', () => {
        expect(normalizeColor('red')).toBe('#ff0000');
        expect(normalizeColor('green')).toBe('#008000');
        expect(normalizeColor('blue')).toBe('#0000ff');
        expect(normalizeColor('yellow')).toBe('#ffff00');
        expect(normalizeColor('orange')).toBe('#ffa500');
        expect(normalizeColor('purple')).toBe('#800080');
      });

      test('should normalize extended color names', () => {
        expect(normalizeColor('crimson')).toBe('#dc143c');
        expect(normalizeColor('coral')).toBe('#ff7f50');
        expect(normalizeColor('turquoise')).toBe('#40e0d0');
        expect(normalizeColor('violet')).toBe('#ee82ee');
      });

      test('should handle case-insensitive color names', () => {
        expect(normalizeColor('RED')).toBe('#ff0000');
        expect(normalizeColor('Red')).toBe('#ff0000');
        expect(normalizeColor('rED')).toBe('#ff0000');
      });

      test('should normalize black, white, and grays', () => {
        expect(normalizeColor('black')).toBe('#000000');
        expect(normalizeColor('white')).toBe('#ffffff');
        expect(normalizeColor('gray')).toBe('#808080');
        expect(normalizeColor('grey')).toBe('#808080');
        expect(normalizeColor('silver')).toBe('#c0c0c0');
      });

      test('should handle colors with whitespace', () => {
        expect(normalizeColor('  red  ')).toBe('#ff0000');
        expect(normalizeColor(' blue ')).toBe('#0000ff');
      });
    });

    describe('RGB colors', () => {
      test('should normalize rgb() format', () => {
        expect(normalizeColor('rgb(255, 0, 0)')).toBe('#ff0000');
        expect(normalizeColor('rgb(0, 255, 0)')).toBe('#00ff00');
        expect(normalizeColor('rgb(0, 0, 255)')).toBe('#0000ff');
      });

      test('should normalize rgba() format (ignoring alpha)', () => {
        expect(normalizeColor('rgba(255, 0, 0, 1)')).toBe('#ff0000');
        expect(normalizeColor('rgba(0, 255, 0, 0.5)')).toBe('#00ff00');
        expect(normalizeColor('rgba(0, 0, 255, 0)')).toBe('#0000ff');
      });

      test('should handle rgb with no spaces', () => {
        expect(normalizeColor('rgb(255,0,0)')).toBe('#ff0000');
        expect(normalizeColor('rgba(255,0,0,1)')).toBe('#ff0000');
      });

      test('should handle various RGB values', () => {
        expect(normalizeColor('rgb(128, 128, 128)')).toBe('#808080');
        expect(normalizeColor('rgb(100, 150, 200)')).toBe('#6496c8');
        expect(normalizeColor('rgb(0, 0, 0)')).toBe('#000000');
      });

      test('should throw on invalid RGB values', () => {
        expect(() => normalizeColor('rgb(256, 0, 0)')).toThrow();
        expect(() => normalizeColor('rgb(-1, 0, 0)')).toThrow();
        expect(() => normalizeColor('rgb(100, 300, 0)')).toThrow();
      });

      test('should throw on malformed RGB', () => {
        expect(() => normalizeColor('rgb(100, 50)')).toThrow('Invalid RGB format');
        expect(() => normalizeColor('rgb(a, b, c)')).toThrow();
      });
    });

    describe('HSL colors', () => {
      test('should normalize hsl() format', () => {
        expect(normalizeColor('hsl(0, 100%, 50%)')).toBe('#ff0000');
        expect(normalizeColor('hsl(120, 100%, 50%)')).toBe('#00ff00');
        expect(normalizeColor('hsl(240, 100%, 50%)')).toBe('#0000ff');
      });

      test('should normalize hsla() format (ignoring alpha)', () => {
        expect(normalizeColor('hsla(0, 100%, 50%, 1)')).toBe('#ff0000');
        expect(normalizeColor('hsla(120, 100%, 50%, 0.5)')).toBe('#00ff00');
      });

      test('should handle hsl with no spaces', () => {
        expect(normalizeColor('hsl(0,100%,50%)')).toBe('#ff0000');
        expect(normalizeColor('hsla(0,100%,50%,1)')).toBe('#ff0000');
      });

      test('should handle various HSL values', () => {
        expect(normalizeColor('hsl(0, 0%, 50%)')).toBe('#808080'); // gray
        expect(normalizeColor('hsl(0, 0%, 0%)')).toBe('#000000'); // black
        expect(normalizeColor('hsl(0, 0%, 100%)')).toBe('#ffffff'); // white
      });

      test('should handle hue wraparound', () => {
        expect(normalizeColor('hsl(360, 100%, 50%)')).toBe('#ff0000');
        expect(normalizeColor('hsl(720, 100%, 50%)')).toBe('#ff0000');
      });

      test('should throw on malformed HSL', () => {
        expect(() => normalizeColor('hsl(100, 50)')).toThrow('Invalid HSL format');
        expect(() => normalizeColor('hsl(a, b%, c%)')).toThrow();
      });
    });

    describe('Error handling', () => {
      test('should throw on empty string', () => {
        expect(() => normalizeColor('')).toThrow('Color must be a non-empty string');
      });

      test('should throw on null or undefined', () => {
        expect(() => normalizeColor(null)).toThrow('Color must be a non-empty string');
        expect(() => normalizeColor(undefined)).toThrow('Color must be a non-empty string');
      });

      test('should throw on non-string types', () => {
        expect(() => normalizeColor(123)).toThrow('Color must be a non-empty string');
        expect(() => normalizeColor({})).toThrow('Color must be a non-empty string');
        expect(() => normalizeColor([])).toThrow('Color must be a non-empty string');
      });

      test('should throw on unknown color names', () => {
        expect(() => normalizeColor('notacolor')).toThrow('Unsupported color format');
        expect(() => normalizeColor('blurple')).toThrow('Unsupported color format');
      });

      test('should throw on invalid hex format', () => {
        expect(() => normalizeColor('#GGGGGG')).toThrow('Unsupported color format');
        expect(() => normalizeColor('#12345')).toThrow('Unsupported color format');
        expect(() => normalizeColor('#1234567')).toThrow('Unsupported color format');
      });
    });
  });

  describe('isValidColor', () => {
    test('should return true for valid colors', () => {
      expect(isValidColor('#FF0000')).toBe(true);
      expect(isValidColor('red')).toBe(true);
      expect(isValidColor('rgb(255, 0, 0)')).toBe(true);
      expect(isValidColor('hsl(0, 100%, 50%)')).toBe(true);
    });

    test('should return false for invalid colors', () => {
      expect(isValidColor('notacolor')).toBe(false);
      expect(isValidColor('#GGGGGG')).toBe(false);
      expect(isValidColor('')).toBe(false);
      expect(isValidColor(null)).toBe(false);
      expect(isValidColor(123)).toBe(false);
    });
  });
});

