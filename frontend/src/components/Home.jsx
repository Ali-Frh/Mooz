import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Welcome to Our App</h1>
        <p className="home-subtitle">A secure application with JWT authentication</p>
        
        <div className="home-cta">
          {user ? (
            <>
              <p className="welcome-message">Welcome back, {user.username}!</p>
              <Link to="/dashboard" className="home-button primary">
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="home-button primary">
                Login
              </Link>
              <Link to="/register" className="home-button secondary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
