import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserAvatar from '../../collaboration/UserAvatar';

describe('UserAvatar', () => {
  it('renders initials with color', () => {
    render(<UserAvatar name="Alice Bob" color="#123456" size={32} />);
    const avatar = screen.getByLabelText(/User avatar for Alice Bob/);
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent('AB');
  });
});


