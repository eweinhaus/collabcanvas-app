import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../../context/AuthContext';
import LoginButton from '../LoginButton';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('../../../services/firebase', () => ({
  auth: {},
  googleProvider: {},
  realtimeDB: {},
}));

// Mock presence service
jest.mock('../../../services/presenceService', () => ({
  setPresence: jest.fn(() => Promise.resolve()),
  removePresence: jest.fn(() => Promise.resolve()),
  registerDisconnectCleanup: jest.fn(() => () => {}),
}));

describe('LoginButton Integration Tests', () => {
  let authStateChangeCallback;
  let mockUnsubscribe;

  beforeEach(() => {
    mockUnsubscribe = jest.fn();
    authStateChangeCallback = null;

    // Reset all mocks
    jest.clearAllMocks();

    // Set default implementation
    onAuthStateChanged.mockImplementation((auth, callback) => {
      authStateChangeCallback = callback;
      // Immediately call with no user to initialize
      callback(null);
      return mockUnsubscribe;
    });

    // Reset signInWithPopup to default (no error)
    signInWithPopup.mockReset();
    
    // Reset firebaseSignOut to default (no error)
    firebaseSignOut.mockReset();
  });

  describe('Login Flow', () => {
    it('should display "Sign in with Google" button when not authenticated', async () => {
      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
      });
    });

    it('should call signInWithPopup when login button is clicked', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      signInWithPopup.mockResolvedValue({
        user: mockUser,
      });

      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );

      const loginButton = await screen.findByText('Sign in with Google');
      
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithPopup).toHaveBeenCalled();
      });
    });

    it('should display user info after successful login', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      signInWithPopup.mockResolvedValue({
        user: mockUser,
      });

      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );

      const loginButton = await screen.findByText('Sign in with Google');
      
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });
    });

    it('should display email if displayName is not available', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: null,
        photoURL: null,
      };

      // Initialize with logged-in user
      onAuthStateChanged.mockImplementation((auth, callback) => {
        authStateChangeCallback = callback;
        callback(mockUser);
        return mockUnsubscribe;
      });

      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    it('should display user avatar if photoURL is available', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      // Initialize with logged-in user
      onAuthStateChanged.mockImplementation((auth, callback) => {
        authStateChangeCallback = callback;
        callback(mockUser);
        return mockUnsubscribe;
      });

      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );

      await waitFor(() => {
        const avatar = screen.getByAltText('Test User');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute('src', 'https://example.com/photo.jpg');
      });
    });
  });

  describe('Logout Flow', () => {
    it('should call firebaseSignOut when logout button is clicked', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      // Initialize with logged-in user
      onAuthStateChanged.mockImplementation((auth, callback) => {
        authStateChangeCallback = callback;
        callback(mockUser);
        return mockUnsubscribe;
      });

      firebaseSignOut.mockResolvedValue();

      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );

      const logoutButton = await screen.findByText('Sign Out');
      
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(firebaseSignOut).toHaveBeenCalled();
      });
    });

    it('should display login button after logout', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      let currentUser = mockUser;

      // Mock dynamic auth state
      onAuthStateChanged.mockImplementation((auth, callback) => {
        authStateChangeCallback = callback;
        callback(currentUser);
        return mockUnsubscribe;
      });

      firebaseSignOut.mockImplementation(async () => {
        currentUser = null;
        authStateChangeCallback(null);
      });

      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );

      const logoutButton = await screen.findByText('Sign Out');
      
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading state during sign in', async () => {
      signInWithPopup.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );

      const loginButton = await screen.findByText('Sign in with Google');
      
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('should show initial loading state on mount', () => {
      // Mock to never call callback (simulate slow initialization)
      onAuthStateChanged.mockImplementation(() => mockUnsubscribe);

      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // Note: Error handling is covered by AuthContext unit tests
  // Integration tests focus on successful flows to avoid promise rejection complexity
});

