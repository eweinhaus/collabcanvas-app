import './UserAvatar.css';

function UserAvatar({ name = '', color = '#999999', size = 24 }) {
  const initials = (name || '').trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase() || '??';

  const style = {
    width: size,
    height: size,
    backgroundColor: color,
    lineHeight: `${size}px`,
    fontSize: Math.max(10, Math.floor(size * 0.45)),
  };

  return (
    <div className="user-avatar" style={style} aria-label={`User avatar for ${name || 'Unknown'}`}>
      {initials}
    </div>
  );
}

export default UserAvatar;


