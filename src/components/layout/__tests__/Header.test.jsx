import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { useAuth } from '../../../context/AuthContext';

// Mock AuthContext
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock UserAvatar
jest.mock('../../collaboration/UserAvatar', () => {
  return function UserAvatar({ name, size }) {
    return <div data-testid="user-avatar">{name} ({size}px)</div>;
  };
});

// Mock LoginButton
jest.mock('../../auth/LoginButton', () => {
  return function LoginButton() {
    return <button data-testid="login-button">Login</button>;
  };
});

describe('Header', () => {
  it('renders logo and title', () => {
    useAuth.mockReturnValue({ user: null });
    
    render(<Header />);
    
    expect(screen.getByAltText('CollabCanvas logo')).toBeInTheDocument();
    expect(screen.getByText('CollabCanvas')).toBeInTheDocument();
  });

  it('renders LoginButton when user is not authenticated', () => {
    useAuth.mockReturnValue({ user: null });
    
    render(<Header />);
    
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('renders user info when authenticated', () => {
    useAuth.mockReturnValue({
      user: {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
      },
    });
    
    render(<Header />);
    
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders email when displayName is not available', () => {
    useAuth.mockReturnValue({
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
      },
    });
    
    render(<Header />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls onMenuToggle when menu button is clicked', () => {
    useAuth.mockReturnValue({ user: null });
    const onMenuToggle = jest.fn();
    
    render(<Header onMenuToggle={onMenuToggle} />);
    
    const menuButton = screen.getByLabelText('Toggle sidebar menu');
    fireEvent.click(menuButton);
    
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('hides menu button when showMenuButton is false', () => {
    useAuth.mockReturnValue({ user: null });
    
    render(<Header showMenuButton={false} />);
    
    expect(screen.queryByLabelText('Toggle sidebar menu')).not.toBeInTheDocument();
  });
});

