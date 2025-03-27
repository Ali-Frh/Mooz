import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Playlists from './components/Playlists';
import NewPlaylist from './components/NewPlaylist';
import PlaylistDetail from './components/PlaylistDetail';
import Tracks from './components/Tracks';
import GlobalMusicPlayer from './components/GlobalMusicPlayer';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <MusicPlayerProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/playlists/:id" element={<PlaylistDetail />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlists/new" element={<NewPlaylist />} />
              <Route path="/tracks" element={<Tracks />} />
            </Route>
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <GlobalMusicPlayer />
        </Router>
      </MusicPlayerProvider>
    </AuthProvider>
  );
}

export default App;