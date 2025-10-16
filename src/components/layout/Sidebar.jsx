import PresenceList from '../collaboration/PresenceList';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ open, users = [], isHidden = false }) => {
  const { user } = useAuth();

  return (
    <aside 
      className={`sidebar ${open ? 'sidebar--open' : ''} ${isHidden ? 'sidebar--hidden' : ''}`} 
      role="complementary" 
      aria-label="Sidebar"
    >
      <div className="sidebar__content">
        <PresenceList users={users} currentUserId={user?.uid || null} className="sidebar__presence" />
      </div>
    </aside>
  );
};

export default Sidebar;

