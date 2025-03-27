import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/PlaylistDetail.css';

const PlaylistDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPublicity, setEditPublicity] = useState('private');

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await axios.get(`/playlists/${id}`);
        setPlaylist(response.data);
        setTracks(response.data.tracks || []);
        setEditName(response.data.name);
        setEditPublicity(response.data.publicity);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching playlist:', err);
        setError('Failed to load playlist. Please try again later.');
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const response = await axios.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.results || []);
      setSearching(false);
    } catch (err) {
      console.error('Error searching tracks:', err);
      setError('Failed to search tracks. Please try again later.');
      setSearching(false);
    }
  };

  const handleAddTrack = async (track) => {
    try {
      await axios.post(`/playlists/${id}/tracks`, {
        spotify_uid: track.id,
        name: track.track,
        author: track.artist
      });
      
      // Refresh playlist to show new track
      const response = await axios.get(`/playlists/${id}`);
      setPlaylist(response.data);
      setTracks(response.data.tracks || []);
      
      // Clear search results
      setSearchResults([]);
      setSearchQuery('');
      setShowSearch(false);
    } catch (err) {
      console.error('Error adding track to playlist:', err);
      setError('Failed to add track to playlist. Please try again later.');
    }
  };

  const handleRemoveTrack = async (trackId) => {
    try {
      await axios.delete(`/playlists/${id}/tracks/${trackId}`);
      
      // Update local state
      setTracks(tracks.filter(track => track.id !== trackId));
    } catch (err) {
      console.error('Error removing track from playlist:', err);
      setError('Failed to remove track from playlist. Please try again later.');
    }
  };

  const handleUpdatePlaylist = async () => {
    try {
      const response = await axios.put(`/playlists/${id}`, {
        name: editName,
        publicity: editPublicity
      });
      
      setPlaylist({
        ...playlist,
        name: response.data.name,
        publicity: response.data.publicity,
        modified_at: response.data.modified_at
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating playlist:', err);
      setError('Failed to update playlist. Please try again later.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="playlist-detail-loading">Loading playlist...</div>;
  }

  if (error) {
    return <div className="playlist-detail-error">{error}</div>;
  }

  return (
    <div className="playlist-detail-container">
      <div className="playlist-detail-header">
        {isEditing ? (
          <div className="playlist-edit-form">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Playlist name"
              className="playlist-edit-input"
            />
            <select
              value={editPublicity}
              onChange={(e) => setEditPublicity(e.target.value)}
              className="playlist-edit-select"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <div className="playlist-edit-actions">
              <button 
                className="cancel-edit-button"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(playlist.name);
                  setEditPublicity(playlist.publicity);
                }}
              >
                Cancel
              </button>
              <button 
                className="save-edit-button"
                onClick={handleUpdatePlaylist}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="playlist-info">
              <h1>{playlist.name}</h1>
              <span className={`publicity-badge ${playlist.publicity}`}>
                {playlist.publicity}
              </span>
            </div>
            <div className="playlist-actions">
              <button 
                className="edit-playlist-button"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button 
                className="back-button"
                onClick={() => navigate('/playlists')}
              >
                Back to Playlists
              </button>
            </div>
          </>
        )}
      </div>

      <div className="playlist-metadata">
        <p>Created: {formatDate(playlist.created_at)}</p>
        <p>Last modified: {formatDate(playlist.modified_at)}</p>
        <p>Tracks: {tracks.length}</p>
      </div>

      <div className="playlist-tracks-header">
        <h2>Tracks</h2>
        <button 
          className="add-track-button"
          onClick={() => setShowSearch(!showSearch)}
        >
          {showSearch ? 'Cancel' : '+ Add Track'}
        </button>
      </div>

      {showSearch && (
        <div className="track-search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for tracks..."
              className="search-input"
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={searching}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              <ul className="search-results-list">
                {searchResults.map(result => (
                  <li key={result.id} className="search-result-item">
                    <div className="result-info">
                      <span className="result-track">{result.track}</span>
                      <span className="result-artist">{result.artist}</span>
                    </div>
                    <button 
                      className="add-to-playlist-button"
                      onClick={() => handleAddTrack(result)}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="playlist-tracks">
        {tracks.length === 0 ? (
          <div className="no-tracks">
            <p>This playlist doesn't have any tracks yet.</p>
            <p>Click the "Add Track" button to search and add tracks.</p>
          </div>
        ) : (
          <ul className="tracks-list">
            {tracks.map(track => (
              <li key={track.id} className="track-item">
                <div className="track-info">
                  <span className="track-id">{track.spotify_uid}</span>
                  <span className="track-name">{track.name}</span>
                  <span className="track-author">{track.author}</span>
                  <span className="track-added">Added: {formatDate(track.added_at)}</span>
                </div>
                <button 
                  className="remove-track-button"
                  onClick={() => handleRemoveTrack(track.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;