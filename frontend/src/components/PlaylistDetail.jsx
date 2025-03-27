import { useState, useEffect, useRef } from 'react';
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
  const [playingTrack, setPlayingTrack] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showShareModal, setShowShareModal] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await axios.get(`/playlists/${id}`);
        setPlaylist(response.data);
        setTracks(response.data.tracks || []);
        setEditName(response.data.name);
        setEditPublicity(response.data.publicity);
        setLoading(false);
        
        // Update document title with playlist name
        document.title = `${response.data.name} | Mooz`;
      } catch (err) {
        console.error('Error fetching playlist:', err);
        setError('Failed to load playlist. Please try again later.');
        setLoading(false);
      }
    };

    fetchPlaylist();
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Mooz';
    };
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
      
      // If the removed track is currently playing, stop it
      if (playingTrack === trackId) {
        stopPlayback();
      }
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
    try {
      // Stop current audio if playing
      stopPlayback();

      // Request the track from the server
      const response = await axios.post(`/tracks/play/${track.spotify_uid}`);
      
      if (response.data.status === 'success') {
        // Track is ready to play
        const audio = new Audio(response.data.track.link);
        audio.volume = volume;
        
        // Set up event listeners
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration);
        });
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          playNextTrack(track.id);
        });
        
        audio.play();
        setAudioElement(audio);
        setPlayingTrack(track.id);
        setIsPlaying(true);
        
        // Update document title with current track
        document.title = `${track.name} - ${track.author} | Mooz`;
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
  
  const stopPlayback = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.removeEventListener('timeupdate', updateProgress);
      audioElement.removeEventListener('ended', () => {});
      audioElement.src = '';
      setAudioElement(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      // Reset document title to playlist name
      if (playlist) {
        document.title = `${playlist.name} | Mooz`;
      }
    }
  };
  
  const togglePlayPause = () => {
    if (!audioElement) return;
    
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };
  
  const updateProgress = () => {
    if (audioElement) {
      setCurrentTime(audioElement.currentTime);
    }
  };
  
  const seekTo = (e) => {
    if (!audioElement) return;
    
    const seekTime = (e.target.value / 100) * duration;
    audioElement.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioElement) {
      audioElement.volume = newVolume;
    }
  };
  
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
  const playNextTrack = (currentTrackId) => {
    const currentIndex = tracks.findIndex(track => track.id === currentTrackId);
    if (currentIndex === -1 || currentIndex === tracks.length - 1) return;
    
    const nextTrack = tracks[currentIndex + 1];
    playTrack(nextTrack);
  };
  
  const playPreviousTrack = (currentTrackId) => {
    const currentIndex = tracks.findIndex(track => track.id === currentTrackId);
    if (currentIndex <= 0) return;
    
    const previousTrack = tracks[currentIndex - 1];
    playTrack(previousTrack);
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
              <li key={track.id} className={`track-item ${playingTrack === track.id ? 'playing' : ''}`}>
                <div className="track-info">
                  <span className="track-name">{track.name}</span>
                  <span className="track-author">{track.author}</span>
                  <span className="track-added">Added: {formatDate(track.added_at)}</span>
                </div>
                <div className="track-actions">
                  <button 
                    className={`play-track-button ${playingTrack === track.id ? 'playing' : ''}`}
                    onClick={() => playingTrack === track.id ? togglePlayPause() : playTrack(track)}
                    aria-label={playingTrack === track.id ? (isPlaying ? 'Pause' : 'Play') : 'Play'}
                  >
                    {playingTrack === track.id ? (isPlaying ? '⏸️' : '▶️') : '▶️'}
                  </button>
                  <button 
                    className="remove-track-button"
                    onClick={() => handleRemoveTrack(track.id)}
                    aria-label="Remove track"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Music Player Bar */}
      {playingTrack && (
        <div className="music-player-bar">
          <div className="player-track-info">
            {tracks.find(track => track.id === playingTrack) && (
              <>
                <div className="player-track-name">
                  {tracks.find(track => track.id === playingTrack).name}
                </div>
                <div className="player-track-author">
                  {tracks.find(track => track.id === playingTrack).author}
                </div>
              </>
            )}
          </div>
          
          <div className="player-controls">
            <button 
              className="player-control-button prev-button" 
              onClick={() => playPreviousTrack(playingTrack)}
              disabled={tracks.findIndex(track => track.id === playingTrack) <= 0}
              aria-label="Previous track"
            >
              <i className="fas fa-step-backward"></i>
            </button>
            
            <button 
              className="player-control-button play-pause-button" 
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
            </button>
            
            <button 
              className="player-control-button next-button" 
              onClick={() => playNextTrack(playingTrack)}
              disabled={tracks.findIndex(track => track.id === playingTrack) >= tracks.length - 1}
              aria-label="Next track"
            >
              <i className="fas fa-step-forward"></i>
            </button>
          </div>
          
          <div className="player-progress">
            <span className="time-elapsed">{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={duration ? (currentTime / duration) * 100 : 0} 
              onChange={seekTo}
              className="progress-slider"
              aria-label="Seek"
            />
            <span className="time-total">{formatTime(duration)}</span>
          </div>
          
          <div className="player-volume">
            <i className="fas fa-volume-up"></i>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={handleVolumeChange}
              className="volume-slider"
              aria-label="Volume"
            />
          </div>
        </div>
      )}
      
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
    </div>
  );
};

export default PlaylistDetail;