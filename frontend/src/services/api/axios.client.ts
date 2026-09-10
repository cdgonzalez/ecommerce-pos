import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Aquí (Iteración 04) se inyectará el token JWT de Zustand/Context
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Passthrough directo a la data limpia
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || 'An unexpected server error occurred';
    console.error('[HTTP Client Error]:', errorMessage);
    
    // Aquí (Iteración 04) manejaremos la redirección si el estatus es 401 Unauthorized
    
    return Promise.reject(error);
  }
);

export default apiClient;