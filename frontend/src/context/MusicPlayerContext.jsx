import { createContext, useState, useContext, useEffect, useRef } from 'react';

const MusicPlayerContext = createContext();

export const MusicPlayerProvider = ({ children }) => {
  const [playingTrack, setPlayingTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef(null);

  useEffect(() => {
    // Cleanup audio element on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const playTrack = (track) => {
    // If we're already playing this track, just toggle play/pause
    if (playingTrack && playingTrack.id === track.id) {
      togglePlayPause();
      return;
    }

    // Stop current audio if playing
    stopPlayback();

    // Create new audio element
    const audio = new Audio(track.link);
    audio.volume = volume;
    
    // Set up event listeners
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });
    
    // Start playback
    audio.play().then(() => {
      audioRef.current = audio;
      setPlayingTrack(track);
      setIsPlaying(true);
      
      // Update document title with current track
      document.title = `${track.name} - ${track.author} | Mooz`;
    }).catch(error => {
      console.error('Error playing track:', error);
    });
  };
  
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('timeupdate', updateProgress);
      audioRef.current.removeEventListener('ended', () => {});
      audioRef.current.src = '';
      audioRef.current = null;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      // Reset document title
      document.title = 'Mooz';
    }
  };
  
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const seekTo = (value) => {
    if (!audioRef.current) return;
    
    const seekTime = (value / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
  const playNext = (tracks) => {
    if (!playingTrack || !tracks || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(track => track.id === playingTrack.id);
    if (currentIndex === -1 || currentIndex === tracks.length - 1) return;
    
    const nextTrack = tracks[currentIndex + 1];
    playTrack(nextTrack);
  };
  
  const playPrevious = (tracks) => {
    if (!playingTrack || !tracks || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(track => track.id === playingTrack.id);
    if (currentIndex <= 0) return;
    
    const previousTrack = tracks[currentIndex - 1];
    playTrack(previousTrack);
  };

  const value = {
    playingTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playTrack,
    stopPlayback,
    togglePlayPause,
    seekTo,
    handleVolumeChange,
    formatTime,
    playNext,
    playPrevious
  };

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
