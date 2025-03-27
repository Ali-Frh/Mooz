import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Home.css';

// Create a separate axios instance for public endpoints
const publicAxios = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: false
});

const Home = () => {
  const { user } = useAuth();
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicPlaylists = async () => {
      try {
        // Use the public axios instance without auth headers
        const response = await publicAxios.get('/public-playlists');
        setPublicPlaylists(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching public playlists:', err);
        setError('Failed to load public playlists. Please try again later.');
        setLoading(false);
      }
    };

    fetchPublicPlaylists();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Welcome to Mooz</h1>
        <p className="home-subtitle">Your music streaming platform</p>
        
        <div className="home-cta">
          {user ? (
            <>
              <p className="welcome-message">Welcome back, {user.username}!</p>
              <Link to="/dashboard" className="home-button primary">
                Go to Dashboard
              </Link>
              <Link to="/playlists" className="home-button secondary">
                My Playlists
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

      <div className="public-playlists-section">
        <h2>Public Playlists</h2>
        
        {loading ? (
          <div className="loading-message">Loading public playlists...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : publicPlaylists.length === 0 ? (
          <div className="no-playlists-message">No public playlists available.</div>
        ) : (
          <div className="playlists-grid">
            {publicPlaylists.map(playlist => (
              <div key={playlist.id} className="playlist-card">
                <div className="playlist-card-content">
                  <h3 className="playlist-card-title">{playlist.name}</h3>
                  <div className="playlist-card-details">
                    <p>Tracks: {playlist.track_count}</p>
                    <p>Last updated: {formatDate(playlist.modified_at)}</p>
                  </div>
                  <Link to={`/playlists/${playlist.id}`} className="view-playlist-button">
                    View Playlist
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
