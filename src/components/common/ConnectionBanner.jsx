/**
 * ConnectionBanner component
 * Displays connection status and syncing information
 */

import { useConnectionStatus, CONNECTION_STATUS } from '../../hooks/useConnectionStatus';
import './ConnectionBanner.css';

const ConnectionBanner = ({ boardId = 'default' }) => {
  const { status, pendingOps, queueStats } = useConnectionStatus(boardId);

  // Don't show banner when connected with no pending ops
  if (status === CONNECTION_STATUS.CONNECTED) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case CONNECTION_STATUS.OFFLINE:
        return {
          className: 'connection-banner--offline',
          icon: '📡',
          message: 'Offline',
          detail: pendingOps > 0 ? `${pendingOps} change${pendingOps === 1 ? '' : 's'} queued` : 'Changes will sync when online',
        };
      case CONNECTION_STATUS.RECONNECTING:
        return {
          className: 'connection-banner--reconnecting',
          icon: '🔄',
          message: 'Reconnecting',
          detail: 'Attempting to restore connection...',
        };
      case CONNECTION_STATUS.SYNCING:
        return {
          className: 'connection-banner--syncing',
          icon: '⬆️',
          message: 'Syncing',
          detail: `${pendingOps} operation${pendingOps === 1 ? '' : 's'} pending`,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div 
      className={`connection-banner ${config.className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="connection-banner__content">
        <span className="connection-banner__icon" aria-hidden="true">
          {config.icon}
        </span>
        <div className="connection-banner__text">
          <span className="connection-banner__message">
            {config.message}
          </span>
          <span className="connection-banner__detail">
            {config.detail}
          </span>
        </div>
      </div>
      {queueStats && queueStats.waitingRetry > 0 && (
        <div className="connection-banner__retry-info">
          <span className="connection-banner__retry-text">
            {queueStats.waitingRetry} retrying
          </span>
        </div>
      )}
    </div>
  );
};

export default ConnectionBanner;

