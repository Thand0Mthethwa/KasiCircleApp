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
const handleResponse = async (response, { authenticated = false } = {}) => {
  if (response.status === 401 && authenticated && getAuthToken()) {
    localStorage.removeItem('kasicircle_token');
    localStorage.removeItem('kasicircle_user');
    window.dispatchEvent(new Event('kasicircle:unauthorized'));
  }

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
    let phone = formData.phoneNumber.replace(/[\s-]/g, '');
    if (phone.startsWith('0') && phone.length === 10) {
      phone = '+27' + phone.substring(1);
    }
    const nameParts = formData.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const rawAccountType = formData.accountType || 'RESIDENT';
    const accountType = rawAccountType.toUpperCase();

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({
        firstName,
        lastName,
        email: formData.email.trim(),
        phoneNumber: phone,
        password: formData.password,
        accountType,
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

    return handleResponse(response, { authenticated: true });
  },

  updateProfile: async (updates) => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates),
    });

    return handleResponse(response, { authenticated: true });
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

    return handleResponse(response, { authenticated: true });
  },
};

export const businessService = {
  getAllBusinesses: async (pageOrParams = 0, maybeSize = 10, maybeFilters = {}) => {
    let page = 0;
    let size = 10;
    let search = '';
    let category = '';
    let city = '';

    if (typeof pageOrParams === 'object' && pageOrParams !== null) {
      page = pageOrParams.page ?? 0;
      size = pageOrParams.size ?? 10;
      search = pageOrParams.search ?? '';
      category = pageOrParams.category ?? '';
      city = pageOrParams.city ?? '';
    } else {
      page = pageOrParams;
      size = maybeSize;
      search = maybeFilters.search ?? '';
      category = maybeFilters.category ?? '';
      city = maybeFilters.city ?? '';
    }

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('size', size);
    if (search && search.trim()) queryParams.append('search', search.trim());
    if (category && category.trim()) queryParams.append('category', category.trim());
    if (city && city.trim()) queryParams.append('city', city.trim());

    const response = await fetch(
      `${API_BASE_URL}/api/businesses?${queryParams.toString()}`,
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

  getBusinessImages: async (businessId) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/images`, {
      method: 'GET',
      headers: getHeaders(false),
    });

    return handleResponse(response);
  },

  uploadBusinessImage: async (businessId, file, isCover = false) => {
    const formData = new FormData();
    formData.append('file', file);
    if (isCover) {
      formData.append('isCover', 'true');
    }

    const headers = {};
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/images`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return handleResponse(response, { authenticated: true });
  },

  setCoverImage: async (businessId, imageId) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/images/${imageId}/cover`, {
      method: 'PUT',
      headers: getHeaders(true),
    });

    return handleResponse(response, { authenticated: true });
  },

  deleteBusinessImage: async (businessId, imageId) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/images/${imageId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });

    if (!response.ok) {
      return handleResponse(response, { authenticated: true });
    }

    return null;
  },

  getMyBusinesses: async (page = 0, size = 10) => {
    const response = await fetch(
      `${API_BASE_URL}/api/users/me/businesses?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: getHeaders(true),
      }
    );

    return handleResponse(response, { authenticated: true });
  },

  createBusiness: async (businessData) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(businessData),
    });

    return handleResponse(response, { authenticated: true });
  },

  updateBusiness: async (id, businessData) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(businessData),
    });

    return handleResponse(response, { authenticated: true });
  },

  deleteBusiness: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });

    if (!response.ok) {
      return handleResponse(response, { authenticated: true });
    }

    return null;
  },

  getBusinessReviews: async (businessId, page = 0, size = 10) => {
    const response = await fetch(
      `${API_BASE_URL}/api/businesses/${businessId}/reviews?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: getHeaders(false),
      }
    );

    return handleResponse(response);
  },

  getBusinessReviewSummary: async (businessId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/businesses/${businessId}/reviews/summary`,
      {
        method: 'GET',
        headers: getHeaders(false),
      }
    );

    return handleResponse(response);
  },

  createReview: async (businessId, reviewData) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/reviews`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(reviewData),
    });

    return handleResponse(response, { authenticated: true });
  },

  updateReview: async (businessId, reviewId, reviewData) => {
    const response = await fetch(
      `${API_BASE_URL}/api/businesses/${businessId}/reviews/${reviewId}`,
      {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(reviewData),
      }
    );

    return handleResponse(response, { authenticated: true });
  },

  deleteReview: async (businessId, reviewId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/businesses/${businessId}/reviews/${reviewId}`,
      {
        method: 'DELETE',
        headers: getHeaders(true),
      }
    );

    if (response.status === 204) {
      return null;
    }

    return handleResponse(response, { authenticated: true });
  },

  getMyReview: async (businessId) => {
    const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/reviews/me`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    if (response.status === 204) {
      return null;
    }

    return handleResponse(response, { authenticated: true });
  },
};

export const reviewService = {
  getReviews: (businessId, page = 0, size = 10) =>
    businessService.getBusinessReviews(businessId, page, size),
  getSummary: (businessId) =>
    businessService.getBusinessReviewSummary(businessId),
  getMyReview: (businessId) =>
    businessService.getMyReview(businessId),
  createReview: (businessId, reviewData) =>
    businessService.createReview(businessId, reviewData),
  updateReview: (businessId, reviewId, reviewData) =>
    businessService.updateReview(businessId, reviewId, reviewData),
  deleteReview: (businessId, reviewId) =>
    businessService.deleteReview(businessId, reviewId),
};

export const workerService = {
  getWorkers: async ({ page = 0, size = 10, search = '', category = '', skill = '', city = '' } = {}) => {
    const queryParams = new URLSearchParams({ page, size });
    if (search.trim()) queryParams.set('search', search.trim());
    if (category.trim()) queryParams.set('category', category.trim());
    if (skill.trim()) queryParams.set('skill', skill.trim());
    if (city.trim()) queryParams.set('city', city.trim());

    const response = await fetch(`${API_BASE_URL}/api/workers?${queryParams.toString()}`, {
      method: 'GET',
      headers: getHeaders(false),
    });

    return handleResponse(response);
  },

  getWorkerById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/workers/${id}`, {
      method: 'GET',
      headers: getHeaders(false),
    });

    return handleResponse(response);
  },

  getMyProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/api/workers/me`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    return handleResponse(response, { authenticated: true });
  },

  createMyProfile: async (profile) => {
    const response = await fetch(`${API_BASE_URL}/api/workers/me`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(profile),
    });

    return handleResponse(response, { authenticated: true });
  },

  updateMyProfile: async (profile) => {
    const response = await fetch(`${API_BASE_URL}/api/workers/me`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(profile),
    });

    return handleResponse(response, { authenticated: true });
  },
};

export const jobService = {
  getJobs: async ({ page = 0, size = 10, search = '', category = '', city = '', status = 'OPEN' } = {}) => {
    const queryParams = new URLSearchParams({ page, size, status });
    if (search.trim()) queryParams.set('search', search.trim());
    if (category.trim()) queryParams.set('category', category.trim());
    if (city.trim()) queryParams.set('city', city.trim());

    const response = await fetch(`${API_BASE_URL}/api/jobs?${queryParams.toString()}`, {
      method: 'GET',
      headers: getHeaders(false),
    });

    return handleResponse(response);
  },

  getJobById: async (jobId) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      method: 'GET',
      headers: getHeaders(false),
    });

    return handleResponse(response);
  },

  createJob: async (job) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(job),
    });

    return handleResponse(response, { authenticated: true });
  },

  updateJob: async (jobId, job) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(job),
    });

    return handleResponse(response, { authenticated: true });
  },

  updateJobStatus: async (jobId, status) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });

    return handleResponse(response, { authenticated: true });
  },

  applyForJob: async (jobId, message) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/applications`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ message }),
    });

    return handleResponse(response, { authenticated: true });
  },

  getMyApplications: async (page = 0, size = 10) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/me/applications?page=${page}&size=${size}`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    return handleResponse(response, { authenticated: true });
  },

  getApplicationsForJob: async (jobId) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/applications`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    return handleResponse(response, { authenticated: true });
  },

  updateApplicationStatus: async (jobId, applicationId, status) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/applications/${applicationId}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });

    return handleResponse(response, { authenticated: true });
  },
};

export const messagingService = {
  getConversations: async () => {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    return handleResponse(response, { authenticated: true });
  },

  createConversation: async (participantId) => {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ participantId }),
    });

    return handleResponse(response, { authenticated: true });
  },

  getMessages: async (conversationId, page = 0, size = 50) => {
    const queryParams = new URLSearchParams({ page, size, sort: 'createdAt,desc' });
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/messages?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: getHeaders(true),
      }
    );

    return handleResponse(response, { authenticated: true });
  },

  sendMessage: async (conversationId, content) => {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ content }),
    });

    return handleResponse(response, { authenticated: true });
  },
};

export default {
  authService,
  userService,
  businessService,
  reviewService,
  workerService,
  jobService,
  messagingService,
};
