import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';

// Mock AuthContext
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { uid: 'test-user-123' } })),
}));

// Mock AIContext
jest.mock('../../../context/AIContext', () => ({
  useAI: jest.fn(() => ({
    history: [],
    clearHistory: jest.fn(),
  })),
}));

// Mock AIPrompt component
jest.mock('../../ai/AIPrompt', () => {
  return function AIPrompt() {
    return <div data-testid="ai-prompt">AI Prompt</div>;
  };
});

// Mock AIHistory component
jest.mock('../../ai/AIHistory', () => {
  return function AIHistory({ history, onClear }) {
    return (
      <div data-testid="ai-history">
        History: {history.length} entries
        <button onClick={onClear}>Clear</button>
      </div>
    );
  };
});

// Mock PresenceList
jest.mock('../../collaboration/PresenceList', () => {
  return function PresenceList({ users, className, currentUserId }) {
    return (
      <div data-testid="presence-list" className={className} data-current-user={currentUserId}>
        {users.length} users
      </div>
    );
  };
});

describe('Sidebar', () => {
  it('renders with closed state by default', () => {
    render(<Sidebar open={false} users={[]} />);
    
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sidebar');
    expect(sidebar).not.toHaveClass('sidebar--open');
    expect(screen.getByTestId('ai-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('ai-history')).toBeInTheDocument();
  });

  it('renders with open state when open prop is true', () => {
    render(<Sidebar open={true} users={[]} />);
    
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sidebar--open');
    expect(screen.getByTestId('ai-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('ai-history')).toBeInTheDocument();
  });

  it('renders PresenceList with users', () => {
    const users = [
      { uid: '1', name: 'User 1', color: '#ff0000' },
      { uid: '2', name: 'User 2', color: '#00ff00' },
    ];
    
    render(<Sidebar open={true} users={users} />);
    
    expect(screen.getByTestId('presence-list')).toBeInTheDocument();
    expect(screen.getByText('2 users')).toBeInTheDocument();
  });

  it('passes className to PresenceList', () => {
    render(<Sidebar open={true} users={[]} />);
    
    const presenceList = screen.getByTestId('presence-list');
    expect(presenceList).toHaveClass('sidebar__presence');
  });

  it('renders AIHistory component', () => {
    render(<Sidebar open={true} users={[]} />);
    
    expect(screen.getByTestId('ai-history')).toBeInTheDocument();
    expect(screen.getByText(/History: 0 entries/)).toBeInTheDocument();
  });
});

