/**
 * Tests for DSPy Converter Utility
 */

import {
  isComplexRequest,
  convertDSPyToToolCalls,
  extractObjectName,
} from './dspyConverter';

/* eslint-env jest */

describe('isComplexRequest', () => {
  it('should return true for person requests', () => {
    expect(isComplexRequest('create a person')).toBe(true);
    expect(isComplexRequest('Draw a human')).toBe(true);
    expect(isComplexRequest('make a man')).toBe(true);
  });

  it('should return true for animal requests', () => {
    expect(isComplexRequest('create a dog')).toBe(true);
    expect(isComplexRequest('make a cat')).toBe(true);
    expect(isComplexRequest('draw a dinosaur')).toBe(true);
  });

  it('should return true for vehicle requests', () => {
    expect(isComplexRequest('create a car')).toBe(true);
    expect(isComplexRequest('make a truck')).toBe(true);
    expect(isComplexRequest('draw an airplane')).toBe(true);
  });

  it('should return true for building requests', () => {
    expect(isComplexRequest('create a house')).toBe(true);
    expect(isComplexRequest('make a castle')).toBe(true);
  });

  it('should return false for simple shape requests', () => {
    expect(isComplexRequest('create a circle')).toBe(false);
    expect(isComplexRequest('add a square')).toBe(false);
    expect(isComplexRequest('draw a rectangle')).toBe(false);
  });

  it('should return false for grid requests', () => {
    expect(isComplexRequest('create a 3x3 grid')).toBe(false);
    expect(isComplexRequest('make a grid of squares')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isComplexRequest('')).toBe(false);
    expect(isComplexRequest(null)).toBe(false);
    expect(isComplexRequest(undefined)).toBe(false);
    expect(isComplexRequest(123)).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isComplexRequest('CREATE A PERSON')).toBe(true);
    expect(isComplexRequest('MaKe A DoG')).toBe(true);
  });
});

describe('convertDSPyToToolCalls', () => {
  const mockCanvasState = {
    stageSize: { width: 1920, height: 1080 },
    scale: 1,
  };

  it('should convert DSPy result to tool calls', () => {
    const dspyResult = {
      success: true,
      object_type: 'person',
      parts: ['head', 'body'],
      shapes: [
        {
          type: 'circle',
          color: '#FFE4C4',
          radius: 20,
          relative_pos: { x: 0, y: 0 },
          role: 'head',
        },
        {
          type: 'rectangle',
          color: '#2196F3',
          width: 30,
          height: 40,
          relative_pos: { x: -15, y: 25 },
          role: 'body',
        },
      ],
    };

    const toolCalls = convertDSPyToToolCalls(dspyResult, mockCanvasState);

    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].type).toBe('function');
    expect(toolCalls[0].function.name).toBe('createShapesBatch');

    const args = JSON.parse(toolCalls[0].function.arguments);
    expect(args.shapes).toHaveLength(2);
    expect(args.shapes[0].type).toBe('circle');
    expect(args.shapes[0].radius).toBe(20);
    expect(args.shapes[1].type).toBe('rectangle');
    expect(args.shapes[1].width).toBe(30);
  });

  it('should convert relative positions to absolute', () => {
    const dspyResult = {
      success: true,
      shapes: [
        {
          type: 'circle',
          color: '#FF0000',
          radius: 30,
          relative_pos: { x: 100, y: 50 },
        },
      ],
    };

    const toolCalls = convertDSPyToToolCalls(dspyResult, mockCanvasState);
    const args = JSON.parse(toolCalls[0].function.arguments);

    // Center is 1920/2 = 960, 1080/2 = 540
    expect(args.shapes[0].x).toBe(960 + 100);
    expect(args.shapes[0].y).toBe(540 + 50);
  });

  it('should handle missing relative_pos', () => {
    const dspyResult = {
      success: true,
      shapes: [
        {
          type: 'circle',
          color: '#FF0000',
          radius: 30,
          // No relative_pos
        },
      ],
    };

    const toolCalls = convertDSPyToToolCalls(dspyResult, mockCanvasState);
    const args = JSON.parse(toolCalls[0].function.arguments);

    // Should default to center
    expect(args.shapes[0].x).toBe(960);
    expect(args.shapes[0].y).toBe(540);
  });

  it('should apply default colors', () => {
    const dspyResult = {
      success: true,
      shapes: [
        {
          type: 'rectangle',
          width: 100,
          height: 80,
          relative_pos: { x: 0, y: 0 },
          // No color
        },
      ],
    };

    const toolCalls = convertDSPyToToolCalls(dspyResult, mockCanvasState);
    const args = JSON.parse(toolCalls[0].function.arguments);

    expect(args.shapes[0].fill).toBe('#4A90E2');
  });

  it('should limit shapes to 100', () => {
    const shapes = Array.from({ length: 150 }, (_, i) => ({
      type: 'circle',
      color: '#FF0000',
      radius: 10,
      relative_pos: { x: i * 20, y: 0 },
    }));

    const dspyResult = {
      success: true,
      shapes,
    };

    const toolCalls = convertDSPyToToolCalls(dspyResult, mockCanvasState);
    const args = JSON.parse(toolCalls[0].function.arguments);

    expect(args.shapes).toHaveLength(100);
  });

  it('should handle text shapes', () => {
    const dspyResult = {
      success: true,
      shapes: [
        {
          type: 'text',
          text: 'Hello',
          color: '#000000',
          width: 100,
          height: 30,
          fontSize: 20,
          relative_pos: { x: 0, y: 0 },
        },
      ],
    };

    const toolCalls = convertDSPyToToolCalls(dspyResult, mockCanvasState);
    const args = JSON.parse(toolCalls[0].function.arguments);

    expect(args.shapes[0].type).toBe('text');
    expect(args.shapes[0].text).toBe('Hello');
    expect(args.shapes[0].fontSize).toBe(20);
  });

  it('should include rotation if specified', () => {
    const dspyResult = {
      success: true,
      shapes: [
        {
          type: 'rectangle',
          width: 100,
          height: 50,
          color: '#FF0000',
          rotation: 45,
          relative_pos: { x: 0, y: 0 },
        },
      ],
    };

    const toolCalls = convertDSPyToToolCalls(dspyResult, mockCanvasState);
    const args = JSON.parse(toolCalls[0].function.arguments);

    expect(args.shapes[0].rotation).toBe(45);
  });

  it('should throw on invalid result', () => {
    expect(() => convertDSPyToToolCalls(null, mockCanvasState)).toThrow();
    expect(() => convertDSPyToToolCalls({ success: false }, mockCanvasState)).toThrow();
    expect(() => convertDSPyToToolCalls({ success: true, shapes: [] }, mockCanvasState)).toThrow();
  });
});

describe('extractObjectName', () => {
  it('should extract object from "create a" pattern', () => {
    expect(extractObjectName('create a person')).toBe('person');
    expect(extractObjectName('create an airplane')).toBe('airplane');
    expect(extractObjectName('create the house')).toBe('house');
  });

  it('should extract object from "make a" pattern', () => {
    expect(extractObjectName('make a dog')).toBe('dog');
    expect(extractObjectName('make a red car')).toBe('red');
  });

  it('should extract object from "draw a" pattern', () => {
    expect(extractObjectName('draw a tree')).toBe('tree');
  });

  it('should return default for unrecognized patterns', () => {
    expect(extractObjectName('hello')).toBe('object');
    expect(extractObjectName('')).toBe('object');
  });

  it('should be case insensitive', () => {
    expect(extractObjectName('CREATE A PERSON')).toBe('person');
    expect(extractObjectName('Make A Dog')).toBe('dog');
  });
});

