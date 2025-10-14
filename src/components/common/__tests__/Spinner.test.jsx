import { render, screen } from '@testing-library/react';
import Spinner from '../Spinner';

describe('Spinner', () => {
  it('renders spinner SVG', () => {
    const { container } = render(<Spinner />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('spinner');
  });

  it('renders with default message', () => {
    const { container } = render(<Spinner />);
    
    const message = container.querySelector('.spinner__message');
    expect(message).toHaveTextContent('Loading...');
  });

  it('renders with custom message', () => {
    const { container } = render(<Spinner message="Please wait..." />);
    
    const message = container.querySelector('.spinner__message');
    expect(message).toHaveTextContent('Please wait...');
  });

  it('renders with custom size', () => {
    const { container } = render(<Spinner size={60} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '60');
    expect(svg).toHaveAttribute('height', '60');
  });

  it('has appropriate accessibility attributes', () => {
    render(<Spinner message="Loading data" />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
    
    // Check for sr-only text
    expect(screen.getByText('Loading data', { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('does not render message text when message is null', () => {
    const { container } = render(<Spinner message={null} />);
    
    const messageElement = container.querySelector('.spinner__message');
    expect(messageElement).not.toBeInTheDocument();
  });
});

