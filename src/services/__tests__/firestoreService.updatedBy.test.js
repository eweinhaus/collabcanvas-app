/**
 * Tests for updatedBy functionality in firestoreService
 */

import { updateShape, updateShapeText, deleteShape, createShape } from '../firestoreService';
import { updateDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth } from '../firebase';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../firebase', () => ({
  firestore: {},
  auth: {
    currentUser: { uid: 'test-user-id' },
  },
}));

describe('firestoreService - updatedBy tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default auth user with displayName
    auth.currentUser = { 
      uid: 'test-user-123',
      displayName: 'Test User',
      email: 'test@example.com'
    };
  });

  describe('createShape', () => {
    test('sets both createdBy and updatedBy on creation', async () => {
      const mockTx = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn(),
      };

      runTransaction.mockImplementation(async (db, callback) => {
        return callback(mockTx);
      });

      serverTimestamp.mockReturnValue('TIMESTAMP');

      const shape = {
        id: 'shape-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        fill: '#FF0000',
      };

      await createShape(shape);

      const setCall = mockTx.set.mock.calls[0];
      expect(setCall).toBeDefined();
      expect(setCall[1]).toMatchObject({
        createdBy: 'test-user-123',
        createdByName: 'Test User',
        updatedBy: 'test-user-123',
        updatedByName: 'Test User',
        createdAt: 'TIMESTAMP',
        updatedAt: 'TIMESTAMP',
      });
    });

    test('throws error when user not authenticated', async () => {
      auth.currentUser = null;

      const shape = {
        id: 'shape-1',
        type: 'rect',
      };

      await expect(createShape(shape)).rejects.toThrow(
        'User must be authenticated to create shapes'
      );
    });
  });

  describe('updateShape', () => {
    test('sets updatedBy field on update', async () => {
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      await updateShape('shape-1', { x: 200, y: 300 });

      const updateCall = updateDoc.mock.calls[0];
      expect(updateCall).toBeDefined();
      expect(updateCall[1]).toMatchObject({
        updatedBy: 'test-user-123',
        updatedByName: 'Test User',
        updatedAt: 'TIMESTAMP',
        'props.x': 200,
        'props.y': 300,
      });
    });

    test('throws error when user not authenticated', async () => {
      auth.currentUser = null;

      await expect(updateShape('shape-1', { x: 200 })).rejects.toThrow(
        'User must be authenticated to update shapes'
      );
    });

    test('does not set id or type in props', async () => {
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      await updateShape('shape-1', { id: 'new-id', type: 'circle', x: 100 });

      const updatePayload = updateDoc.mock.calls[0][1];
      expect(updatePayload).toMatchObject({
        'props.x': 100,
      });

      // Ensure id and type are NOT in the update payload
      expect(updatePayload).not.toHaveProperty('props.id');
      expect(updatePayload).not.toHaveProperty('props.type');
    });

    test('handles empty updates object', async () => {
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      await updateShape('shape-1', {});

      const updateCall = updateDoc.mock.calls[0];
      expect(updateCall).toBeDefined();
      expect(updateCall[1]).toMatchObject({
        updatedBy: 'test-user-123',
        updatedByName: 'Test User',
        updatedAt: 'TIMESTAMP',
      });
    });
  });

  describe('updateShapeText', () => {
    test('sets updatedBy field when updating text', async () => {
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      await updateShapeText('shape-1', 'New text content');

      const updateCall = updateDoc.mock.calls[0];
      expect(updateCall).toBeDefined();
      expect(updateCall[1]).toMatchObject({
        'props.text': 'New text content',
        updatedBy: 'test-user-123',
        updatedByName: 'Test User',
        updatedAt: 'TIMESTAMP',
      });
    });

    test('throws error when user not authenticated', async () => {
      auth.currentUser = null;

      await expect(updateShapeText('shape-1', 'text')).rejects.toThrow(
        'User must be authenticated to update shapes'
      );
    });

    test('handles empty text', async () => {
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      await updateShapeText('shape-1', '');

      const updateCall = updateDoc.mock.calls[0];
      expect(updateCall).toBeDefined();
      expect(updateCall[1]).toMatchObject({
        'props.text': '',
        updatedBy: 'test-user-123',
        updatedByName: 'Test User',
      });
    });
  });

  describe('deleteShape', () => {
    test('sets updatedBy field when deleting (soft delete)', async () => {
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      await deleteShape('shape-1');

      const updateCall = updateDoc.mock.calls[0];
      expect(updateCall).toBeDefined();
      expect(updateCall[1]).toMatchObject({
        deleted: true,
        deletedAt: 'TIMESTAMP',
        updatedBy: 'test-user-123',
        updatedByName: 'Test User',
        updatedAt: 'TIMESTAMP',
      });
    });

    test('throws error when user not authenticated', async () => {
      auth.currentUser = null;

      await expect(deleteShape('shape-1')).rejects.toThrow(
        'User must be authenticated to delete shapes'
      );
    });
  });

  describe('fromFirestoreDoc - updatedBy fallback', () => {
    const { __testables } = require('../firestoreService');
    const { fromFirestoreDoc } = __testables;

    test('returns updatedBy when present', () => {
      const mockDoc = {
        id: 'shape-1',
        data: () => ({
          id: 'shape-1',
          type: 'rect',
          props: { x: 100, y: 100 },
          createdBy: 'user-1',
          updatedBy: 'user-2',
          deleted: false,
        }),
      };

      const shape = fromFirestoreDoc(mockDoc);
      expect(shape.updatedBy).toBe('user-2');
    });

    test('falls back to createdBy when updatedBy missing', () => {
      const mockDoc = {
        id: 'shape-1',
        data: () => ({
          id: 'shape-1',
          type: 'rect',
          props: { x: 100, y: 100 },
          createdBy: 'user-1',
          // updatedBy missing
          deleted: false,
        }),
      };

      const shape = fromFirestoreDoc(mockDoc);
      expect(shape.updatedBy).toBe('user-1');
    });

    test('returns null when both createdBy and updatedBy missing', () => {
      const mockDoc = {
        id: 'shape-1',
        data: () => ({
          id: 'shape-1',
          type: 'rect',
          props: { x: 100, y: 100 },
          // Both missing
          deleted: false,
        }),
      };

      const shape = fromFirestoreDoc(mockDoc);
      expect(shape.createdBy).toBeNull();
      expect(shape.updatedBy).toBeNull();
    });
  });
});

