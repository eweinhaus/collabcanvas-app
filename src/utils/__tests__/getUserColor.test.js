/**
 * Tests for getUserColor utility
 */

import { getUserColor, getUserDisplayName } from '../getUserColor';

describe('getUserColor', () => {
  const mockOnlineUsers = [
    { uid: 'user1', displayName: 'Alice', color: '#FF0000' },
    { uid: 'user2', displayName: 'Bob', email: 'bob@example.com', color: '#00FF00' },
    { uid: 'user3', email: 'charlie@example.com', color: '#0000FF' },
  ];

  test('returns user color when user is found', () => {
    expect(getUserColor('user1', mockOnlineUsers)).toBe('#FF0000');
    expect(getUserColor('user2', mockOnlineUsers)).toBe('#00FF00');
    expect(getUserColor('user3', mockOnlineUsers)).toBe('#0000FF');
  });

  test('returns default gray color when user not found', () => {
    expect(getUserColor('unknown-user', mockOnlineUsers)).toBe('#999');
  });

  test('returns default gray color when onlineUsers is empty', () => {
    expect(getUserColor('user1', [])).toBe('#999');
  });

  test('returns default gray color when onlineUsers is undefined', () => {
    expect(getUserColor('user1')).toBe('#999');
  });

  test('returns default gray color when userId is null', () => {
    expect(getUserColor(null, mockOnlineUsers)).toBe('#999');
  });

  test('returns default gray color when userId is undefined', () => {
    expect(getUserColor(undefined, mockOnlineUsers)).toBe('#999');
  });
});

describe('getUserDisplayName', () => {
  const mockOnlineUsers = [
    { uid: 'user1', displayName: 'Alice', email: 'alice@example.com' },
    { uid: 'user2', email: 'bob@example.com' },
    { uid: 'user3' },
  ];

  test('returns displayName when available', () => {
    expect(getUserDisplayName('user1', mockOnlineUsers)).toBe('Alice');
  });

  test('returns email username when displayName not available', () => {
    expect(getUserDisplayName('user2', mockOnlineUsers)).toBe('bob');
  });

  test('returns "Unknown" when neither displayName nor email available', () => {
    expect(getUserDisplayName('user3', mockOnlineUsers)).toBe('Unknown');
  });

  test('returns "Unknown" when user not found', () => {
    expect(getUserDisplayName('unknown-user', mockOnlineUsers)).toBe('Unknown');
  });

  test('returns "Unknown" when onlineUsers is empty', () => {
    expect(getUserDisplayName('user1', [])).toBe('Unknown');
  });

  test('returns "Unknown" when onlineUsers is undefined', () => {
    expect(getUserDisplayName('user1')).toBe('Unknown');
  });

  test('returns "Unknown" when userId is null', () => {
    expect(getUserDisplayName(null, mockOnlineUsers)).toBe('Unknown');
  });

  test('returns "Unknown" when userId is undefined', () => {
    expect(getUserDisplayName(undefined, mockOnlineUsers)).toBe('Unknown');
  });

  test('extracts email username correctly', () => {
    const users = [
      { uid: 'u1', email: 'test.user@example.com' },
      { uid: 'u2', email: 'simple@test.org' },
    ];
    expect(getUserDisplayName('u1', users)).toBe('test.user');
    expect(getUserDisplayName('u2', users)).toBe('simple');
  });
});

