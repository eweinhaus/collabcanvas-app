import './CommentIndicator.css';

/**
 * CommentIndicator - Badge showing comment count on shapes
 * Displays a small badge with comment icon and count
 */
function CommentIndicator({ count, onClick, position = { x: 0, y: 0 } }) {
  if (!count || count === 0) {
    return null;
  }

  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
  };

  return (
    <button
      className="comment-indicator"
      style={style}
      onClick={onClick}
      aria-label={`${count} comment${count === 1 ? '' : 's'}`}
      title={`${count} comment${count === 1 ? '' : 's'}`}
      type="button"
    >
      <span className="comment-indicator__icon">💬</span>
      <span className="comment-indicator__count">{count}</span>
    </button>
  );
}

export default CommentIndicator;

