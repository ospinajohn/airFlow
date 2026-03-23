import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🛡️ Interceptor para añadir el Token en cada petición
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('airflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❌ Interceptor para el manejo de errores globales (ej: 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Opcional: Cerrar sesión automática si el token vence
      localStorage.removeItem('airflow_user');
      localStorage.removeItem('airflow_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
