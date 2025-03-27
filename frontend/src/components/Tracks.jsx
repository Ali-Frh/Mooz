import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Tracks.css';

const Tracks = () => {
  const { user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get('/tracks');
        setTracks(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError('Failed to load tracks. Please try again later.');
        setLoading(false);
      }
    };

    fetchTracks();

    // Cleanup audio element on unmount
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const playTrack = async (track) => {
    try {
      // Stop current audio if playing
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }

      // If we already have a link, play it directly
      if (track.result && track.link) {
        const audio = new Audio(track.link);
        audio.play();
        setAudioElement(audio);
        setPlayingTrack(track.id);
        return;
      }

      // Otherwise request the track from the server
      const response = await axios.post(`/tracks/play/${track.spotify_uid}`);
      
      if (response.data.status === 'success') {
        // Track is ready to play
        const audio = new Audio(response.data.track.link);
        audio.play();
        setAudioElement(audio);
        setPlayingTrack(track.id);
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

  const removeTrack = async (trackId) => {
    try {
      // If this track is currently playing, stop it
      if (playingTrack === trackId && audioElement) {
        audioElement.pause();
        audioElement.src = '';
        setAudioElement(null);
        setPlayingTrack(null);
      }

      // Delete the track from the server
      await axios.delete(`/tracks/${trackId}`);
      
      // Update the tracks list
      setTracks(tracks.filter(track => track.id !== trackId));
      
      // Show success notification
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          title: 'Track Removed',
          text: 'The track has been removed successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      });
    } catch (err) {
      console.error('Error removing track:', err);
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          title: 'Error',
          text: 'Failed to remove track. Please try again later.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      });
    }
  };

  // Group tracks by name and spotify_uid for tree-like display
  const groupTracks = () => {
    const groupedByName = {};
    const groupedBySpotifyId = {};
    
    // First group by name
    tracks.forEach(track => {
      const key = `${track.name}-${track.author}`;
      if (!groupedByName[key]) {
        groupedByName[key] = [];
      }
      groupedByName[key].push(track);
    });
    
    // Then group by spotify_uid within each name group
    Object.keys(groupedByName).forEach(nameKey => {
      const nameGroup = groupedByName[nameKey];
      const spotifyGroups = {};
      
      nameGroup.forEach(track => {
        if (!spotifyGroups[track.spotify_uid]) {
          spotifyGroups[track.spotify_uid] = [];
        }
        spotifyGroups[track.spotify_uid].push(track);
      });
      
      groupedBySpotifyId[nameKey] = spotifyGroups;
    });
    
    return { groupedByName, groupedBySpotifyId };
  };

  if (loading) {
    return <div className="tracks-loading">Loading tracks...</div>;
  }

  if (error) {
    return <div className="tracks-error">{error}</div>;
  }

  const { groupedByName, groupedBySpotifyId } = groupTracks();

  return (
    <div className="tracks-container">
      <h1>All Tracks</h1>
      
      <div className="tracks-info">
        <p>Total Tracks: {tracks.length}</p>
      </div>

      <div className="tracks-list-container">
        {tracks.length === 0 ? (
          <div className="no-tracks">
            <p>No tracks have been processed yet.</p>
            <p>Play tracks from your playlists to add them to this list.</p>
          </div>
        ) : (
          <table className="tracks-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Artist</th>
                <th>Spotify UID</th>
                <th>Host</th>
                <th>Status</th>
                <th>Fails</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedByName).map(nameKey => {
                const nameGroup = groupedByName[nameKey];
                const spotifyGroups = groupedBySpotifyId[nameKey];
                
                // Sort by ID to ensure consistent display
                nameGroup.sort((a, b) => a.id - b.id);
                
                // Get the first track for the main row
                const mainTrack = nameGroup[0];
                
                return (
                  <Fragment key={nameKey}>
                    {/* Main row for this track name */}
                    <tr className={mainTrack.result ? 'track-success' : 'track-pending'}>
                      <td>{mainTrack.id}</td>
                      <td>{mainTrack.name}</td>
                      <td>{mainTrack.author}</td>
                      <td className="track-uid">{mainTrack.spotify_uid}</td>
                      <td>{mainTrack.host || 'N/A'}</td>
                      <td>{mainTrack.result ? 'Success' : 'Pending'}</td>
                      <td>{mainTrack.fails}</td>
                      <td>{formatDate(mainTrack.created_at)}</td>
                      <td className="track-actions">
                        <button 
                          className={`play-button ${playingTrack === mainTrack.id ? 'playing' : ''}`}
                          onClick={() => playTrack(mainTrack)}
                          disabled={!mainTrack.result && mainTrack.fails > 3}
                          aria-label="Play track"
                        >
                          {playingTrack === mainTrack.id ? '⏸️' : '▶️'}
                        </button>
                        <button 
                          className="remove-button"
                          onClick={() => removeTrack(mainTrack.id)}
                          aria-label="Remove track"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Child rows for additional versions of the same track */}
                    {nameGroup.slice(1).map(track => (
                      <tr 
                        key={track.id} 
                        className={`track-child ${track.result ? 'track-success' : 'track-pending'}`}
                      >
                        <td>{track.id}</td>
                        <td className="track-child-name">{track.name}</td>
                        <td>{track.author}</td>
                        <td className="track-uid">{track.spotify_uid}</td>
                        <td>{track.host || 'N/A'}</td>
                        <td>{track.result ? 'Success' : 'Pending'}</td>
                        <td>{track.fails}</td>
                        <td>{formatDate(track.created_at)}</td>
                        <td className="track-actions">
                          <button 
                            className={`play-button ${playingTrack === track.id ? 'playing' : ''}`}
                            onClick={() => playTrack(track)}
                            disabled={!track.result && track.fails > 3}
                            aria-label="Play track"
                          >
                            {playingTrack === track.id ? '⏸️' : '▶️'}
                          </button>
                          <button 
                            className="remove-button"
                            onClick={() => removeTrack(track.id)}
                            aria-label="Remove track"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Tracks;
