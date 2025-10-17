import { useAuth } from '../../context/AuthContext';
import LoginButton from '../auth/LoginButton';
import UserAvatar from '../collaboration/UserAvatar';
import './Header.css';
import { useState, useEffect } from 'react';
import { realtimeDB } from '../../services/firebase';

// Connection status states
const CONNECTION_STATES = {
  OFFLINE: { status: 'offline', label: 'Offline', color: '#f44336' },
  CONNECTED: { status: 'connected', label: 'Connected', color: '#4caf50' }
};

// Helper function to get detailed tooltip text
const getConnectionStatusTooltip = (state) => {
  const tooltips = {
    [CONNECTION_STATES.OFFLINE.status]: 'No internet connection - working offline',
    [CONNECTION_STATES.CONNECTED.status]: 'Connected - real-time collaboration available'
  };
  return tooltips[state.status] || 'Connection status unknown';
};

const Header = ({ onMenuToggle, showMenuButton = true, onOpenShortcuts }) => {
  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState(
    navigator.onLine ? CONNECTION_STATES.CONNECTED : CONNECTION_STATES.OFFLINE
  );
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setConnectionState(CONNECTION_STATES.CONNECTED);
    };
    const handleOffline = () => {
      setConnectionState(CONNECTION_STATES.OFFLINE);
      setFirebaseConnected(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Firebase connectivity
  useEffect(() => {
    if (!navigator.onLine) {
      setFirebaseConnected(false);
      return;
    }

    let isMounted = true;

    const checkFirebaseConnection = async () => {
      try {
        const { ref, onValue } = await import('firebase/database');
        const testRef = ref(realtimeDB, '.info/connected');

        const unsubscribe = onValue(testRef, (snapshot) => {
          if (!isMounted) return;

          const isConnected = snapshot.val();
          setFirebaseConnected(isConnected);

          // If Firebase is connected and we're online, show as connected
          // If Firebase connection fails, still show as connected (network connectivity is primary indicator)
          if (navigator.onLine) {
            setConnectionState(CONNECTION_STATES.CONNECTED);
          }
        }, (error) => {
          if (!isMounted) return;
          console.warn('[Header] Firebase connection error:', error);
          // Don't change state on Firebase errors - network connectivity is the primary indicator
        });

        return unsubscribe;
      } catch (error) {
        if (!isMounted) return;
        console.warn('[Header] Firebase connection check failed:', error);
        // Firebase check failure doesn't change the connection state
        return () => {};
      }
    };

    let unsubscribe;
    checkFirebaseConnection().then(unsub => { unsubscribe = unsub; });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <header className="header" role="banner">
      <div className="header__left">
        {showMenuButton && (
          <button
            className="header__menu-button"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar menu"
            title="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <img src="/logo.svg" alt="CollabCanvas logo" className="header__logo" />
        <h1 className="header__title">CollabCanvas</h1>
      </div>
      <div className="header__right">
        {onOpenShortcuts && (
          <button
            className="header__help-button"
            onClick={onOpenShortcuts}
            aria-label="Show keyboard shortcuts"
            title="Show keyboard shortcuts (?)"
          >
            <span className="header__help-icon">?</span>
            <span className="header__help-text">Help</span>
          </button>
        )}
        <div className="connection-status" title={`${connectionState.label}: ${getConnectionStatusTooltip(connectionState)}`}>
          <span
            className={`status-dot ${connectionState.status}`}
            style={{ backgroundColor: connectionState.color }}
          />
          <span className="connection-status-text">{connectionState.label}</span>
        </div>
        {user ? (
          <div className="header__user-info">
            <UserAvatar name={user.displayName || user.email} size={32} />
            <span className="header__user-name">{user.displayName || user.email}</span>
          </div>
        ) : (
          <LoginButton />
        )}
      </div>
    </header>
  );
};

export default Header;

