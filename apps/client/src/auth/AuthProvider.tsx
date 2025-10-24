// src/providers/AuthProvider.tsx
import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
  useCallback,
} from "react";
import apiClient from "../lib/axios"; // Importa la instancia configurada
import { useNavigate } from "react-router";
import { jwtDecode } from "jwt-decode";
import type { Rol } from "../types/roles";

// Defino la interfaz User
export interface User {
  userId: string;
  rol: Rol;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tipado del payload decodificado (ajusta si tu token tiene otros campos)
interface JwtPayload {
  id: string;
  rol: Rol;
  exp: number;
}

const getUserFromToken = (token: string | null): User | null => {
  if (!token) return null;
  try {
    const decoded: JwtPayload = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("accessToken");
      return null;
    }

    // Asegura que el rol decodificado sea uno de los válidos
    if (!["ADMIN", "DOCENTE", "ALUMNO"].includes(decoded.rol)) {
      console.error("Rol inválido en el token:", decoded.rol);
      localStorage.removeItem("accessToken");
      return null;
    }

    return { userId: decoded.id, rol: decoded.rol || "" };
  } catch (error) {
    console.error("Error decodificando token:", error);
    localStorage.removeItem("accessToken");
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("accessToken")
  ); // Lee token inicial
  const [user, setUser] = useState<User | null>(() => getUserFromToken(token)); // Calcula user inicial
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Efecto para verificar token inicial y configurar interceptor (si no lo hiciste globalmente)
  useEffect(() => {
    const initialToken = localStorage.getItem("accessToken");
    const validUser = getUserFromToken(initialToken);
    if (validUser) {
      setToken(initialToken);
      setUser(validUser);
      // El interceptor en apiClient se encargará de añadir el header
    } else {
      localStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Usa apiClient para la petición
      const response = await apiClient.post<{ accessToken: string }>(
        "/auth/login", // Ruta relativa gracias a baseURL en apiClient
        { email, password }
      );
      const new_token = response.data.accessToken;
      const newUser = getUserFromToken(new_token);

      if (newUser) {
        localStorage.setItem("accessToken", new_token);
        setToken(new_token);
        setUser(newUser);
        // El interceptor de apiClient ya está configurado para usar este token
      } else {
        throw new Error("Token recibido inválido.");
      }
    } catch (error) {
      console.error("Error en AuthProvider login:", error);
      localStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
      throw error; // Relanza para que LoginPage lo capture
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken"); // Limpia el token
    setToken(null); // Limpia el estado del token
    setUser(null); // Limpia el estado del usuario
    // El interceptor de Axios dejará de añadir el token
    navigate("/login"); // Redirige al login
  }, [navigate]);

  if (isLoading) {
    return <div>Cargando aplicación...</div>; // O Spinner
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!user, user, token, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
