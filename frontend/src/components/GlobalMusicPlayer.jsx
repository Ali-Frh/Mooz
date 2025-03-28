import { useEffect, useState } from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/GlobalMusicPlayer.css';

const GlobalMusicPlayer = () => {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume,
    playTrack,
    pauseTrack,
    resumeTrack,
    seekTo, 
    changeVolume,
    isGlobalPlayerVisible,
    currentPlaylist,
    currentPlaylistTracks,
    playNextTrack,
    playPreviousTrack
  } = useMusicPlayer();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // If no track is playing, don't show the player
  if (!currentTrack || !isGlobalPlayerVisible) return null;

  // Format time for display (e.g., 3:45)
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    seekTo(newTime);
  };
  
  const handleVolumeChange = (newVolume) => {
    changeVolume(newVolume);
  };
  
  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };
  
  const goToPlaylist = () => {
    if (currentPlaylist && currentPlaylist.id) {
      navigate(`/playlists/${currentPlaylist.id}`);
    }
  };

  return (
    <div className="global-music-player">
      <div className="player-track-info">
        <div className="player-track-name">{currentTrack.name || currentTrack.title}</div>
        <div className="player-track-author">{currentTrack.author || currentTrack.artist}</div>
        {currentPlaylist && (
          <button 
            className="player-playlist-link" 
            onClick={goToPlaylist}
            aria-label="Go to playlist"
          >
            {currentPlaylist.name}
          </button>
        )}
      </div>
      
      <div className="player-controls">
        <button 
          className="player-control-button" 
          onClick={playPreviousTrack}
          aria-label="Previous track"
        >
          ⏮️
        </button>
        
        <button 
          className="player-control-button play-pause" 
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button 
          className="player-control-button" 
          onClick={playNextTrack}
          aria-label="Next track"
        >
          ⏭️
        </button>
      </div>
      
      <div className="player-progress">
        <span className="time-elapsed">{formatTime(currentTime)}</span>
        <input 
          type="range" 
          min="0" 
          max={duration || 1} 
          value={currentTime} 
          onChange={handleSeek}
          className="progress-slider"
          aria-label="Seek"
        />
        <span className="time-total">{formatTime(duration)}</span>
      </div>
      
      <div className="player-volume">
        <button 
          className="volume-icon"
          aria-label="Volume"
        >
          🔊
        </button>
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
