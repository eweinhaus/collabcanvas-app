import { useAuth } from '../../context/AuthContext';
import './PrivateRoute.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="private-route-loading">
        <div className="spinner-large"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="private-route-login">
        <div className="login-prompt">
          <h2>Welcome to CollabCanvas</h2>
          <p>Please sign in to start collaborating</p>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;

