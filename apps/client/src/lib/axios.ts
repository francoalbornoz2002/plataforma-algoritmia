import axios from "axios";

// Lee la URL base desde las variables de entorno con un valor por defecto para desarrollo.
const baseURL = import.meta.env.VITE_API_URL;

// Crea la instancia de axios con la configuración
const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Importante: Permite enviar/recibir cookies (Refresh Token)
});

// Interceptor para añadir el token Bearer a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Devuelve la configuración modificada
  },
  (error) => {
    // Maneja errores de configuración de la petición
    return Promise.reject(error);
  },
);

// --- Lógica de Refresh Token ---

// Cola de peticiones fallidas que esperan el nuevo token
let failedQueue: any[] = [];
let isRefreshing = false;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de respuesta para manejar errores 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no es un reintento
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si la petición original era al endpoint de refresh, no reintentamos (evitar bucle infinito)
      if (originalRequest.url.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      // Si la petición original era LOGIN o LOGOUT, no intentamos refrescar.
      // Dejamos que el error pase para que el componente UI lo maneje (ej: mostrar "Contraseña incorrecta").
      if (
        originalRequest.url.includes("/auth/login") ||
        originalRequest.url.includes("/auth/logout")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Si ya se está refrescando, encolamos la petición
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Llamamos al endpoint de refresh (las cookies van automáticas por withCredentials: true)
        const { data } = await apiClient.post("/auth/refresh");
        const newToken = data.accessToken;

        // Guardamos el nuevo token
        localStorage.setItem("accessToken", newToken);
        apiClient.defaults.headers.common["Authorization"] =
          "Bearer " + newToken;

        // Procesamos la cola
        processQueue(null, newToken);

        // Reintentamos la petición original
        originalRequest.headers["Authorization"] = "Bearer " + newToken;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // Si falla el refresh (token expirado o inválido), cerramos sesión
        localStorage.removeItem("accessToken");
        // Redirigimos al login (opcional, o dejamos que el AuthProvider maneje el estado null)
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
