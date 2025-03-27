import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Playlists.css';

const Playlists = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await axios.get('/playlists');
        setPlaylists(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching playlists:', err);
        setError('Failed to load playlists. Please try again later.');
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handleDeletePlaylist = async (id) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      try {
        await axios.delete(`/playlists/${id}`);
        // Remove the deleted playlist from state
        setPlaylists(playlists.filter(playlist => playlist.id !== id));
      } catch (err) {
        console.error('Error deleting playlist:', err);
        setError('Failed to delete playlist. Please try again later.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="playlists-loading">Loading playlists...</div>;
  }

  if (error) {
    return <div className="playlists-error">{error}</div>;
  }

  return (
    <div className="playlists-container">
      <div className="playlists-header">
        <h1>Your Playlists</h1>
        <button 
          className="create-playlist-button"
          onClick={() => navigate('/playlists/new')}
        >
          <span className="plus-icon">+</span> New Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="no-playlists">
          <p>You don't have any playlists yet.</p>
          <p>Create your first playlist by clicking the "New Playlist" button.</p>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map(playlist => (
            <div key={playlist.id} className="playlist-card">
              <div className="playlist-card-header">
                <h3>{playlist.name}</h3>
                <span className={`publicity-badge ${playlist.publicity}`}>
                  {playlist.publicity}
                </span>
              </div>
              <div className="playlist-card-content">
                <p className="playlist-date">Created: {formatDate(playlist.created_at)}</p>
                <p className="playlist-date">Modified: {formatDate(playlist.modified_at)}</p>
                <p className="playlist-tracks-count">Tracks: {playlist.track_count || 0}</p>
              </div>
              <div className="playlist-card-actions">
                <Link to={`/playlists/${playlist.id}`} className="view-button">
                  View
                </Link>
                {/* <button 
                  className="edit-button"
                  onClick={() => navigate(`/playlists/${playlist.id}/edit`)}
                >
                  Edit
                </button> */}
                <button 
                  className="delete-button"
                  onClick={() => handleDeletePlaylist(playlist.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlists;
