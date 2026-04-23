import axios from 'axios';

const productionApiUrl = 'https://eirs-technology-crm.vercel.app/api';

// Determine API base URL based on environment
const getAPIUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If explicitly set in .env, use it
  if (envApiUrl) {
    return envApiUrl;
  }

  // In development, use relative path (proxied by Vite to localhost:5000)
  if (import.meta.env.MODE === 'development') {
    return '/api';
  }

  // In production, point to the deployed CRM backend unless an env override is provided.
  return productionApiUrl;
};

const API = axios.create({
  baseURL: getAPIUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
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
