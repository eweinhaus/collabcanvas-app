/**
 * Get user cursor color from online users list
 */

export function getUserColor(userId, onlineUsers = []) {
  const user = onlineUsers.find(u => u.uid === userId);
  return user?.color || '#999'; // Default gray if not found
}

export function getUserDisplayName(userId, onlineUsers = []) {
  const user = onlineUsers.find(u => u.uid === userId);
  return user?.displayName || user?.email?.split('@')[0] || 'Unknown';
}

