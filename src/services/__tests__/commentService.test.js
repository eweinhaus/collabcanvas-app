import { serverTimestamp } from 'firebase/firestore';
import * as commentService from '../commentService';
import toast from 'react-hot-toast';

// Mock toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

// Mock Firebase - must define auth structure inline
jest.mock('../firebase', () => ({
  firestore: {},
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  },
}));

// Import the mocked auth for manipulation in tests
import { auth as mockAuth } from '../firebase';

// Mock Firestore functions
const mockAddDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockOnSnapshot = jest.fn();

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    addDoc: (...args) => mockAddDoc(...args),
    getDoc: (...args) => mockGetDoc(...args),
    getDocs: (...args) => mockGetDocs(...args),
    updateDoc: (...args) => mockUpdateDoc(...args),
    deleteDoc: (...args) => mockDeleteDoc(...args),
    onSnapshot: (...args) => mockOnSnapshot(...args),
    query: jest.fn((col) => col),
    orderBy: jest.fn(() => ({})),
    serverTimestamp: jest.fn(() => ({ __type: 'serverTimestamp' })),
  };
});

describe('commentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth mock
    mockAuth.currentUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };
  });

  describe('createComment', () => {
    it('should create a comment with valid data', async () => {
      mockAddDoc.mockResolvedValue({ id: 'comment-123' });

      const result = await commentService.createComment('shape-1', 'This is a test comment');

      expect(result).toEqual({ id: 'comment-123' });
      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          text: 'This is a test comment',
          authorId: 'test-user-123',
          authorName: 'Test User',
          authorEmail: 'test@example.com',
          edited: false,
        })
      );
      expect(serverTimestamp).toHaveBeenCalled();
    });

    it('should trim whitespace from comment text', async () => {
      mockAddDoc.mockResolvedValue({ id: 'comment-123' });

      await commentService.createComment('shape-1', '  Trimmed text  ');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          text: 'Trimmed text',
        })
      );
    });

    it('should throw error if user is not authenticated', async () => {
      mockAuth.currentUser = null;

      await expect(
        commentService.createComment('shape-1', 'Test')
      ).rejects.toThrow('User must be authenticated');

      expect(toast.error).toHaveBeenCalledWith(
        'You must be signed in to comment. Please refresh and sign in again.'
      );
    });

    it('should throw error if text is empty', async () => {
      await expect(
        commentService.createComment('shape-1', '')
      ).rejects.toThrow('non-empty string');

      expect(toast.error).toHaveBeenCalledWith('Comment text is required');
    });

    it('should throw error if text exceeds max length', async () => {
      const longText = 'a'.repeat(501);

      await expect(
        commentService.createComment('shape-1', longText)
      ).rejects.toThrow('exceeds maximum length');

      expect(toast.error).toHaveBeenCalledWith(
        'Comment must be 500 characters or less'
      );
    });

    it('should accept text exactly at max length (500 chars)', async () => {
      mockAddDoc.mockResolvedValue({ id: 'comment-123' });
      const maxLengthText = 'a'.repeat(500);

      await commentService.createComment('shape-1', maxLengthText);

      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should throw error if shapeId is missing', async () => {
      await expect(
        commentService.createComment(null, 'Test')
      ).rejects.toThrow('shapeId is required');
    });

    it('should use email prefix if displayName is missing', async () => {
      mockAuth.currentUser = {
        uid: 'test-user-123',
        email: 'john.doe@example.com',
        displayName: null,
      };
      mockAddDoc.mockResolvedValue({ id: 'comment-123' });

      await commentService.createComment('shape-1', 'Test comment');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          authorName: 'john.doe',
        })
      );
    });

    it('should handle permission denied errors', async () => {
      mockAddDoc.mockRejectedValue({ code: 'permission-denied' });

      await expect(
        commentService.createComment('shape-1', 'Test')
      ).rejects.toHaveProperty('code', 'permission-denied');

      expect(toast.error).toHaveBeenCalledWith(
        'Permission denied. Please refresh the page and sign in again.'
      );
    });
  });

  describe('updateComment', () => {
    it('should update a comment with valid data', async () => {
      // Mock getDoc to return comment owned by current user
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          authorId: 'test-user-123',
          text: 'Old text',
        }),
      });
      mockUpdateDoc.mockResolvedValue();

      const result = await commentService.updateComment(
        'shape-1',
        'comment-123',
        'Updated text'
      );

      expect(result).toEqual({ id: 'comment-123' });
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          text: 'Updated text',
          edited: true,
        })
      );
    });

    it('should throw error if user is not the author', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          authorId: 'different-user',
          text: 'Original text',
        }),
      });

      await expect(
        commentService.updateComment('shape-1', 'comment-123', 'New text')
      ).rejects.toThrow('Unauthorized');

      expect(toast.error).toHaveBeenCalledWith(
        'You can only edit or delete your own comments'
      );
    });

    it('should throw error if comment does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(
        commentService.updateComment('shape-1', 'comment-123', 'New text')
      ).rejects.toThrow('Comment not found');
    });

    it('should throw error if text is empty', async () => {
      await expect(
        commentService.updateComment('shape-1', 'comment-123', '')
      ).rejects.toThrow('non-empty string');
    });

    it('should throw error if text exceeds max length', async () => {
      const longText = 'a'.repeat(501);

      await expect(
        commentService.updateComment('shape-1', 'comment-123', longText)
      ).rejects.toThrow('exceeds maximum length');
    });

    it('should trim whitespace from updated text', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ authorId: 'test-user-123' }),
      });
      mockUpdateDoc.mockResolvedValue();

      await commentService.updateComment('shape-1', 'comment-123', '  Trimmed  ');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          text: 'Trimmed',
        })
      );
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment if user is the author', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ authorId: 'test-user-123' }),
      });
      mockDeleteDoc.mockResolvedValue();

      const result = await commentService.deleteComment('shape-1', 'comment-123');

      expect(result).toEqual({ id: 'comment-123' });
      expect(mockDeleteDoc).toHaveBeenCalledWith({});
    });

    it('should throw error if user is not the author', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ authorId: 'different-user' }),
      });

      await expect(
        commentService.deleteComment('shape-1', 'comment-123')
      ).rejects.toThrow('Unauthorized');

      expect(toast.error).toHaveBeenCalledWith(
        'You can only edit or delete your own comments'
      );
    });

    it('should throw error if comment does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(
        commentService.deleteComment('shape-1', 'comment-123')
      ).rejects.toThrow('Comment not found');
    });

    it('should throw error if shapeId is missing', async () => {
      await expect(
        commentService.deleteComment(null, 'comment-123')
      ).rejects.toThrow('shapeId and commentId are required');
    });

    it('should throw error if commentId is missing', async () => {
      await expect(
        commentService.deleteComment('shape-1', null)
      ).rejects.toThrow('shapeId and commentId are required');
    });
  });

  describe('getComments', () => {
    it('should fetch all comments for a shape', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          data: () => ({
            text: 'First comment',
            authorId: 'user-1',
            authorName: 'User One',
            authorEmail: 'user1@example.com',
            createdAt: { toMillis: () => 1000000 },
            updatedAt: { toMillis: () => 1000000 },
            edited: false,
          }),
        },
        {
          id: 'comment-2',
          data: () => ({
            text: 'Second comment',
            authorId: 'user-2',
            authorName: 'User Two',
            authorEmail: 'user2@example.com',
            createdAt: { toMillis: () => 2000000 },
            updatedAt: { toMillis: () => 2000000 },
            edited: false,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({
        forEach: (callback) => {
          mockComments.forEach(callback);
        },
      });

      const comments = await commentService.getComments('shape-1');

      expect(comments).toHaveLength(2);
      expect(comments[0]).toEqual({
        id: 'comment-1',
        text: 'First comment',
        authorId: 'user-1',
        authorName: 'User One',
        authorEmail: 'user1@example.com',
        createdAt: 1000000,
        updatedAt: 1000000,
        edited: false,
      });
    });

    it('should return empty array if no comments', async () => {
      mockGetDocs.mockResolvedValue({
        forEach: (callback) => {
          // No comments
        },
      });

      const comments = await commentService.getComments('shape-1');

      expect(comments).toEqual([]);
    });

    it('should throw error if shapeId is missing', async () => {
      await expect(commentService.getComments(null)).rejects.toThrow(
        'shapeId is required'
      );
    });

    it('should handle missing timestamp gracefully', async () => {
      mockGetDocs.mockResolvedValue({
        forEach: (callback) => {
          callback({
            id: 'comment-1',
            data: () => ({
              text: 'Comment without timestamp',
              authorId: 'user-1',
              authorName: 'User',
              authorEmail: 'user@example.com',
              createdAt: null,
              updatedAt: null,
              edited: false,
            }),
          });
        },
      });

      const comments = await commentService.getComments('shape-1');

      expect(comments[0].createdAt).toBeNull();
      expect(comments[0].updatedAt).toBeNull();
    });
  });

  describe('subscribeToComments', () => {
    it('should subscribe to real-time comment updates', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockOnSnapshot.mockImplementation((query, callback) => {
        // Simulate initial snapshot
        callback({
          docChanges: () => [
            {
              type: 'added',
              doc: {
                id: 'comment-1',
                data: () => ({
                  text: 'New comment',
                  authorId: 'user-1',
                  authorName: 'User',
                  authorEmail: 'user@example.com',
                  createdAt: { toMillis: () => 1000000 },
                  updatedAt: { toMillis: () => 1000000 },
                  edited: false,
                }),
              },
            },
          ],
        });
        return mockUnsubscribe;
      });

      const unsubscribe = commentService.subscribeToComments(
        'shape-1',
        'default',
        mockCallback
      );

      expect(mockCallback).toHaveBeenCalledWith({
        type: 'added',
        comment: expect.objectContaining({
          id: 'comment-1',
          text: 'New comment',
        }),
      });

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle modified comments', () => {
      const mockCallback = jest.fn();

      mockOnSnapshot.mockImplementation((query, callback) => {
        callback({
          docChanges: () => [
            {
              type: 'modified',
              doc: {
                id: 'comment-1',
                data: () => ({
                  text: 'Updated comment',
                  authorId: 'user-1',
                  authorName: 'User',
                  authorEmail: 'user@example.com',
                  createdAt: { toMillis: () => 1000000 },
                  updatedAt: { toMillis: () => 2000000 },
                  edited: true,
                }),
              },
            },
          ],
        });
        return jest.fn();
      });

      commentService.subscribeToComments('shape-1', 'default', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        type: 'modified',
        comment: expect.objectContaining({
          text: 'Updated comment',
          edited: true,
        }),
      });
    });

    it('should handle removed comments', () => {
      const mockCallback = jest.fn();

      mockOnSnapshot.mockImplementation((query, callback) => {
        callback({
          docChanges: () => [
            {
              type: 'removed',
              doc: {
                id: 'comment-1',
                data: () => ({
                  text: 'Deleted comment',
                  authorId: 'user-1',
                  authorName: 'User',
                  authorEmail: 'user@example.com',
                  createdAt: { toMillis: () => 1000000 },
                  updatedAt: { toMillis: () => 1000000 },
                  edited: false,
                }),
              },
            },
          ],
        });
        return jest.fn();
      });

      commentService.subscribeToComments('shape-1', 'default', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        type: 'removed',
        comment: expect.objectContaining({
          id: 'comment-1',
        }),
      });
    });

    it('should throw error if shapeId is missing', () => {
      expect(() =>
        commentService.subscribeToComments(null, 'default', jest.fn())
      ).toThrow('shapeId is required');
    });

    it('should throw error if callback is not a function', () => {
      expect(() =>
        commentService.subscribeToComments('shape-1', 'default', null)
      ).toThrow('callback must be a function');
    });

    it('should handle subscription errors gracefully', () => {
      const mockCallback = jest.fn();
      const mockErrorHandler = jest.fn();

      mockOnSnapshot.mockImplementation((query, callback, errorHandler) => {
        // Simulate error
        errorHandler(new Error('Connection lost'));
        return jest.fn();
      });

      commentService.subscribeToComments('shape-1', 'default', mockCallback);

      expect(toast.error).toHaveBeenCalledWith(
        'Unable to load comments. Please refresh the page.'
      );
    });

    it('should handle permission-denied errors with specific message', () => {
      const mockCallback = jest.fn();

      mockOnSnapshot.mockImplementation((query, callback, errorHandler) => {
        const error = new Error('Permission denied');
        error.code = 'permission-denied';
        errorHandler(error);
        return jest.fn();
      });

      commentService.subscribeToComments('shape-1', 'default', mockCallback);

      expect(toast.error).toHaveBeenCalledWith(
        'Unable to load comments. Please refresh the page and sign in again.'
      );
    });

    it('should not show error for transient unavailable errors', () => {
      const mockCallback = jest.fn();

      mockOnSnapshot.mockImplementation((query, callback, errorHandler) => {
        const error = new Error('Unavailable');
        error.code = 'unavailable';
        errorHandler(error);
        return jest.fn();
      });

      toast.error.mockClear();
      commentService.subscribeToComments('shape-1', 'default', mockCallback);

      // Should not show error toast for transient issues
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('fromFirestoreDoc', () => {
    it('should convert Firestore doc to comment object', () => {
      const mockDoc = {
        id: 'comment-123',
        data: () => ({
          text: 'Test comment',
          authorId: 'user-1',
          authorName: 'Test User',
          authorEmail: 'test@example.com',
          createdAt: { toMillis: () => 1000000 },
          updatedAt: { toMillis: () => 2000000 },
          edited: true,
        }),
      };

      const result = commentService.__testables.fromFirestoreDoc(mockDoc);

      expect(result).toEqual({
        id: 'comment-123',
        text: 'Test comment',
        authorId: 'user-1',
        authorName: 'Test User',
        authorEmail: 'test@example.com',
        createdAt: 1000000,
        updatedAt: 2000000,
        edited: true,
      });
    });

    it('should handle missing optional fields gracefully', () => {
      const mockDoc = {
        id: 'comment-123',
        data: () => ({
          text: 'Test',
          // Missing most fields
        }),
      };

      const result = commentService.__testables.fromFirestoreDoc(mockDoc);

      expect(result).toEqual({
        id: 'comment-123',
        text: 'Test',
        authorId: null,
        authorName: 'Unknown',
        authorEmail: '',
        createdAt: null,
        updatedAt: null,
        edited: false,
      });
    });

    it('should return null if doc has no data', () => {
      const mockDoc = {
        id: 'comment-123',
        data: () => null,
      };

      const result = commentService.__testables.fromFirestoreDoc(mockDoc);

      expect(result).toBeNull();
    });
  });

  describe('MAX_COMMENT_LENGTH constant', () => {
    it('should be set to 500', () => {
      expect(commentService.__testables.MAX_COMMENT_LENGTH).toBe(500);
    });
  });
});

