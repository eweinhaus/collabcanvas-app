import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../../../context/AuthContext';
import PrivateRoute from '../PrivateRoute';
import { onAuthStateChanged } from 'firebase/auth';

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

describe('PrivateRoute', () => {
  let authStateChangeCallback;
  let mockUnsubscribe;

  beforeEach(() => {
    mockUnsubscribe = jest.fn();
    authStateChangeCallback = null;

    onAuthStateChanged.mockImplementation((auth, callback) => {
      authStateChangeCallback = callback;
      return mockUnsubscribe;
    });

    jest.clearAllMocks();
  });

  it('should show loading state while checking authentication', () => {
    // Don't call the callback to simulate loading
    onAuthStateChanged.mockImplementation(() => mockUnsubscribe);

    render(
      <AuthProvider>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show login prompt when user is not authenticated', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      authStateChangeCallback = callback;
      callback(null); // No user
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to CollabCanvas')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to start collaborating')).toBeInTheDocument();
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
    };

    onAuthStateChanged.mockImplementation((auth, callback) => {
      authStateChangeCallback = callback;
      callback(mockUser);
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(screen.queryByText('Welcome to CollabCanvas')).not.toBeInTheDocument();
  });

  it('should render multiple children when authenticated', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    };

    onAuthStateChanged.mockImplementation((auth, callback) => {
      authStateChangeCallback = callback;
      callback(mockUser);
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <PrivateRoute>
          <div>Content 1</div>
          <div>Content 2</div>
          <div>Content 3</div>
        </PrivateRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });
  });

  it('should transition from loading to login prompt', async () => {
    // Start with delayed callback
    let delayedCallback;
    onAuthStateChanged.mockImplementation((auth, callback) => {
      delayedCallback = callback;
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Simulate auth initialization completing with no user
    act(() => {
      delayedCallback(null);
    });

    await waitFor(() => {
      expect(screen.getByText('Welcome to CollabCanvas')).toBeInTheDocument();
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should transition from loading to protected content', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    };

    // Start with delayed callback
    let delayedCallback;
    onAuthStateChanged.mockImplementation((auth, callback) => {
      delayedCallback = callback;
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Simulate auth initialization completing
    act(() => {
      delayedCallback(mockUser);
    });

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});

