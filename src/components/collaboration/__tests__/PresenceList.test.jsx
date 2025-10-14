import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PresenceList from '../../collaboration/PresenceList';

describe('PresenceList', () => {
  it('renders count and user items', () => {
    const users = [
      { uid: 'a', name: 'Alice', color: '#f00' },
      { uid: 'b', name: 'Bob', color: '#0f0' },
    ];
    render(<PresenceList users={users} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});


