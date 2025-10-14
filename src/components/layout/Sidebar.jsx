import PresenceList from '../collaboration/PresenceList';
import './Sidebar.css';

const Sidebar = ({ open, users = [] }) => {
  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} role="complementary" aria-label="Sidebar">
      <div className="sidebar__content">
        <PresenceList users={users} className="sidebar__presence" />
      </div>
    </aside>
  );
};

export default Sidebar;

