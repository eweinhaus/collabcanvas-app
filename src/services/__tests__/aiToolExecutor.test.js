/**
 * Unit Tests for AI Tool Executor
 */

import { 
  executeCreateShape, 
  executeGetCanvasState, 
  executeMoveShape,
  executeUpdateShapeColor,
  executeDeleteShape,
  executeRotateShape,
  executeCreateGrid,
  executeToolCall 
} from '../aiToolExecutor';
import { SHAPE_TYPES } from '../../utils/shapes';

// Mock uuid to avoid ESM issues in Jest
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

// Mock Firebase and related dependencies
jest.mock('firebase/firestore', () => ({
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
  doc: jest.fn(),
}));

jest.mock('../firebase', () => ({
  firestore: {},
  auth: {
    currentUser: {
      uid: 'test-user-123',
    },
  },
}));

jest.mock('react-hot-toast', () => ({
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('aiToolExecutor', () => {
  describe('executeCreateShape', () => {
    let mockCanvasActions;

    beforeEach(() => {
      mockCanvasActions = {
        addShape: jest.fn().mockResolvedValue(undefined),
      };
    });

    it('should create a circle with valid arguments', async () => {
      const args = {
        type: 'circle',
        x: 100,
        y: 200,
        radius: 50,
        color: 'red',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.shape.type).toBe(SHAPE_TYPES.CIRCLE);
      expect(result.shape.x).toBe(100);
      expect(result.shape.y).toBe(200);
      expect(result.shape.radius).toBe(50);
      expect(result.shape.fill).toBe('#ff0000'); // normalized red
      expect(mockCanvasActions.addShape).toHaveBeenCalledWith(result.shape);
    });

    it('should create a rectangle with valid arguments', async () => {
      const args = {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#3498db',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.shape.type).toBe(SHAPE_TYPES.RECT);
      expect(result.shape.fill).toBe('#3498db');
      expect(result.shape.width).toBe(150);
      expect(result.shape.height).toBe(100);
    });

    it('should create text with valid arguments', async () => {
      const args = {
        type: 'text',
        x: 500,
        y: 600,
        text: 'Hello World',
        color: 'blue',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.shape.type).toBe(SHAPE_TYPES.TEXT);
      expect(result.shape.text).toBe('Hello World');
      expect(result.shape.fill).toBe('#0000ff');
    });

    it('should create a triangle with valid arguments', async () => {
      const args = {
        type: 'triangle',
        x: 200,
        y: 300,
        color: 'purple',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.shape.type).toBe(SHAPE_TYPES.TRIANGLE);
      expect(result.shape.fill).toBe('#800080');
    });

    it('should normalize color names to hex', async () => {
      const args = {
        type: 'circle',
        x: 100,
        y: 100,
        color: 'GREEN',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.shape.fill).toBe('#008000'); // normalized green
    });

    it('should fail when shape type is missing', async () => {
      const args = {
        x: 100,
        y: 200,
        color: 'red',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Shape type is required');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });

    it('should fail when coordinates are invalid', async () => {
      const args = {
        type: 'circle',
        x: 'invalid',
        y: 200,
        color: 'red',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('coordinates are required');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });

    it('should fail when color is missing', async () => {
      const args = {
        type: 'circle',
        x: 100,
        y: 200,
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Color is required');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });

    it('should fail when color is invalid', async () => {
      const args = {
        type: 'circle',
        x: 100,
        y: 200,
        color: 'notacolor',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid color');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });

    it('should fail when text shape has no text content', async () => {
      const args = {
        type: 'text',
        x: 100,
        y: 200,
        color: 'black',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Text content is required');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });

    it('should fail when shape type is unknown', async () => {
      const args = {
        type: 'hexagon',
        x: 100,
        y: 200,
        color: 'red',
      };

      const result = await executeCreateShape(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown shape type');
      expect(mockCanvasActions.addShape).not.toHaveBeenCalled();
    });
  });

  describe('executeGetCanvasState', () => {
    it('should return canvas state with shapes', async () => {
      const mockCanvasState = {
        shapes: [
          { id: '1', type: 'circle', x: 100, y: 200, fill: '#ff0000', radius: 50 },
          { id: '2', type: 'rect', x: 300, y: 400, fill: '#0000ff', width: 100, height: 100 },
        ],
      };

      const result = await executeGetCanvasState({}, mockCanvasState);

      expect(result.success).toBe(true);
      expect(result.canvasState.shapeCount).toBe(2);
      expect(result.canvasState.shapes).toHaveLength(2);
      expect(result.canvasState.shapes[0].id).toBe('1');
      expect(result.canvasState.shapes[0].color).toBe('#ff0000');
    });

    it('should return empty canvas state when no shapes', async () => {
      const mockCanvasState = {
        shapes: [],
      };

      const result = await executeGetCanvasState({}, mockCanvasState);

      expect(result.success).toBe(true);
      expect(result.canvasState.shapeCount).toBe(0);
      expect(result.canvasState.shapes).toHaveLength(0);
    });

    it('should include full shape properties', async () => {
      const mockCanvasState = {
        shapes: [
          {
            id: '1',
            type: 'circle',
            x: 100.6,
            y: 200.4,
            fill: '#ff0000',
            radius: 50.8,
            draggable: true,
            stroke: '#000000',
          },
        ],
      };

      const result = await executeGetCanvasState({}, mockCanvasState);

      expect(result.success).toBe(true);
      const shape = result.canvasState.shapes[0];
      expect(shape.x).toBe(101); // rounded
      expect(shape.y).toBe(200); // rounded
      expect(shape.radius).toBe(51); // rounded
      expect(shape.fill).toBe('#ff0000'); // included
      expect(shape.stroke).toBe('#000000'); // included in enhanced state
      expect(shape.draggable).toBeUndefined(); // not included
    });
  });

  describe('executeMoveShape', () => {
    let mockCanvasActions;
    let mockCanvasState;

    beforeEach(() => {
      mockCanvasActions = {
        updateShape: jest.fn().mockResolvedValue(undefined),
      };
      mockCanvasState = {
        shapes: [
          { id: 'shape-1', type: 'circle', x: 100, y: 200, fill: '#ff0000' },
          { id: 'shape-2', type: 'rect', x: 300, y: 400, fill: '#0000ff' },
        ],
      };
    });

    it('should move shape to new position', async () => {
      const args = {
        id: 'shape-1',
        x: 500,
        y: 300,
      };

      const result = await executeMoveShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Moved circle to (500, 300)');
      expect(mockCanvasActions.updateShape).toHaveBeenCalledWith('shape-1', {
        x: 500,
        y: 300,
      });
    });

    it('should fail when canvas is empty and no shape can be identified', async () => {
      const args = {
        x: 500,
        y: 300,
        // No id, color, or type - cannot identify
      };

      const emptyCanvasState = { shapes: [] };
      const result = await executeMoveShape(args, mockCanvasActions, emptyCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No shapes on canvas');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });

    it('should fail when coordinates are invalid', async () => {
      const args = {
        id: 'shape-1',
        x: 'invalid',
        y: 300,
      };

      const result = await executeMoveShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('coordinates are required');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });

    it('should allow negative coordinates (off-canvas positioning)', async () => {
      const args = {
        id: 'shape-1',
        x: -10,
        y: -20,
      };

      const result = await executeMoveShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(true);
      expect(mockCanvasActions.updateShape).toHaveBeenCalledWith('shape-1', {
        x: -10,
        y: -20,
      });
    });

    it('should fail when shape does not exist', async () => {
      const args = {
        id: 'nonexistent-shape',
        x: 500,
        y: 300,
      };

      const result = await executeMoveShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });
  });

  describe('executeUpdateShapeColor', () => {
    let mockCanvasActions;
    let mockCanvasState;

    beforeEach(() => {
      mockCanvasActions = {
        updateShape: jest.fn().mockResolvedValue(undefined),
      };
      mockCanvasState = {
        shapes: [
          { id: 'shape-1', type: 'circle', x: 100, y: 200, fill: '#ff0000' },
          { id: 'shape-2', type: 'rect', x: 300, y: 400, fill: '#0000ff' },
        ],
      };
    });

    it('should update shape color', async () => {
      const args = {
        id: 'shape-1',
        color: 'green',
      };

      const result = await executeUpdateShapeColor(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Changed circle color to green');
      expect(mockCanvasActions.updateShape).toHaveBeenCalledWith('shape-1', {
        fill: '#008000', // normalized green
      });
    });

    it('should handle hex colors', async () => {
      const args = {
        id: 'shape-2',
        color: '#FF5733',
      };

      const result = await executeUpdateShapeColor(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(true);
      expect(mockCanvasActions.updateShape).toHaveBeenCalledWith('shape-2', {
        fill: '#ff5733', // lowercase
      });
    });

    it('should fail when shape cannot be identified (invalid descriptor)', async () => {
      const args = {
        color: 'green', // No green shapes in mockCanvasState
        newColor: 'yellow',
      };

      const result = await executeUpdateShapeColor(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No green shapes found');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });

    it('should fail when color is missing', async () => {
      const args = {
        id: 'shape-1',
      };

      const result = await executeUpdateShapeColor(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Color is required');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });

    it('should fail when color is invalid', async () => {
      const args = {
        id: 'shape-1',
        color: 'notacolor',
      };

      const result = await executeUpdateShapeColor(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid color');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });

    it('should fail when shape does not exist', async () => {
      const args = {
        id: 'nonexistent-shape',
        color: 'green',
      };

      const result = await executeUpdateShapeColor(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });
  });

  describe('executeDeleteShape', () => {
    let mockCanvasActions;
    let mockCanvasState;

    beforeEach(() => {
      mockCanvasActions = {
        deleteShape: jest.fn().mockResolvedValue(undefined),
      };
      mockCanvasState = {
        shapes: [
          { id: 'shape-1', type: 'circle', x: 100, y: 200, fill: '#ff0000' },
          { id: 'shape-2', type: 'rect', x: 300, y: 400, fill: '#0000ff' },
        ],
      };
    });

    it('should delete shape', async () => {
      const args = {
        id: 'shape-1',
      };

      const result = await executeDeleteShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Deleted circle');
      expect(mockCanvasActions.deleteShape).toHaveBeenCalledWith('shape-1');
    });

    it('should fail when canvas is empty and no shape can be identified', async () => {
      const args = {}; // No id, color, or type

      const emptyCanvasState = { shapes: [] };
      const result = await executeDeleteShape(args, mockCanvasActions, emptyCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No shapes on canvas');
      expect(mockCanvasActions.deleteShape).not.toHaveBeenCalled();
    });

    it('should fail when shape does not exist', async () => {
      const args = {
        id: 'nonexistent-shape',
      };

      const result = await executeDeleteShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(mockCanvasActions.deleteShape).not.toHaveBeenCalled();
    });
  });

  describe('executeRotateShape', () => {
    let mockCanvasActions;
    let mockCanvasState;

    beforeEach(() => {
      mockCanvasActions = {
        updateShape: jest.fn().mockResolvedValue(undefined),
      };
      mockCanvasState = {
        shapes: [
          { id: 'shape-1', type: 'circle', x: 100, y: 200, fill: '#ff0000' },
          { id: 'shape-2', type: 'rect', x: 300, y: 400, fill: '#0000ff' },
        ],
      };
    });

    it('should rotate shape', async () => {
      const args = {
        id: 'shape-1',
        rotation: 45,
      };

      const result = await executeRotateShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Rotated circle to 45°');
      expect(mockCanvasActions.updateShape).toHaveBeenCalledWith('shape-1', {
        rotation: 45,
      });
    });

    it('should handle 0 degree rotation', async () => {
      const args = {
        id: 'shape-1',
        rotation: 0,
      };

      const result = await executeRotateShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(true);
      expect(mockCanvasActions.updateShape).toHaveBeenCalledWith('shape-1', {
        rotation: 0,
      });
    });

    it('should handle 359 degree rotation', async () => {
      const args = {
        id: 'shape-1',
        rotation: 359,
      };

      const result = await executeRotateShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(true);
      expect(mockCanvasActions.updateShape).toHaveBeenCalledWith('shape-1', {
        rotation: 359,
      });
    });

    it('should fail when canvas is empty and no shape can be identified', async () => {
      const args = {
        rotation: 45,
        // No id, color, or type - cannot identify
      };

      const emptyCanvasState = { shapes: [] };
      const result = await executeRotateShape(args, mockCanvasActions, emptyCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No shapes on canvas');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });

    it('should fail when rotation is invalid', async () => {
      const args = {
        id: 'shape-1',
        rotation: 'invalid',
      };

      const result = await executeRotateShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('rotation angle is required');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });

    it('should fail when rotation is negative', async () => {
      const args = {
        id: 'shape-1',
        rotation: -10,
      };

      const result = await executeRotateShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('between 0 and 359');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });

    it('should fail when rotation exceeds 359', async () => {
      const args = {
        id: 'shape-1',
        rotation: 360,
      };

      const result = await executeRotateShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('between 0 and 359');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });

    it('should fail when shape does not exist', async () => {
      const args = {
        id: 'nonexistent-shape',
        rotation: 45,
      };

      const result = await executeRotateShape(args, mockCanvasActions, mockCanvasState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(mockCanvasActions.updateShape).not.toHaveBeenCalled();
    });
  });

  describe('executeToolCall', () => {
    let mockContext;

    beforeEach(() => {
      mockContext = {
        canvasActions: {
          addShape: jest.fn().mockResolvedValue(undefined),
          updateShape: jest.fn().mockResolvedValue(undefined),
          deleteShape: jest.fn().mockResolvedValue(undefined),
        },
        canvasState: {
          shapes: [
            { id: 'shape-1', type: 'circle', x: 100, y: 200, fill: '#ff0000' },
          ],
        },
      };
    });

    it('should execute createShape tool', async () => {
      const args = {
        type: 'circle',
        x: 100,
        y: 200,
        color: 'red',
      };

      const result = await executeToolCall('createShape', args, mockContext);

      expect(result.success).toBe(true);
      expect(mockContext.canvasActions.addShape).toHaveBeenCalled();
    });

    it('should execute getCanvasState tool', async () => {
      const result = await executeToolCall('getCanvasState', {}, mockContext);

      expect(result.success).toBe(true);
      expect(result.canvasState).toBeDefined();
      expect(result.canvasState.shapeCount).toBe(1);
    });

    it('should execute moveShape tool', async () => {
      const args = {
        id: 'shape-1',
        x: 500,
        y: 300,
      };

      const result = await executeToolCall('moveShape', args, mockContext);

      expect(result.success).toBe(true);
      expect(mockContext.canvasActions.updateShape).toHaveBeenCalledWith('shape-1', {
        x: 500,
        y: 300,
      });
    });

    it('should execute updateShapeColor tool', async () => {
      const args = {
        id: 'shape-1',
        color: 'green',
      };

      const result = await executeToolCall('updateShapeColor', args, mockContext);

      expect(result.success).toBe(true);
      expect(mockContext.canvasActions.updateShape).toHaveBeenCalledWith('shape-1', {
        fill: '#008000',
      });
    });

    it('should execute deleteShape tool', async () => {
      const args = {
        id: 'shape-1',
      };

      const result = await executeToolCall('deleteShape', args, mockContext);

      expect(result.success).toBe(true);
      expect(mockContext.canvasActions.deleteShape).toHaveBeenCalledWith('shape-1');
    });

    it('should execute rotateShape tool', async () => {
      const args = {
        id: 'shape-1',
        rotation: 45,
      };

      const result = await executeToolCall('rotateShape', args, mockContext);

      expect(result.success).toBe(true);
      expect(mockContext.canvasActions.updateShape).toHaveBeenCalledWith('shape-1', {
        rotation: 45,
      });
    });

    it('should fail for unknown tool', async () => {
      const result = await executeToolCall('unknownTool', {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });

    it('should execute createGrid tool', async () => {
      const args = {
        rows: 3,
        cols: 3,
        shapeType: 'circle',
        color: 'blue',
        originX: 200,
        originY: 200,
        spacing: 120,
        size: 50,
      };

      const result = await executeToolCall('createGrid', args, mockContext);

      expect(result.success).toBe(true);
      expect(result.count).toBe(9); // 3x3 grid
      expect(result.shapes).toHaveLength(9);
      expect(result.message).toContain('3×3 grid');
    });
  });

  describe('executeCreateGrid', () => {
    let mockCanvasActions;

    beforeEach(() => {
      mockCanvasActions = {
        addShape: jest.fn().mockResolvedValue(undefined),
      };
    });

    it('should create a 3x3 grid of blue squares', async () => {
      const args = {
        rows: 3,
        cols: 3,
        shapeType: 'rectangle',
        color: 'blue',
        originX: 200,
        originY: 200,
        spacing: 120,
        size: 50,
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.count).toBe(9);
      expect(result.shapes).toHaveLength(9);
      
      // Verify first shape
      const firstShape = result.shapes[0];
      expect(firstShape.type).toBe(SHAPE_TYPES.RECT);
      expect(firstShape.fill).toBe('#0000ff'); // normalized blue
      expect(firstShape.width).toBe(100); // size * 2
      expect(firstShape.height).toBe(100);
      
      // Verify last shape position (bottom-right)
      const lastShape = result.shapes[8];
      expect(lastShape.x).toBeCloseTo(440 - 50, 0); // originX(200) + (2*spacing(120)) - width/2(50)
      expect(lastShape.y).toBeCloseTo(440 - 50, 0); // originY(200) + (2*spacing(120)) - height/2(50)
    });

    it('should create a 2x5 grid of circles', async () => {
      const args = {
        rows: 2,
        cols: 5,
        shapeType: 'circle',
        color: 'red',
        originX: 100,
        originY: 100,
        spacing: 100,
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.count).toBe(10); // 2x5 grid
      expect(result.shapes).toHaveLength(10);
      
      // All shapes should be circles
      result.shapes.forEach((shape) => {
        expect(shape.type).toBe(SHAPE_TYPES.CIRCLE);
        expect(shape.fill).toBe('#ff0000'); // normalized red
      });
    });

    it('should use default values for optional parameters', async () => {
      const args = {
        rows: 2,
        cols: 2,
        shapeType: 'triangle',
        color: 'green',
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.count).toBe(4);
      
      // First shape should be at default origin (200, 200)
      const firstShape = result.shapes[0];
      expect(firstShape.x).toBeCloseTo(200 - 50, 0); // Default origin minus half width
      expect(firstShape.y).toBeCloseTo(200 - 50, 0);
    });

    it('should fail with missing required parameters', async () => {
      const args = {
        rows: 3,
        cols: 3,
        // Missing shapeType and color
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should fail with invalid shape type', async () => {
      const args = {
        rows: 2,
        cols: 2,
        shapeType: 'invalid',
        color: 'blue',
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown shape type');
    });

    it('should fail with invalid color', async () => {
      const args = {
        rows: 2,
        cols: 2,
        shapeType: 'circle',
        color: 'not-a-color',
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid color');
    });

    it('should fail with grid exceeding max shapes (100)', async () => {
      const args = {
        rows: 15,
        cols: 15,
        shapeType: 'circle',
        color: 'blue',
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot exceed 100 shapes');
    });

    it('should create grid with exactly 100 shapes', async () => {
      const args = {
        rows: 10,
        cols: 10,
        shapeType: 'circle',
        color: 'purple',
        spacing: 50,
        size: 20,
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.count).toBe(100);
      expect(result.shapes).toHaveLength(100);
    });

    it('should create grid with custom spacing and size', async () => {
      const args = {
        rows: 2,
        cols: 2,
        shapeType: 'rectangle',
        color: 'orange',
        originX: 0,
        originY: 0,
        spacing: 200,
        size: 30,
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(true);
      
      // Check spacing
      const firstShape = result.shapes[0];
      const secondShape = result.shapes[1];
      expect(secondShape.x - firstShape.x).toBeCloseTo(200, 0);
    });

    it('should create text grid with grid position labels', async () => {
      const args = {
        rows: 2,
        cols: 2,
        shapeType: 'text',
        color: 'black',
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(true);
      
      // Text shapes should have grid position as text
      expect(result.shapes[0].text).toBe('(0,0)');
      expect(result.shapes[1].text).toBe('(0,1)');
      expect(result.shapes[2].text).toBe('(1,0)');
      expect(result.shapes[3].text).toBe('(1,1)');
    });

    it('should handle single shape grid (1x1)', async () => {
      const args = {
        rows: 1,
        cols: 1,
        shapeType: 'circle',
        color: 'yellow',
        originX: 500,
        originY: 500,
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.shapes).toHaveLength(1);
      expect(result.shapes[0].x).toBe(500);
      expect(result.shapes[0].y).toBe(500);
    });

    it('should handle single row grid (1xN)', async () => {
      const args = {
        rows: 1,
        cols: 5,
        shapeType: 'rectangle',
        color: 'pink',
        spacing: 80,
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
      
      // All shapes should have same Y coordinate
      const yCoords = result.shapes.map(s => s.y);
      expect(new Set(yCoords).size).toBe(1);
    });

    it('should handle single column grid (Nx1)', async () => {
      const args = {
        rows: 4,
        cols: 1,
        shapeType: 'circle',
        color: 'cyan',
        spacing: 100,
      };

      const result = await executeCreateGrid(args, mockCanvasActions);

      expect(result.success).toBe(true);
      expect(result.count).toBe(4);
      
      // All shapes should have same X coordinate
      const xCoords = result.shapes.map(s => s.x);
      expect(new Set(xCoords).size).toBe(1);
    });
  });
});

