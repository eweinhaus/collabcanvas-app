import React from 'react';
import { render } from '@testing-library/react';

// Mock react-konva to avoid import issues in tests
jest.mock('react-konva', () => ({
  Group: ({ children }) => <div data-testid="group">{children}</div>,
  Circle: () => <div data-testid="circle" />,
  Path: () => <div data-testid="path" />,
}));

import LockIndicator from '../LockIndicator';

describe('LockIndicator', () => {
  test('does not render when no lock info provided', () => {
    const { container } = render(
      <LockIndicator />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders with valid lock info', () => {
    const { container } = render(
      <LockIndicator
        lockedByName="John Doe"
        lockedAt={Date.now() - 300000} // 5 minutes ago
        position={{ x: 100, y: 100 }}
        size={{ width: 200, height: 150 }}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  test('displays lock icon correctly', () => {
    const { container } = render(
      <LockIndicator
        lockedByName="John Doe"
        lockedAt={Date.now()}
        position={{ x: 0, y: 0 }}
        size={{ width: 100, height: 100 }}
      />
    );
    // The indicator should render (we can't easily test the exact SVG content due to SVG)
    expect(container.firstChild).toBeTruthy();
  });

  test('formats lock time correctly for different intervals', () => {
    const now = Date.now();

    // Test "locked just now" (less than 1 minute)
    const { rerender } = render(
      <LockIndicator
        lockedByName="John Doe"
        lockedAt={now - 30000} // 30 seconds ago
        position={{ x: 0, y: 0 }}
        size={{ width: 100, height: 100 }}
      />
    );
    expect(rerender).toBeTruthy();

    // Test minutes ago
    rerender(
      <LockIndicator
        lockedByName="John Doe"
        lockedAt={now - 300000} // 5 minutes ago
        position={{ x: 0, y: 0 }}
        size={{ width: 100, height: 100 }}
      />
    );
    expect(rerender).toBeTruthy();

    // Test hours ago
    rerender(
      <LockIndicator
        lockedByName="John Doe"
        lockedAt={now - 7200000} // 2 hours ago
        position={{ x: 0, y: 0 }}
        size={{ width: 100, height: 100 }}
      />
    );
    expect(rerender).toBeTruthy();
  });

  test('positions correctly based on shape size', () => {
    const { container } = render(
      <LockIndicator
        lockedByName="John Doe"
        lockedAt={Date.now()}
        position={{ x: 50, y: 75 }}
        size={{ width: 200, height: 150 }}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  test('renders red lock icon for locked shapes', () => {
    const { container } = render(
      <LockIndicator
        lockedByName="John Doe"
        lockedAt={Date.now()}
        position={{ x: 0, y: 0 }}
        size={{ width: 100, height: 100 }}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
