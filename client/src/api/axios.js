import axios from 'axios';

// Determine API base URL based on environment
const getAPIUrl = () => {
  // In development, use relative path (proxied by Vite)
  if (import.meta.env.MODE === 'development') {
    return '/api';
  }
  // In production on Vercel, use the Render backend
  return 'https://eirs-technology-crm.onrender.com/api';
};

const API = axios.create({
  baseURL: getAPIUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle global 401 errors
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
