import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Configure axios with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to include the auth token in headers
api.interceptors.request.use(
  (config) => {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
