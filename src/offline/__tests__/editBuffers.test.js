/**
 * Tests for Edit Buffers
 */

import { setEditBuffer, getEditBuffer, removeEditBuffer, getAllEditBuffers, clearAllEditBuffers } from '../editBuffers';
import * as idbKeyval from 'idb-keyval';

jest.mock('idb-keyval');

describe('EditBuffers', () => {
  const mockShapeId = 'shape-123';
  const mockShapeData = {
    id: mockShapeId,
    type: 'rect',
    x: 100,
    y: 200,
    width: 150,
    height: 100,
    fill: 'blue',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful IDB operations
    idbKeyval.set.mockResolvedValue(undefined);
    idbKeyval.get.mockResolvedValue(null);
    idbKeyval.del.mockResolvedValue(undefined);
    idbKeyval.keys.mockResolvedValue([]);
  });

  describe('setEditBuffer', () => {
    it('should store shape data with timestamp', async () => {
      await setEditBuffer(mockShapeId, mockShapeData);

      expect(idbKeyval.set).toHaveBeenCalledWith(
        `editBuffer:${mockShapeId}`,
        expect.objectContaining({
          ...mockShapeData,
          updatedAt: expect.any(Number),
          bufferedAt: expect.any(Number),
        })
      );
    });

    it('should handle IDB errors gracefully', async () => {
      idbKeyval.set.mockRejectedValue(new Error('IDB error'));

      // Should not throw
      await expect(setEditBuffer(mockShapeId, mockShapeData)).resolves.not.toThrow();
    });
  });

  describe('getEditBuffer', () => {
    it('should retrieve stored buffer', async () => {
      const storedData = {
        ...mockShapeData,
        updatedAt: Date.now(),
        bufferedAt: Date.now(),
      };
      idbKeyval.get.mockResolvedValue(storedData);

      const result = await getEditBuffer(mockShapeId);

      expect(result).toEqual(storedData);
      expect(idbKeyval.get).toHaveBeenCalledWith(`editBuffer:${mockShapeId}`);
    });

    it('should return null when buffer does not exist', async () => {
      idbKeyval.get.mockResolvedValue(null);

      const result = await getEditBuffer(mockShapeId);

      expect(result).toBeNull();
    });

    it('should handle IDB errors gracefully with SessionStorage fallback', async () => {
      const storedData = {
        ...mockShapeData,
        updatedAt: Date.now(),
        bufferedAt: Date.now(),
      };
      
      // IDB fails
      idbKeyval.get.mockRejectedValue(new Error('IDB error'));
      // SessionStorage succeeds as fallback
      Storage.prototype.getItem = jest.fn(() => JSON.stringify(storedData));

      const result = await getEditBuffer(mockShapeId);

      // Should fallback to SessionStorage successfully
      expect(result).toEqual(storedData);
    });
  });

  describe('removeEditBuffer', () => {
    it('should remove buffer from storage', async () => {
      await removeEditBuffer(mockShapeId);

      expect(idbKeyval.del).toHaveBeenCalledWith(`editBuffer:${mockShapeId}`);
    });

    it('should handle IDB errors gracefully', async () => {
      idbKeyval.del.mockRejectedValue(new Error('IDB error'));

      // Should not throw
      await expect(removeEditBuffer(mockShapeId)).resolves.not.toThrow();
    });
  });

  describe('getAllEditBuffers', () => {
    it('should retrieve all stored buffers', async () => {
      const mockKeys = ['editBuffer:shape-1', 'editBuffer:shape-2', 'other-key'];
      const mockData1 = { id: 'shape-1', x: 10, y: 20 };
      const mockData2 = { id: 'shape-2', x: 30, y: 40 };

      idbKeyval.keys.mockResolvedValue(mockKeys);
      idbKeyval.get
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      const result = await getAllEditBuffers();

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { shapeId: 'shape-1', data: mockData1 },
        { shapeId: 'shape-2', data: mockData2 },
      ]);
    });

    it('should return empty array on errors', async () => {
      idbKeyval.keys.mockRejectedValue(new Error('IDB error'));

      const result = await getAllEditBuffers();

      expect(result).toEqual([]);
    });
  });

  describe('clearAllEditBuffers', () => {
    it('should clear all edit buffers', async () => {
      const mockKeys = ['editBuffer:shape-1', 'editBuffer:shape-2', 'other-key'];
      idbKeyval.keys.mockResolvedValue(mockKeys);

      await clearAllEditBuffers();

      expect(idbKeyval.del).toHaveBeenCalledTimes(2);
      expect(idbKeyval.del).toHaveBeenCalledWith('editBuffer:shape-1');
      expect(idbKeyval.del).toHaveBeenCalledWith('editBuffer:shape-2');
      expect(idbKeyval.del).not.toHaveBeenCalledWith('other-key');
    });

    it('should handle IDB errors gracefully', async () => {
      idbKeyval.keys.mockRejectedValue(new Error('IDB error'));

      // Should not throw
      await expect(clearAllEditBuffers()).resolves.not.toThrow();
    });
  });
});

