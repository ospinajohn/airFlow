import axios from "axios";
const apiClient = axios.create({
  baseURL: "https://backend-production-ca97.up.railway.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🛡️ Interceptor para añadir el Token en cada petición
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("airflow_token");
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
      const isLoginAttempt = error.config?.url?.includes("/auth/login");

      // Solo cerrar sesión automática si NO es un intento de login
      if (!isLoginAttempt) {
        localStorage.removeItem("airflow_user");
        localStorage.removeItem("airflow_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error); // ← ahora sí llega al catch del componente
  },
);

export default apiClient;
