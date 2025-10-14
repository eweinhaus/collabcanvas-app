import { memo, useEffect } from 'react';
import UserAvatar from './UserAvatar';
import './PresenceList.css';

const PresenceList = memo(function PresenceList({ users = [], className = '' }) {
  useEffect(() => {
    console.log('[PresenceList] Component mounted');
    console.log('[PresenceList] Users prop:', users);
  }, [users]);

  return (
    <div className={`presence-list ${className}`} aria-label="Online users">
      <div className="presence-list__header">
        <span className="presence-list__title">Online</span>
        <span className="presence-list__count" aria-label={`Online users count: ${users.length}`}>{users.length}</span>
      </div>
      <ul className="presence-list__items">
        {users.map((u) => (
          <li key={u.uid} className="presence-list__item">
            <UserAvatar name={u.name} color={u.color} size={24} />
            <span className="presence-list__name">{u.name || 'Anonymous'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default PresenceList;


