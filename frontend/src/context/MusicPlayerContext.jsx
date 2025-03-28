import { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const MusicPlayerContext = createContext();

export const MusicPlayerProvider = ({ children }) => {
  const [playingTrack, setPlayingTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef(null);
  const playlistRef = useRef(null);
  const prevTimeRef = useRef(0);

  useEffect(() => {
    // Cleanup audio element on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Add a useEffect to detect when a track ends by monitoring currentTime reset
  useEffect(() => {
    // Only check if we have a track and the time has reset to near zero from a non-zero value
    if (playingTrack && currentTime < 0.1 && prevTimeRef.current > 1) {
      console.log('Track ended detected via currentTime reset', 
        'Previous time:', prevTimeRef.current, 
        'Current time:', currentTime);
      
      // Get the current playlist from the ref
      const currentPlaylist = playlistRef.current;
      
      if (currentPlaylist && currentPlaylist.length > 0) {
        const currentIndex = currentPlaylist.findIndex(t => t.spotify_uid === playingTrack.spotify_uid);
        console.log('Current track index:', currentIndex, 'out of', currentPlaylist.length);
        
        if (currentIndex !== -1 && currentIndex < currentPlaylist.length - 1) {
          console.log('Auto-playing next track at index:', currentIndex + 1);
          const nextTrack = currentPlaylist[currentIndex + 1];
          console.log('Next track:', nextTrack);
          
          // First stop current playback completely
          stopPlayback();
          
          // Use axios to fetch the track link and play it
          console.log('Fetching link for next track...');
          axios.post(`/tracks/play/${nextTrack.spotify_uid}`)
            .then(response => {
              if (response.data.status === 'success' && response.data.track && response.data.track.link) {
                console.log('Successfully fetched link for next track:', response.data.track.link);
                
                // Create a complete track object with the link
                const trackWithLink = {
                  ...nextTrack,
                  link: response.data.track.link
                };
                
                // Now play this track
                console.log('Playing next track with fetched link');
                playTrack(trackWithLink, currentPlaylist);
              } else {
                console.error('Failed to get link for next track:', response.data);
              }
            })
            .catch(error => {
              console.error('Error fetching next track link:', error);
            });
        } else {
          console.log('No next track available or at end of playlist');
        }
      }
    }
    
    // Update the previous time reference
    prevTimeRef.current = currentTime;
  }, [currentTime, playingTrack]);

  const playTrack = (track, playlist = []) => {
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
    
    // Handle track ending - this is critical for auto-play
    const handleTrackEnd = () => {
      console.log('Track ended event fired');
      setIsPlaying(false);
      
      // Auto-play next track if playlist is provided
      if (playlist && playlist.length > 0) {
        console.log('Track ended, checking for next track in playlist of length:', playlist.length);
        // Find the current track in the playlist by spotify_uid for more reliable matching
        const currentIndex = playlist.findIndex(t => t.spotify_uid === track.spotify_uid);
        console.log('Current track index:', currentIndex);
        
        if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
          console.log('Playing next track at index:', currentIndex + 1);
          const nextTrack = playlist[currentIndex + 1];
          // Use setTimeout to ensure the current audio context is fully cleaned up
          setTimeout(() => {
            playTrack(nextTrack, playlist);
          }, 500);
        } else {
          console.log('No next track available or at end of playlist');
        }
      }
    };
    
    // Add the ended event listener
    audio.addEventListener('ended', handleTrackEnd);
    
    // Start playback
    audio.play().then(() => {
      audioRef.current = audio;
      setPlayingTrack(track);
      setIsPlaying(true);
      playlistRef.current = playlist;
      // Update document title with current track
      document.title = `${track.name} - ${track.author} | Mooz`;
    }).catch(error => {
      console.error('Error playing track:', error);
    });
  };
  
  const stopPlayback = () => {
    if (audioRef.current) {
      // First pause the audio
      audioRef.current.pause();
      
      // Remove all event listeners to prevent memory leaks
      audioRef.current.onloadedmetadata = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onended = null;
      audioRef.current.removeEventListener('timeupdate', updateProgress);
      audioRef.current.removeEventListener('loadedmetadata', () => {});
      audioRef.current.removeEventListener('ended', () => {});
      
      // Clear the source and reference
      audioRef.current.src = '';
      audioRef.current = null;
      
      // Reset state
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
    
    // Use spotify_uid for more reliable matching
    const currentIndex = tracks.findIndex(track => track.spotify_uid === playingTrack.spotify_uid);
    console.log('playNext - Current index:', currentIndex, 'out of', tracks.length, 'tracks');
    
    if (currentIndex === -1 || currentIndex === tracks.length - 1) return;
    
    const nextTrack = tracks[currentIndex + 1];
    console.log('Playing next track:', nextTrack.name);
    playTrack(nextTrack, tracks);
  };
  
  const playPrevious = (tracks) => {
    if (!playingTrack || !tracks || tracks.length === 0) return;
    
    // Use spotify_uid for more reliable matching
    const currentIndex = tracks.findIndex(track => track.spotify_uid === playingTrack.spotify_uid);
    console.log('playPrevious - Current index:', currentIndex, 'out of', tracks.length, 'tracks');
    
    if (currentIndex <= 0) return;
    
    const previousTrack = tracks[currentIndex - 1];
    console.log('Playing previous track:', previousTrack.name);
    playTrack(previousTrack, tracks);
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
