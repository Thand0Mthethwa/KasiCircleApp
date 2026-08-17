/**
 * API Service for KasiCircle Frontend
 * Handles all backend API calls with authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

// Helper to get auth token from localStorage
const getAuthToken = () => localStorage.getItem('kasicircle_token');

// Helper to set auth headers
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Helper to handle API responses
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType?.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP Error: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const authService = {
  register: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({
        firstName: formData.fullName.split(' ')[0],
        lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      }),
    });

    return handleResponse(response);
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });

    const data = await handleResponse(response);
    return data;
  },

  logout: () => {
    localStorage.removeItem('kasicircle_token');
    localStorage.removeItem('kasicircle_user');
  },
};

export const userService = {
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    return handleResponse(response);
  },

  updateProfile: async (updates) => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates),
    });

    return handleResponse(response);
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    return handleResponse(response);
  },
};

export const businessService = {
  getAllBusinesses: async (page = 0, size = 10) => {
    const response = await fetch(
      `${API_BASE_URL}/api/businesses?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: getHeaders(false),
      }
    );

    return handleResponse(response);
  },

  getBusinessById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses/${id}`, {
      method: 'GET',
      headers: getHeaders(false),
    });

    return handleResponse(response);
  },

  createBusiness: async (businessData) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(businessData),
    });

    return handleResponse(response);
  },

  updateBusiness: async (id, businessData) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(businessData),
    });

    return handleResponse(response);
  },

  deleteBusiness: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return null;
  },
};

export default {
  authService,
  userService,
  businessService,
};
