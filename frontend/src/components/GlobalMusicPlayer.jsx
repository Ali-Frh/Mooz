import { useEffect, useState } from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/GlobalMusicPlayer.css';

const GlobalMusicPlayer = () => {
  const { 
    playingTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume,
    playTrack,
    togglePlayPause, 
    seekTo, 
    handleVolumeChange, 
    formatTime,
    stopPlayback
  } = useMusicPlayer();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [sourcePlaylistId, setSourcePlaylistId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch tracks when a track is playing to enable next/previous functionality
  useEffect(() => {
    if (playingTrack) {
      const fetchTracks = async () => {
        setLoading(true);
        try {
          // First try to get all tracks
          const response = await axios.get('/tracks');
          if (response.data && response.data.length > 0) {
            // Filter tracks that have a valid link
            const validTracks = response.data.filter(track => track.result && track.link);
            setCurrentPlaylist(validTracks);
            console.log('GlobalMusicPlayer: Set current playlist with', validTracks.length, 'tracks');
          }
        } catch (error) {
          console.error('Error fetching tracks for playlist:', error);
        } finally {
          setLoading(false);
        }
      };
      
      // Try to find the source playlist for this track
      const findSourcePlaylist = async () => {
        if (!user) return;
        
        try {
          // Get all playlists
          const response = await axios.get('/public-playlists');
          if (response.data && response.data.length > 0) {
            // Check each playlist for the current track
            for (const playlist of response.data) {
              const playlistDetailResponse = await axios.get(`/playlists/${playlist.id}`);
              const tracks = playlistDetailResponse.data.tracks || [];
              
              // If the playlist contains the current track, set it as the source
              if (tracks.some(track => track.spotify_uid === playingTrack.spotify_uid)) {
                setSourcePlaylistId(playlist.id);
                setCurrentPlaylist(tracks);
                console.log('GlobalMusicPlayer: Found source playlist with', tracks.length, 'tracks');
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error finding source playlist:', error);
        }
      };
      
      if (user) { // Only fetch if user is logged in
        fetchTracks();
        findSourcePlaylist();
      }
    }
  }, [playingTrack, user]);

  // Hide player when no track is playing
  if (!playingTrack) return null;
  
  // Find current track index in playlist
  const currentIndex = currentPlaylist.findIndex(track => 
    // Match by spotify_uid for more reliable matching across different versions
    track.spotify_uid === playingTrack.spotify_uid
  );
  
  const handlePlayNext = () => {
    if (currentIndex === -1 || currentIndex >= currentPlaylist.length - 1) return;
    
    const nextTrack = currentPlaylist[currentIndex + 1];
    playTrackWithLink(nextTrack);
  };

  const handlePlayPrevious = () => {
    if (currentIndex <= 0) return;
    
    const prevTrack = currentPlaylist[currentIndex - 1];
    playTrackWithLink(prevTrack);
  };
  
  const playTrackWithLink = async (track) => {
    try {
      // Request the track from the server
      const response = await axios.post(`/tracks/play/${track.spotify_uid}`);
      
      if (response.data.status === 'success') {
        // Track is ready to play
        playTrack({
          id: track.id,
          name: track.name,
          author: track.author,
          spotify_uid: track.spotify_uid,
          link: response.data.track.link,
          result: true
        }, currentPlaylist);
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };
  
  const goToSourcePlaylist = () => {
    if (sourcePlaylistId) {
      navigate(`/playlists/${sourcePlaylistId}`);
    }
  };

  return (
    <div className="global-music-player">
      <div className="player-track-info">
        <div className="player-track-name">
          {playingTrack.name}
        </div>
        <div className="player-track-author">
          {playingTrack.author}
        </div>
      </div>
      
      <div className="player-controls">
        <button 
          className="player-control-button prev-button" 
          onClick={handlePlayPrevious}
          disabled={currentIndex <= 0}
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
          onClick={handlePlayNext}
          disabled={currentIndex === -1 || currentIndex >= currentPlaylist.length - 1}
          aria-label="Next track"
        >
          <i className="fas fa-step-forward"></i>
        </button>
        
        <button 
          className="player-control-button stop-button" 
          onClick={stopPlayback}
          aria-label="Stop"
        >
          <i className="fas fa-stop"></i>
        </button>
        
        {sourcePlaylistId && (
          <button 
            className="player-control-button playlist-button" 
            onClick={goToSourcePlaylist}
            aria-label="Go to playlist"
            title="Go to source playlist"
          >
            <i className="fas fa-list"></i>
          </button>
        )}
      </div>
      
      <div className="player-progress">
        <span className="time-elapsed">{formatTime(currentTime)}</span>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={duration ? (currentTime / duration) * 100 : 0} 
          onChange={(e) => seekTo(parseFloat(e.target.value))}
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
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="volume-slider"
          aria-label="Volume"
        />
      </div>
    </div>
  );
};

export default GlobalMusicPlayer;
