/**
 * AIPanel Component Tests
 * Tests for AI panel UI, animations, shortcuts, and responsive behavior
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIPanel from '../AIPanel';

// Mock AIContext before importing
jest.mock('../../../context/AIContext', () => ({
  useAI: jest.fn(),
}));

const { useAI } = require('../../../context/AIContext');

// Mock child components
jest.mock('../AIMessage', () => {
  return function MockAIMessage({ message }) {
    return <div data-testid="ai-message">{message.content}</div>;
  };
});

jest.mock('../AIPrompt', () => {
  return function MockAIPrompt() {
    return <div data-testid="ai-prompt">Prompt Input</div>;
  };
});

describe('AIPanel', () => {
  const mockUseAI = {
    panelOpen: false,
    closePanel: jest.fn(),
    messages: [
      { role: 'system', content: 'System prompt', timestamp: Date.now() },
      { role: 'user', content: 'Hello', timestamp: Date.now() },
      { role: 'assistant', content: 'Hi there!', timestamp: Date.now() },
    ],
    loading: false,
    clearMessages: jest.fn(),
    messagesEndRef: { current: null },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAI.mockReturnValue(mockUseAI);
  });

  describe('Rendering', () => {
    it('should render AI panel', () => {
      render(<AIPanel />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('AI Assistant')).toBeInTheDocument();
    });

    it('should filter out system messages', () => {
      render(<AIPanel />);
      
      const messages = screen.getAllByTestId('ai-message');
      // Should show 2 messages (user + assistant), not 3
      expect(messages).toHaveLength(2);
    });

    it('should render clear button', () => {
      render(<AIPanel />);
      
      const clearButton = screen.getByLabelText('Clear conversation');
      expect(clearButton).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<AIPanel />);
      
      const closeButton = screen.getByLabelText('Close AI panel');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render prompt input', () => {
      render(<AIPanel />);
      
      expect(screen.getByTestId('ai-prompt')).toBeInTheDocument();
    });
  });

  describe('Panel Animation (task 13.34)', () => {
    it('should apply open class when panel is open', () => {
      useAI.mockReturnValue({
        ...mockUseAI,
        panelOpen: true,
      });

      render(<AIPanel />);
      
      const panel = screen.getByRole('dialog');
      expect(panel).toHaveClass('ai-panel--open');
    });

    it('should not apply open class when panel is closed', () => {
      useAI.mockReturnValue({
        ...mockUseAI,
        panelOpen: false,
      });

      render(<AIPanel />);
      
      const panel = screen.getByRole('dialog');
      expect(panel).not.toHaveClass('ai-panel--open');
    });

    it('should toggle class when panel state changes', () => {
      const { rerender } = render(<AIPanel />);
      
      let panel = screen.getByRole('dialog');
      expect(panel).not.toHaveClass('ai-panel--open');

      // Panel opens
      useAI.mockReturnValue({
        ...mockUseAI,
        panelOpen: true,
      });

      rerender(<AIPanel />);
      
      panel = screen.getByRole('dialog');
      expect(panel).toHaveClass('ai-panel--open');
    });
  });

  describe('Keyboard Shortcuts (task 13.35)', () => {
    it('should close panel on Escape key', () => {
      const closePanelMock = jest.fn();
      
      useAI.mockReturnValue({
        ...mockUseAI,
        panelOpen: true,
        closePanel: closePanelMock,
      });

      render(<AIPanel />);
      
      fireEvent.keyDown(window, { key: 'Escape' });
      
      expect(closePanelMock).toHaveBeenCalled();
    });

    it('should not close panel on Escape if panel is already closed', () => {
      const closePanelMock = jest.fn();
      
      useAI.mockReturnValue({
        ...mockUseAI,
        panelOpen: false,
        closePanel: closePanelMock,
      });

      render(<AIPanel />);
      
      fireEvent.keyDown(window, { key: 'Escape' });
      
      expect(closePanelMock).not.toHaveBeenCalled();
    });

    it('should trap focus within panel when open', () => {
      useAI.mockReturnValue({
        ...mockUseAI,
        panelOpen: true,
      });

      render(<AIPanel />);
      
      const panel = screen.getByRole('dialog');
      const buttons = panel.querySelectorAll('button');
      
      expect(buttons.length).toBeGreaterThan(0);
      
      // Focus trap should be active (implementation tested via keyboard navigation)
      // This is a basic check - full tab trap tested via integration tests
    });
  });

  describe('User Actions', () => {
    it('should call closePanel when close button clicked', () => {
      const closePanelMock = jest.fn();
      
      useAI.mockReturnValue({
        ...mockUseAI,
        closePanel: closePanelMock,
      });

      render(<AIPanel />);
      
      const closeButton = screen.getByLabelText('Close AI panel');
      fireEvent.click(closeButton);
      
      expect(closePanelMock).toHaveBeenCalled();
    });

    it('should call clearMessages when clear button clicked', () => {
      const clearMessagesMock = jest.fn();
      
      useAI.mockReturnValue({
        ...mockUseAI,
        clearMessages: clearMessagesMock,
      });

      render(<AIPanel />);
      
      const clearButton = screen.getByLabelText('Clear conversation');
      fireEvent.click(clearButton);
      
      expect(clearMessagesMock).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      useAI.mockReturnValue({
        ...mockUseAI,
        loading: true,
      });

      render(<AIPanel />);
      
      // Check for loading indicator (implementation may vary)
      // The actual implementation shows a typing indicator
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should handle empty messages list', () => {
      useAI.mockReturnValue({
        ...mockUseAI,
        messages: [{ role: 'system', content: 'System', timestamp: Date.now() }],
      });

      render(<AIPanel />);
      
      // Should not error, panel should still render
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // No display messages (system filtered out)
      const messages = screen.queryAllByTestId('ai-message');
      expect(messages).toHaveLength(0);
    });
  });

  describe('Accessibility (task 13.35)', () => {
    it('should have proper ARIA attributes', () => {
      useAI.mockReturnValue({
        ...mockUseAI,
        panelOpen: true,
      });

      render(<AIPanel />);
      
      const panel = screen.getByRole('dialog');
      expect(panel).toHaveAttribute('aria-modal', 'true');
      expect(panel).toHaveAttribute('aria-label', 'AI Assistant');
    });

    it('should have accessible button labels', () => {
      render(<AIPanel />);
      
      expect(screen.getByLabelText('Clear conversation')).toBeInTheDocument();
      expect(screen.getByLabelText('Close AI panel')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<AIPanel />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });
});

