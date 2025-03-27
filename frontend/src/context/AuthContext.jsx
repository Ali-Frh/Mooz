import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = false; // Changed to false to avoid CORS preflight issues

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add token to requests if available
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is already logged in
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setUser(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Token verification failed:', error);
        logout();
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const register = async (username, email, password) => {
    setError(null);
    try {
      const response = await axios.post('/signup', { 
        username, 
        email, 
        password 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed');
      throw error;
    }
  };

  const login = async (username, password) => {
    setError(null);
    try {
      // Use FormData as required by FastAPI's OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post('/token', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const { access_token } = response.data;
      
      // Save token and fetch user data
      setToken(access_token);
      localStorage.setItem('token', access_token);
      
      // Get user data
      const userResponse = await axios.get('/users/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      });
      setUser(userResponse.data);
      
      return userResponse.data;
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Create a public axios instance for unauthenticated requests
  const publicAxios = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: false
  });

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    publicAxios
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
