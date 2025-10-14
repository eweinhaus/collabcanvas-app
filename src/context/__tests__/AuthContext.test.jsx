import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('../../services/firebase', () => ({
  auth: {},
  googleProvider: {},
  realtimeDB: {},
}));

// Mock presence service
jest.mock('../../services/presenceService', () => ({
  setPresence: jest.fn(() => Promise.resolve()),
  removePresence: jest.fn(() => Promise.resolve()),
  registerDisconnectCleanup: jest.fn(() => () => {}),
}));

describe('AuthContext', () => {
  let mockUnsubscribe;
  let authStateChangeCallback;

  beforeEach(() => {
    mockUnsubscribe = jest.fn();
    authStateChangeCallback = null;
    
    // Mock onAuthStateChanged to capture the callback
    onAuthStateChanged.mockImplementation((auth, callback, errorCallback) => {
      authStateChangeCallback = callback;
      return mockUnsubscribe;
    });

    jest.clearAllMocks();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');
      
      consoleSpy.mockRestore();
    });

    it('should return auth context when used inside AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('signInWithGoogle');
      expect(result.current).toHaveProperty('signOut');
    });
  });

  describe('AuthProvider', () => {
    it('should initialize with loading true and no user', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should set loading to false after auth state is initialized', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Simulate no user logged in
      act(() => {
        authStateChangeCallback(null);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set user when Firebase returns authenticated user', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
        });
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle auth state change errors', async () => {
      // Mock onAuthStateChanged to call error callback
      onAuthStateChanged.mockImplementation((auth, callback, errorCallback) => {
        errorCallback(new Error('Auth error'));
        return mockUnsubscribe;
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Auth error');
        expect(result.current.loading).toBe(false);
      });

      consoleSpy.mockRestore();
    });

    it('should unsubscribe on unmount', () => {
      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in user with Google successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      signInWithPopup.mockResolvedValue({
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Initialize auth state
      act(() => {
        authStateChangeCallback(null);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Sign in
      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(signInWithPopup).toHaveBeenCalled();
      expect(result.current.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
    });

    it('should handle sign in errors', async () => {
      const mockError = new Error('Sign in failed');
      signInWithPopup.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Initialize auth state
      act(() => {
        authStateChangeCallback(null);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Attempt sign in
      await act(async () => {
        try {
          await result.current.signInWithGoogle();
        } catch (err) {
          expect(err.message).toBe('Sign in failed');
        }
      });

      expect(result.current.error).toBe('Sign in failed');
      
      consoleSpy.mockRestore();
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      firebaseSignOut.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Set initial user
      act(() => {
        authStateChangeCallback({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
        });
      });

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      // Sign out
      await act(async () => {
        await result.current.signOut();
      });

      expect(firebaseSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('should handle sign out errors', async () => {
      const mockError = new Error('Sign out failed');
      firebaseSignOut.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Set initial user
      act(() => {
        authStateChangeCallback({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
        });
      });

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      // Attempt sign out
      await act(async () => {
        try {
          await result.current.signOut();
        } catch (err) {
          expect(err.message).toBe('Sign out failed');
        }
      });

      expect(result.current.error).toBe('Sign out failed');
      
      consoleSpy.mockRestore();
    });
  });
});

