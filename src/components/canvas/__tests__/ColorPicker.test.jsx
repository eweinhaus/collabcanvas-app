import { render, screen, fireEvent } from '@testing-library/react';
import ColorPicker from '../ColorPicker';

describe('ColorPicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSelectColor: jest.fn(),
    x: 100,
    y: 100,
  };

  it('does not render when isOpen is false', () => {
    render(<ColorPicker {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(<ColorPicker {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Choose Color')).toBeInTheDocument();
  });

  it('renders all color swatches', () => {
    render(<ColorPicker {...defaultProps} />);
    
    const swatches = document.querySelectorAll('.color-picker__swatch');
    expect(swatches.length).toBeGreaterThan(0);
  });

  it('calls onSelectColor and onClose when color is clicked', () => {
    const onSelectColor = jest.fn();
    const onClose = jest.fn();
    
    render(
      <ColorPicker {...defaultProps} onSelectColor={onSelectColor} onClose={onClose} />
    );
    
    const firstSwatch = document.querySelector('.color-picker__swatch');
    fireEvent.click(firstSwatch);
    
    expect(onSelectColor).toHaveBeenCalledWith(expect.any(String));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<ColorPicker {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close color picker');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn();
    render(<ColorPicker {...defaultProps} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('positions picker at provided x and y coordinates', () => {
    render(<ColorPicker {...defaultProps} x={200} y={300} />);
    
    const picker = document.querySelector('.color-picker');
    expect(picker).toHaveStyle({ left: '200px', top: '300px' });
  });

  it('has appropriate accessibility attributes', () => {
    render(<ColorPicker {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Color picker');
  });
});


