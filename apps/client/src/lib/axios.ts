import axios from "axios";

// Lee la URL base desde las variables de entorno con un valor por defecto para desarrollo.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
console.log("AXIOS BASE URL:", baseURL);

// Crea la instancia de axios con la configuración
const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
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
  }
);

export default apiClient;
