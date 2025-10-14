/**
 * Toast Component - Displays temporary notifications
 */

import './Toast.css';
import { TOAST_TYPES } from '../../hooks/useToast';

const Toast = ({ toast, onDismiss }) => {
  const { id, message, type } = toast;

  const getIcon = () => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return '✓';
      case TOAST_TYPES.ERROR:
        return '✕';
      case TOAST_TYPES.INFO:
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`toast toast--${type}`} role="alert">
      <span className="toast__icon">{getIcon()}</span>
      <span className="toast__message">{message}</span>
      <button
        className="toast__close"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;

