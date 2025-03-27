import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/NewPlaylist.css';

const NewPlaylist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [publicity, setPublicity] = useState('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/playlists', {
        name,
        publicity
      });
      
      // Redirect to playlists page after successful creation
      navigate('/playlists');
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(err.response?.data?.detail || 'Failed to create playlist. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="new-playlist-container">
      <div className="new-playlist-header">
        <h1>Create New Playlist</h1>
      </div>

      <form className="new-playlist-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">Playlist Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter playlist name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="publicity">Visibility</label>
          <select
            id="publicity"
            value={publicity}
            onChange={(e) => setPublicity(e.target.value)}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => navigate('/playlists')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="create-button"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Playlist'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPlaylist;
