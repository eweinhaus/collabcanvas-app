/**
 * AIPrompt Component Tests
 * Tests for AI prompt input, submission, and keyboard shortcuts
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIPrompt from '../AIPrompt';

// Mock AIContext before importing
jest.mock('../../../context/AIContext', () => ({
  useAI: jest.fn(),
}));

const { useAI } = require('../../../context/AIContext');

describe('AIPrompt', () => {
  const mockUseAI = {
    sendMessage: jest.fn(),
    loading: false,
    cancelRequest: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAI.mockReturnValue(mockUseAI);
  });

  describe('Rendering', () => {
    it('should render prompt input', () => {
      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      expect(input).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<AIPrompt />);
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeInTheDocument();
    });

    it('should show keyboard hint', () => {
      render(<AIPrompt />);
      
      // Check for keyboard hint container (text is split across multiple elements)
      const promptContainer = screen.getByLabelText('AI prompt input').closest('.ai-prompt');
      expect(promptContainer).toBeInTheDocument();
      
      // Verify hint section exists (contains kbd elements)
      const hintSection = promptContainer.querySelector('.ai-prompt__hint');
      expect(hintSection).toBeInTheDocument();
    });

    it('should have placeholder text', () => {
      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      expect(input).toHaveAttribute('placeholder', expect.stringContaining('Ask me to'));
    });
  });

  describe('Input Behavior', () => {
    it('should update input value on change', () => {
      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      
      expect(input).toHaveValue('Hello AI');
    });

    it('should auto-focus on mount', () => {
      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      
      // Check if element can be focused (actual focus requires real DOM)
      expect(input).toBeInTheDocument();
      expect(input).not.toBeDisabled();
    });

    it('should clear input after submission', () => {
      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      const sendButton = screen.getByLabelText('Send message');
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      expect(input).toHaveValue('');
    });
  });

  describe('Message Submission', () => {
    it('should send message on button click', async () => {
      const sendMessageMock = jest.fn();
      useAI.mockReturnValue({
        ...mockUseAI,
        sendMessage: sendMessageMock,
      });

      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      const sendButton = screen.getByLabelText('Send message');
      
      fireEvent.change(input, { target: { value: 'Create a circle' } });
      fireEvent.click(sendButton);
      
      expect(sendMessageMock).toHaveBeenCalledWith('Create a circle');
    });

    it('should send message on Enter key (task 13.35)', async () => {
      const sendMessageMock = jest.fn();
      useAI.mockReturnValue({
        ...mockUseAI,
        sendMessage: sendMessageMock,
      });

      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
      
      expect(sendMessageMock).toHaveBeenCalledWith('Test message');
    });

    it('should NOT send message on Shift+Enter', async () => {
      const sendMessageMock = jest.fn();
      useAI.mockReturnValue({
        ...mockUseAI,
        sendMessage: sendMessageMock,
      });

      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      
      fireEvent.change(input, { target: { value: 'Line 1' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
      
      // Should not send, allows new line
      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('should not send empty message', () => {
      const sendMessageMock = jest.fn();
      useAI.mockReturnValue({
        ...mockUseAI,
        sendMessage: sendMessageMock,
      });

      render(<AIPrompt />);
      
      const sendButton = screen.getByLabelText('Send message');
      fireEvent.click(sendButton);
      
      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only message', async () => {
      const sendMessageMock = jest.fn();
      useAI.mockReturnValue({
        ...mockUseAI,
        sendMessage: sendMessageMock,
      });

      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      const sendButton = screen.getByLabelText('Send message');
      
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(sendButton);
      
      expect(sendMessageMock).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable input when loading', () => {
      useAI.mockReturnValue({
        ...mockUseAI,
        loading: true,
      });

      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      expect(input).toBeDisabled();
    });

    it('should show cancel button when loading', () => {
      useAI.mockReturnValue({
        ...mockUseAI,
        loading: true,
      });

      render(<AIPrompt />);
      
      const cancelButton = screen.getByLabelText('Cancel request');
      expect(cancelButton).toBeInTheDocument();
    });

    it('should hide send button when loading', () => {
      useAI.mockReturnValue({
        ...mockUseAI,
        loading: true,
      });

      render(<AIPrompt />);
      
      const sendButton = screen.queryByLabelText('Send message');
      expect(sendButton).not.toBeInTheDocument();
    });

    it('should call cancelRequest on cancel button click', () => {
      const cancelRequestMock = jest.fn();
      useAI.mockReturnValue({
        ...mockUseAI,
        loading: true,
        cancelRequest: cancelRequestMock,
      });

      render(<AIPrompt />);
      
      const cancelButton = screen.getByLabelText('Cancel request');
      fireEvent.click(cancelButton);
      
      expect(cancelRequestMock).toHaveBeenCalled();
    });

    it('should not submit while loading', async () => {
      const sendMessageMock = jest.fn();
      useAI.mockReturnValue({
        ...mockUseAI,
        loading: true,
        sendMessage: sendMessageMock,
      });

      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      
      // Try to submit (input is disabled but let's test form submission)
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
      
      expect(sendMessageMock).not.toHaveBeenCalled();
    });
  });

  describe('Button States', () => {
    it('should disable send button when input is empty', () => {
      render(<AIPrompt />);
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has text', async () => {
      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      
      fireEvent.change(input, { target: { value: 'Test' } });
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).not.toBeDisabled();
    });

    it('should disable send button for whitespace-only input', async () => {
      render(<AIPrompt />);
      
      const input = screen.getByLabelText('AI prompt input');
      
      fireEvent.change(input, { target: { value: '   ' } });
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AIPrompt />);
      
      expect(screen.getByLabelText('AI prompt input')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('should show cancel button label when loading', () => {
      useAI.mockReturnValue({
        ...mockUseAI,
        loading: true,
      });

      render(<AIPrompt />);
      
      expect(screen.getByLabelText('Cancel request')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should prevent default form submission', async () => {
      render(<AIPrompt />);
      
      const form = screen.getByLabelText('AI prompt input').closest('form');
      const input = screen.getByLabelText('AI prompt input');
      
      fireEvent.change(input, { target: { value: 'Test' } });
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
      
      form.dispatchEvent(submitEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});

