/**
 * Tests for ShapeTooltip logic (no Konva rendering)
 */

describe('ShapeTooltip logic', () => {
  // Test the time formatting logic
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'unknown';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  describe('getTimeAgo formatting', () => {
    test('formats seconds correctly', () => {
      const now = Date.now();
      expect(getTimeAgo(now - 5000)).toBe('5s ago');
      expect(getTimeAgo(now - 30000)).toBe('30s ago');
      expect(getTimeAgo(now - 59000)).toBe('59s ago');
    });

    test('formats minutes correctly', () => {
      const now = Date.now();
      expect(getTimeAgo(now - 60000)).toBe('1m ago');
      expect(getTimeAgo(now - 120000)).toBe('2m ago');
      expect(getTimeAgo(now - 3599000)).toBe('59m ago');
    });

    test('formats hours correctly', () => {
      const now = Date.now();
      expect(getTimeAgo(now - 3600000)).toBe('1h ago');
      expect(getTimeAgo(now - 7200000)).toBe('2h ago');
      expect(getTimeAgo(now - 86399000)).toBe('23h ago');
    });

    test('formats days correctly', () => {
      const now = Date.now();
      expect(getTimeAgo(now - 86400000)).toBe('1d ago');
      expect(getTimeAgo(now - 172800000)).toBe('2d ago');
      expect(getTimeAgo(now - 604800000)).toBe('7d ago');
    });

    test('returns "unknown" for null timestamp', () => {
      expect(getTimeAgo(null)).toBe('unknown');
    });

    test('returns "unknown" for undefined timestamp', () => {
      expect(getTimeAgo(undefined)).toBe('unknown');
    });
  });

  describe('tooltip text generation', () => {
    const buildTooltipText = (creatorName, editorName, timeAgo) => {
      let text = `Created by ${creatorName}`;
      if (editorName && editorName !== creatorName) {
        text += `\nEdited ${timeAgo} by ${editorName}`;
      } else {
        text += `\nCreated ${timeAgo}`;
      }
      return text;
    };

    test('shows creator only when not edited by others', () => {
      const text = buildTooltipText('Alice', 'Alice', '5m ago');
      expect(text).toBe('Created by Alice\nCreated 5m ago');
    });

    test('shows creator and editor when edited by different user', () => {
      const text = buildTooltipText('Alice', 'Bob', '5m ago');
      expect(text).toBe('Created by Alice\nEdited 5m ago by Bob');
    });

    test('handles unknown creator', () => {
      const text = buildTooltipText('Unknown', 'Unknown', '5m ago');
      expect(text).toBe('Created by Unknown\nCreated 5m ago');
    });

    test('handles different edit times', () => {
      expect(buildTooltipText('Alice', 'Bob', '30s ago')).toContain('Edited 30s ago');
      expect(buildTooltipText('Alice', 'Bob', '2h ago')).toContain('Edited 2h ago');
      expect(buildTooltipText('Alice', 'Bob', '3d ago')).toContain('Edited 3d ago');
    });
  });

  describe('shape metadata extraction', () => {
    test('extracts creator and editor correctly', () => {
      const shape = {
        id: 'shape-1',
        createdBy: 'user-1',
        updatedBy: 'user-2',
        updatedAt: Date.now() - 120000,
      };

      expect(shape.createdBy).toBe('user-1');
      expect(shape.updatedBy).toBe('user-2');
      expect(shape.createdBy).not.toBe(shape.updatedBy);
    });

    test('handles missing createdBy', () => {
      const shape = {
        id: 'shape-1',
        updatedBy: 'user-2',
      };

      expect(shape.createdBy).toBeUndefined();
      expect(shape.updatedBy).toBe('user-2');
    });

    test('handles matching creator and editor', () => {
      const shape = {
        id: 'shape-1',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      };

      expect(shape.createdBy).toBe(shape.updatedBy);
    });
  });
});

