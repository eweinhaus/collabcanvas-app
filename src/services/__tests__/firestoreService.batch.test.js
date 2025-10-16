import { createShapesBatch } from '../firestoreService';
import { writeBatch, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  writeBatch: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' })),
}));

// Mock firebase service
jest.mock('../firebase', () => ({
  firestore: {},
  auth: {
    currentUser: { uid: 'test-user' },
  },
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
}));

describe('createShapesBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array for empty input', async () => {
    const result = await createShapesBatch([]);
    expect(result).toEqual([]);
  });

  it('should batch create multiple shapes', async () => {
    const mockBatch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    writeBatch.mockReturnValue(mockBatch);
    doc.mockReturnValue({});

    const shapes = [
      { id: 'shape-1', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#ff0000' },
      { id: 'shape-2', type: 'circle', x: 200, y: 200, radius: 50, fill: '#00ff00' },
      { id: 'shape-3', type: 'text', x: 100, y: 100, text: 'Hello', fontSize: 16, fill: '#0000ff' },
    ];

    const result = await createShapesBatch(shapes);

    expect(writeBatch).toHaveBeenCalled();
    expect(mockBatch.set).toHaveBeenCalledTimes(3);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      { id: 'shape-1' },
      { id: 'shape-2' },
      { id: 'shape-3' },
    ]);
  });

  it('should chunk large batches (>500 shapes)', async () => {
    const mockBatch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    writeBatch.mockReturnValue(mockBatch);
    doc.mockReturnValue({});

    // Create 750 shapes
    const shapes = Array.from({ length: 750 }, (_, i) => ({
      id: `shape-${i}`,
      type: 'rect',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: '#ff0000',
    }));

    const result = await createShapesBatch(shapes);

    // Should be called twice for 750 shapes (500 + 250)
    expect(mockBatch.commit).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(750);
  });

  it('should handle batch commit errors', async () => {
    const mockBatch = {
      set: jest.fn(),
      commit: jest.fn().mockRejectedValue(new Error('Batch failed')),
    };
    writeBatch.mockReturnValue(mockBatch);
    doc.mockReturnValue({});

    const shapes = [
      { id: 'shape-1', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#ff0000' },
    ];

    await expect(createShapesBatch(shapes)).rejects.toThrow('Batch failed');
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to create'));
  });

  it('should use default boardId if not provided', async () => {
    const mockBatch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    writeBatch.mockReturnValue(mockBatch);
    doc.mockReturnValue({});

    const shapes = [
      { id: 'shape-1', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#ff0000' },
    ];

    await createShapesBatch(shapes);

    expect(doc).toHaveBeenCalledWith({}, 'boards', 'default', 'shapes', 'shape-1');
  });
});

