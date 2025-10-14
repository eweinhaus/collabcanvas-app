import PresenceList from '../collaboration/PresenceList';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ open, users = [] }) => {
  const { user } = useAuth();
  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} role="complementary" aria-label="Sidebar">
      <div className="sidebar__content">
        <PresenceList users={users} currentUserId={user?.uid || null} className="sidebar__presence" />
      </div>
    </aside>
  );
};

export default Sidebar;

