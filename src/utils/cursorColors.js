/**
 * Cursor and Presence Color Palette
 * Separate from shape colors to maintain distinct, vibrant cursor colors
 * for better user identification in collaborative sessions
 */
const CURSOR_COLOR_PALETTE = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
  '#F8B88B', // Peach
  '#AAB7B8', // Gray
  '#E63946', // Crimson
  '#A8DADC', // Powder Blue
  '#457B9D', // Steel Blue
  '#F4A261', // Sandy Brown
  '#E76F51', // Terra Cotta
  '#2A9D8F', // Persian Green
];

const colorCache = new Map();

export function getColorForUser(uid) {
  if (!uid) return '#999999';
  if (colorCache.has(uid)) return colorCache.get(uid);
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURSOR_COLOR_PALETTE.length;
  const color = CURSOR_COLOR_PALETTE[index];
  colorCache.set(uid, color);
  return color;
}

export function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }
  if (email) {
    const local = email.split('@')[0] ?? '';
    return local.slice(0, 2).toUpperCase();
  }
  return '??';
}

export function clearColorCache() {
  colorCache.clear();
}


