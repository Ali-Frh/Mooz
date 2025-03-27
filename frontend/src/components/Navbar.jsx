import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Music App</Link>
      </div>
      
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/playlists" className="nav-link">Playlists</Link>
            <button onClick={logout} className="nav-button logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
