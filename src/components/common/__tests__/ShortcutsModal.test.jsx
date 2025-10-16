import { render, screen, fireEvent } from '@testing-library/react';
import ShortcutsModal from '../ShortcutsModal';

describe('ShortcutsModal', () => {
  it('does not render when isOpen is false', () => {
    render(<ShortcutsModal isOpen={false} onClose={() => {}} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(<ShortcutsModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('displays all keyboard shortcuts', () => {
    render(<ShortcutsModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Esc')).toBeInTheDocument();
    expect(screen.getByText('Delete / Backspace')).toBeInTheDocument();
    expect(screen.getByText('Double-click')).toBeInTheDocument();
    expect(screen.getByText('Click + Drag')).toBeInTheDocument();
    expect(screen.getByText('Scroll')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('includes alignment and distribution shortcuts', () => {
    render(<ShortcutsModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Cmd/Ctrl + Shift + L')).toBeInTheDocument();
    expect(screen.getByText('Cmd/Ctrl + Shift + R')).toBeInTheDocument();
    expect(screen.getByText('Cmd/Ctrl + Shift + T')).toBeInTheDocument();
    expect(screen.getByText('Cmd/Ctrl + Shift + M')).toBeInTheDocument();
    expect(screen.getByText('Cmd/Ctrl + Shift + B')).toBeInTheDocument();
    expect(screen.getByText('Cmd/Ctrl + Shift + H')).toBeInTheDocument();
    expect(screen.getByText('Cmd/Ctrl + Shift + V')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close shortcuts modal');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);
    
    const overlay = screen.getByRole('dialog').parentElement;
    fireEvent.click(overlay);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when modal content is clicked', () => {
    const onClose = jest.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);
    
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has appropriate accessibility attributes', () => {
    render(<ShortcutsModal isOpen={true} onClose={() => {}} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'shortcuts-title');
  });
});

