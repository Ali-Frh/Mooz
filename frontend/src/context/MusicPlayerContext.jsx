import React, { createContext, useState, useContext, useRef, useEffect } from "react";
import axios from 'axios';

const MusicPlayerContext = createContext();

export function MusicPlayerProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentPlaylistTracks, setCurrentPlaylistTracks] = useState([]);
  const [volume, setVolume] = useState(0.5);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isGlobalPlayerVisible, setIsGlobalPlayerVisible] = useState(false);
  const [retryCount, setRetryCount] = useState(0); // Track retry attempts
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    // Reset retry count when changing tracks
    setRetryCount(0);
    
    // Stop any currently playing audio before starting a new one
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (currentTrack && audioRef.current) {
      // Use the link property instead of url
      audioRef.current.src = currentTrack.link;
      
      // Handle playback errors
      const handleError = async (error) => {
        console.error("Error playing audio:", error);
        
        // Limit retries to 3 times
        if (retryCount >= 3) {
          console.log("Maximum retry attempts reached (3). Moving to next track...");
          import('sweetalert2').then((Swal) => {
            Swal.default.fire({
              title: 'Cannot Play Track',
              text: 'We cannot play this track after multiple attempts. Playing next track...',
              icon: 'warning',
              timer: 3000,
              timerProgressBar: true,
              showConfirmButton: false
            });
          });
          
          // Play the next track
          setTimeout(() => {
            playNextTrack();
          }, 1000);
          return;
        }
        
        // If we have a link that failed, try to get an alternative link
        if (currentTrack && currentTrack.link && currentTrack.spotify_uid) {
          try {
            // Increment retry count
            setRetryCount(prevCount => prevCount + 1);
            
            // Request an alternative link from the server
            const response = await axios.post(
              `/tracks/play/${currentTrack.spotify_uid}?failed_link=${encodeURIComponent(currentTrack.link)}`
            );
            
            if (response.data.status === 'success') {
              // We got an alternative link, update the track and try again
              const updatedTrack = {
                ...currentTrack,
                link: response.data.track.link
              };
              setCurrentTrack(updatedTrack);
            } else if (response.data.status === 'no_alternatives') {
              // No more alternatives available, show alert and play next track
              import('sweetalert2').then((Swal) => {
                Swal.default.fire({
                  title: 'Cannot Play Track',
                  text: 'We cannot play this track at the moment. Playing next track...',
                  icon: 'warning',
                  timer: 3000,
                  timerProgressBar: true,
                  showConfirmButton: false
                });
              });
              
              // Play the next track
              setTimeout(() => {
                playNextTrack();
              }, 1000);
            }
          } catch (error) {
            console.error("Error getting alternative link:", error);
            // If we can't get an alternative, try playing the next track
            setTimeout(() => {
              playNextTrack();
            }, 1000);
          }
        }
      };
      
      // Add error event listener
      audioRef.current.addEventListener('error', handleError);
      
      // Try to play the track
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error("Error playing audio:", error);
        // The error event should handle this
      });
      
      // Cleanup function to remove event listener
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, [currentTrack, retryCount]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const playTrack = (track, playlist = null, tracks = []) => {
    // If we're playing from a playlist, store the playlist info and its tracks
    if (playlist) {
      setCurrentPlaylist(playlist);
      setCurrentPlaylistTracks(tracks);
    }

    // Use spotify_uid for comparison instead of _id
    if (currentTrack && currentTrack.spotify_uid === track.spotify_uid) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // Stop any currently playing audio before setting a new track
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
      }
      setCurrentTrack(track);
    }
    setIsGlobalPlayerVisible(true);
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
  };

  const updatePlaylistTracks = (tracks) => {
    setCurrentPlaylistTracks(tracks);
  };

  const playNextTrack = () => {
    if (!currentTrack || !currentPlaylistTracks.length) return;
    
    // Use spotify_uid for finding the track instead of _id
    const currentIndex = currentPlaylistTracks.findIndex(track => track.spotify_uid === currentTrack.spotify_uid);
    if (currentIndex !== -1 && currentIndex < currentPlaylistTracks.length - 1) {
      playTrack(currentPlaylistTracks[currentIndex + 1]);
    }
  };

  const playPreviousTrack = () => {
    if (!currentTrack || !currentPlaylistTracks.length) return;
    
    // Use spotify_uid for finding the track instead of _id
    const currentIndex = currentPlaylistTracks.findIndex(track => track.spotify_uid === currentTrack.spotify_uid);
    if (currentIndex > 0) {
      playTrack(currentPlaylistTracks[currentIndex - 1]);
    }
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        isPlaying,
        currentTrack,
        currentPlaylist,
        currentPlaylistTracks,
        volume,
        duration,
        currentTime,
        isGlobalPlayerVisible,
        playTrack,
        pauseTrack,
        resumeTrack,
        seekTo,
        changeVolume,
        setIsGlobalPlayerVisible,
        updatePlaylistTracks,
        playNextTrack,
        playPreviousTrack
      }}
    >
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          playNextTrack(); // Auto-play next track when current one ends
        }}
      />
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  return useContext(MusicPlayerContext);
}
