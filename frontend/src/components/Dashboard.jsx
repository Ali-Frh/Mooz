import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="user-profile">
          <div className="profile-icon">
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="user-info">
            <h2>Welcome, {user?.username}!</h2>
            <p>Email: {user?.email}</p>
          </div>
        </div>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Protected Content</h3>
            <p>This is a protected area that only authenticated users can access.</p>
            <p>Your user ID is: {user?.id}</p>
          </div>
          
          <div className="dashboard-card">
            <h3>Account Status</h3>
            <p>Your account is {user?.is_active ? 'active' : 'inactive'}.</p>
            <p>You are successfully authenticated with JWT!</p>
          </div>

          <div className="dashboard-card">
            <h3>Your Music</h3>
            <p>Manage your music collection with playlists.</p>
            <Link to="/playlists" className="dashboard-button">
              View Playlists
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
