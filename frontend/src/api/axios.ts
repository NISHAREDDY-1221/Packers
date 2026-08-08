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
    let token = null;
    
    if (path.startsWith('/operator')) {
      token = localStorage.getItem('token_operator') || localStorage.getItem('token_admin') || localStorage.getItem('token');
    } else if (path.startsWith('/qc')) {
      token = localStorage.getItem('token_qc') || localStorage.getItem('token_admin') || localStorage.getItem('token');
    } else {
      token = localStorage.getItem('token_admin') || localStorage.getItem('token');
    }

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
      if (path.startsWith('/operator')) {
        localStorage.removeItem('token_operator');
        localStorage.removeItem('user_operator');
      } else if (path.startsWith('/qc')) {
        localStorage.removeItem('token_qc');
        localStorage.removeItem('user_qc');
      } else {
        localStorage.removeItem('token_admin');
        localStorage.removeItem('user_admin');
      }
      
      // Redirect to login if we are not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
