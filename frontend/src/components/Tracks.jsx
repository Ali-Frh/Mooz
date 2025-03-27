import { useState, useEffect } from 'react';
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

  if (loading) {
    return <div className="tracks-loading">Loading tracks...</div>;
  }

  if (error) {
    return <div className="tracks-error">{error}</div>;
  }

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
              {tracks.map(track => (
                <tr key={track.id} className={track.result ? 'track-success' : 'track-pending'}>
                  <td>{track.id}</td>
                  <td>{track.name}</td>
                  <td>{track.author}</td>
                  <td className="track-uid">{track.spotify_uid}</td>
                  <td>{track.host || 'N/A'}</td>
                  <td>{track.result ? 'Success' : 'Pending'}</td>
                  <td>{track.fails}</td>
                  <td>{formatDate(track.created_at)}</td>
                  <td>
                    <button 
                      className={`play-button ${playingTrack === track.id ? 'playing' : ''}`}
                      onClick={() => playTrack(track)}
                      disabled={!track.result && track.fails > 3}
                    >
                      {playingTrack === track.id ? '⏸️' : '▶️'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Tracks;
