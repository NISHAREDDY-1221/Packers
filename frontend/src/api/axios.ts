import axios from 'axios';

// Get base URL from environment variables, fallback to local backend for development
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
apiClient.interceptors.request.use(
  (config) => {
    const path = window.location.pathname;
    let tokenKey = 'token';
    if (path.startsWith('/operator')) {
      tokenKey = 'token_operator';
    } else if (path.startsWith('/qc')) {
      tokenKey = 'token_qc';
    }

    const token = localStorage.getItem(tokenKey) || localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - please login again.');
      
      const path = window.location.pathname;
      let tokenKey = 'token';
      let userKey = 'user';
      if (path.startsWith('/operator')) {
        tokenKey = 'token_operator';
        userKey = 'user_operator';
      } else if (path.startsWith('/qc')) {
        tokenKey = 'token_qc';
        userKey = 'user_qc';
      }

      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if we are not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
