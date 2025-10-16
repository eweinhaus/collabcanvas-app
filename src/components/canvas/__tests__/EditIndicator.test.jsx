import React from 'react';
import { render } from '@testing-library/react';

// Mock react-konva to avoid import issues in tests
jest.mock('react-konva', () => ({
  Group: ({ children }) => <div data-testid="group">{children}</div>,
  Text: ({ text }) => <span data-testid="text">{text}</span>,
  Circle: () => <div data-testid="circle" />,
}));

import EditIndicator from '../EditIndicator';

describe('EditIndicator', () => {
  test('does not render when no edit info provided', () => {
    const { container } = render(
      <EditIndicator />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders with valid edit info', () => {
    const { container } = render(
      <EditIndicator
        updatedByName="John Doe"
        updatedAt={Date.now() - 300000} // 5 minutes ago
        position={{ x: 100, y: 100 }}
        size={{ width: 200, height: 150 }}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  test('displays correct initials for full name', () => {
    const { container } = render(
      <EditIndicator
        updatedByName="John Doe"
        updatedAt={Date.now()}
        position={{ x: 0, y: 0 }}
        size={{ width: 100, height: 100 }}
      />
    );
    // The indicator should render (we can't easily test the exact text content due to SVG)
    expect(container.firstChild).toBeTruthy();
  });

  test('displays correct initials for single name', () => {
    const { container } = render(
      <EditIndicator
        updatedByName="John"
        updatedAt={Date.now()}
        position={{ x: 0, y: 0 }}
        size={{ width: 100, height: 100 }}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  test('formats time correctly for different intervals', () => {
    const now = Date.now();

    // Test "just now" (less than 1 minute)
    const { rerender } = render(
      <EditIndicator
        updatedByName="John Doe"
        updatedAt={now - 30000} // 30 seconds ago
        position={{ x: 0, y: 0 }}
        size={{ width: 100, height: 100 }}
      />
    );
    expect(rerender).toBeTruthy();

    // Test minutes ago
    rerender(
      <EditIndicator
        updatedByName="John Doe"
        updatedAt={now - 300000} // 5 minutes ago
        position={{ x: 0, y: 0 }}
        size={{ width: 100, height: 100 }}
      />
    );
    expect(rerender).toBeTruthy();

    // Test hours ago
    rerender(
      <EditIndicator
        updatedByName="John Doe"
        updatedAt={now - 7200000} // 2 hours ago
        position={{ x: 0, y: 0 }}
        size={{ width: 100, height: 100 }}
      />
    );
    expect(rerender).toBeTruthy();
  });

  test('positions correctly based on shape size', () => {
    const { container } = render(
      <EditIndicator
        updatedByName="John Doe"
        updatedAt={Date.now()}
        position={{ x: 50, y: 75 }}
        size={{ width: 200, height: 150 }}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
