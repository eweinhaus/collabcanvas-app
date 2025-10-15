import PresenceList from '../collaboration/PresenceList';
import AIPrompt from '../ai/AIPrompt';
import AIHistory from '../ai/AIHistory';
import { useAuth } from '../../context/AuthContext';
import { useAI } from '../../context/AIContext';
import './Sidebar.css';

const Sidebar = ({ open, users = [] }) => {
  const { user } = useAuth();
  const { history, clearHistory } = useAI();
  
  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} role="complementary" aria-label="Sidebar">
      <div className="sidebar__content">
        <AIPrompt />
        <AIHistory history={history} onClear={clearHistory} />
        <PresenceList users={users} currentUserId={user?.uid || null} className="sidebar__presence" />
      </div>
    </aside>
  );
};

export default Sidebar;

