import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import axios from 'axios';
import '../styles/PlaylistDetail.css';

const PlaylistDetail = () => {
  const { id } = useParams();
  const { user, publicAxios } = useAuth();
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Use the global music player context
  const { 
    playingTrack, 
    isPlaying, 
    playTrack: playTrackGlobal, 
    togglePlayPause, 
    playNext, 
    playPrevious 
  } = useMusicPlayer();

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        // Use the publicAxios instance for unauthenticated access
        const response = await publicAxios.get(`/playlists/${id}`);
        
        setPlaylist(response.data);
        setTracks(response.data.tracks || []);
        setEditName(response.data.name);
        setEditPublicity(response.data.publicity);
        setLoading(false);
        
        // Update document title with playlist name
        document.title = `${response.data.name} | Mooz`;
      } catch (err) {
        console.error('Error fetching playlist:', err);
        
        // If error is 403 and playlist is not public, show appropriate message
        if (err.response && err.response.status === 403) {
          setError('This playlist is private. Please log in to view it.');
        } else {
          setError('Failed to load playlist. Please try again later.');
        }
        setLoading(false);
      }
    };

    fetchPlaylist();
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Mooz';
    };
  }, [id, user]);

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
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
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
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
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
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
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
      
      // Update document title with new playlist name
      document.title = `${response.data.name} | Mooz`;
    } catch (err) {
      console.error('Error updating playlist:', err);
      setError('Failed to update playlist. Please try again later.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const playTrack = async (track) => {
    // If not logged in, show login modal
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    try {
      // Request the track from the server
      const response = await axios.post(`/tracks/play/${track.spotify_uid}`);
      
      if (response.data.status === 'success') {
        // Track is ready to play, use the global player
        playTrackGlobal({
          id: track.id,
          name: track.name,
          author: track.author,
          spotify_uid: track.spotify_uid,
          link: response.data.track.link,
          result: true
        });
      } else if (response.data.status === 'pending') {
        // Track is being processed
        // Use SweetAlert to show a notification
        import('sweetalert2').then((Swal) => {
          Swal.default.fire({
            title: 'Processing Track',
            text: response.data.message,
            icon: 'info',
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
          });
        });
      }
    } catch (err) {
      console.error('Error playing track:', err);
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          title: 'Error',
          text: 'Failed to play track. Please try again later.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      });
    }
  };
  
  const handlePlayNext = () => {
    playNext(tracks);
  };
  
  const handlePlayPrevious = () => {
    playPrevious(tracks);
  };
  
  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/playlists/${id}`;
    navigator.clipboard.writeText(shareUrl);
    
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: 'Link Copied!',
        text: 'Playlist link has been copied to clipboard',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    });
    
    setShowShareModal(false);
  };

  if (loading) {
    return <div className="playlist-detail-loading">Loading playlist...</div>;
  }

  if (error) {
    return <div className="playlist-detail-error">{error}</div>;
  }

  const isOwner = user && playlist.owner_id === user.id;

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
              {playlist.publicity === "public" && (
                <button 
                  className="share-playlist-button"
                  onClick={() => setShowShareModal(true)}
                >
                  <i className="fas fa-share-alt"></i> Share
                </button>
              )}
              {isOwner && (
                <button 
                  className="edit-playlist-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              )}
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

      {isOwner && (
        <div className="playlist-tracks-header">
          <h2>Tracks</h2>
          <button 
            className="add-track-button"
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? 'Cancel' : '+ Add Track'}
          </button>
        </div>
      )}

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
            {isOwner && <p>Click the "Add Track" button to search and add tracks.</p>}
          </div>
        ) : (
          <ul className="tracks-list">
            {tracks.map(track => {
              const isCurrentTrack = playingTrack && playingTrack.id === track.id;
              return (
                <li key={track.id} className={`track-item ${isCurrentTrack ? 'playing' : ''}`}>
                  <div className="track-info">
                    <span className="track-name">{track.name}</span>
                    <span className="track-author">{track.author}</span>
                    <span className="track-added">Added: {formatDate(track.added_at)}</span>
                  </div>
                  <div className="track-actions">
                    <button 
                      className={`play-track-button ${isCurrentTrack ? 'playing' : ''}`}
                      onClick={() => isCurrentTrack ? togglePlayPause() : playTrack(track)}
                      aria-label={isCurrentTrack ? (isPlaying ? 'Pause' : 'Play') : 'Play'}
                    >
                      {isCurrentTrack ? (isPlaying ? '⏸️' : '▶️') : '▶️'}
                    </button>
                    {isOwner && (
                      <button 
                        className="remove-track-button"
                        onClick={() => handleRemoveTrack(track.id)}
                        aria-label="Remove track"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="share-modal">
            <div className="modal-header">
              <h3>Share Playlist</h3>
              <button 
                className="close-modal-button"
                onClick={() => setShowShareModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-content">
              <p>Share this playlist with your friends:</p>
              <div className="share-link-container">
                <input 
                  type="text" 
                  value={`${window.location.origin}/playlists/${id}`} 
                  readOnly 
                  className="share-link-input"
                />
                <button 
                  className="copy-link-button"
                  onClick={copyShareLink}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="login-modal">
            <div className="modal-header">
              <h3>Login Required</h3>
              <button 
                className="close-modal-button"
                onClick={() => setShowLoginModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-content">
              <p>You need to be logged in to play tracks or make changes to playlists.</p>
              <div className="login-modal-actions">
                <button 
                  className="login-button"
                  onClick={() => navigate('/login')}
                >
                  Login
                </button>
                <button 
                  className="register-button"
                  onClick={() => navigate('/register')}
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistDetail;