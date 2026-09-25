import axios from 'axios';
import { useAuthStore } from '../../store/auth.store';

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
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      useAuthStore.getState().logout();
      window.location.href = '/login'; // Redirección forzada
    }

    // Intercepción de Rate Limiting (429)
    if (error.response?.status === 429) {
      console.warn('[Security]: Rate limit exceeded. Throttling requests.');
      // Opcional: Podrías disparar un evento global para mostrar un Toast en la UI
      // alert('Estás haciendo peticiones muy rápido. Por favor, espera un momento.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;