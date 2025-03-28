import React, { createContext, useState, useContext, useRef, useEffect } from "react";

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
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    // Stop any currently playing audio before starting a new one
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (currentTrack && audioRef.current) {
      // Use the link property instead of url
      audioRef.current.src = currentTrack.link;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error("Error playing audio:", error);
      });
    }
  }, [currentTrack]);

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
