import { useAuth } from '../../context/AuthContext';
import LoginButton from '../auth/LoginButton';
import UserAvatar from '../collaboration/UserAvatar';
import './Header.css';

const Header = ({ onMenuToggle, showMenuButton = true }) => {
  const { user } = useAuth();

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

