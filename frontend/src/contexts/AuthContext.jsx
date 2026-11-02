import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, userService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('kasicircle_token');
      if (token) {
        const cachedUser = localStorage.getItem('kasicircle_user');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
            setIsAuthenticated(true);
          } catch (e) {
            // Ignore parse error
          }
        }

        try {
          const userData = await userService.getCurrentUser();
          setUser(userData);
          localStorage.setItem('kasicircle_user', JSON.stringify(userData));
          setIsAuthenticated(true);
        } catch (err) {
          // Token is invalid, clear it
          localStorage.removeItem('kasicircle_token');
          localStorage.removeItem('kasicircle_user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(email, password);
      const token = response.token;

      localStorage.setItem('kasicircle_token', token);

      // Fetch user data
      const userData = await userService.getCurrentUser();
      localStorage.setItem('kasicircle_user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.register(formData);
      // Auto-login after registration
      return await login(formData.email, formData.password);
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('kasicircle_user', JSON.stringify(updatedUserData));
  }, []);

  const value = {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
