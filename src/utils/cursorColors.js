import { COLOR_PALETTE } from './colors';

const colorCache = new Map();

export function getColorForUser(uid) {
  if (!uid) return '#999999';
  if (colorCache.has(uid)) return colorCache.get(uid);
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  const color = COLOR_PALETTE[index];
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


