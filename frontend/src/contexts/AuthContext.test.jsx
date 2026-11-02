import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { authService, userService } from '../services/api';

// Mock API services
vi.mock('../services/api', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  userService: {
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

describe('AuthContext', () => {
  const mockUser = {
    id: 'user-001',
    firstName: 'Bongani',
    lastName: 'Ndlovu',
    email: 'bongani@example.com',
    phoneNumber: '+27831112233',
    role: 'USER',
    accountType: 'WORKER',
  };

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('throws an error if useAuth is used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider'
    );
    consoleSpy.mockRestore();
  });

  it('initializes with unauthenticated state when no token exists in localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('loads user information correctly on mount when a valid token exists', async () => {
    localStorage.setItem('kasicircle_token', 'valid-jwt-token');
    userService.getCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(userService.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(JSON.parse(localStorage.getItem('kasicircle_user'))).toEqual(mockUser);
  });

  it('clears session and tokens if token verification fails on mount', async () => {
    localStorage.setItem('kasicircle_token', 'expired-jwt-token');
    localStorage.setItem('kasicircle_user', JSON.stringify(mockUser));
    userService.getCurrentUser.mockRejectedValueOnce(new Error('Token expired'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('kasicircle_token')).toBeNull();
    expect(localStorage.getItem('kasicircle_user')).toBeNull();
  });

  it('synchronizes token and user information upon successful login', async () => {
    authService.login.mockResolvedValueOnce({ token: 'new-auth-token' });
    userService.getCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('bongani@example.com', 'secret123');
    });

    expect(loginResult.success).toBe(true);
    expect(authService.login).toHaveBeenCalledWith('bongani@example.com', 'secret123');
    expect(localStorage.getItem('kasicircle_token')).toBe('new-auth-token');
    expect(JSON.parse(localStorage.getItem('kasicircle_user'))).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('sets error state when login fails', async () => {
    authService.login.mockRejectedValueOnce({
      data: { message: 'Invalid credentials' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('wrong@example.com', 'badpass');
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe('Invalid credentials');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('clears the user session and local storage on logout', async () => {
    localStorage.setItem('kasicircle_token', 'active-token');
    userService.getCurrentUser.mockResolvedValueOnce(mockUser);

    // Default implementation of authService.logout
    authService.logout.mockImplementation(() => {
      localStorage.removeItem('kasicircle_token');
      localStorage.removeItem('kasicircle_user');
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    act(() => {
      result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('kasicircle_token')).toBeNull();
    expect(localStorage.getItem('kasicircle_user')).toBeNull();
  });

  it('synchronizes user information in state and localStorage when updateUser is called', async () => {
    localStorage.setItem('kasicircle_token', 'active-token');
    userService.getCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    const updatedUser = {
      ...mockUser,
      firstName: 'BonganiUpdated',
      lastName: 'NdlovuUpdated',
    };

    act(() => {
      result.current.updateUser(updatedUser);
    });

    expect(result.current.user).toEqual(updatedUser);
    expect(JSON.parse(localStorage.getItem('kasicircle_user'))).toEqual(updatedUser);
  });
});
