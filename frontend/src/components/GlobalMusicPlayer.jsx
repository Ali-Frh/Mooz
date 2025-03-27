import { useEffect } from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import '../styles/GlobalMusicPlayer.css';

const GlobalMusicPlayer = () => {
  const { 
    playingTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume,
    togglePlayPause, 
    seekTo, 
    handleVolumeChange, 
    formatTime,
    stopPlayback
  } = useMusicPlayer();

  // Hide player when no track is playing
  if (!playingTrack) return null;

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
          className="player-control-button play-pause-button" 
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
        </button>
        
        <button 
          className="player-control-button stop-button" 
          onClick={stopPlayback}
          aria-label="Stop"
        >
          <i className="fas fa-stop"></i>
        </button>
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
