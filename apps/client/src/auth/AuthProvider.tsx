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
import { roles } from "../types";

// Defino la interfaz UserToken
export interface UserToken {
  userId: string;
  rol: Rol;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserToken | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tipado del payload decodificado
interface JwtPayload {
  id: string;
  rol: Rol;
  exp: number;
}

const getUserFromToken = (token: string | null): UserToken | null => {
  // Si no hay token, devolvemos null
  if (!token) return null;

  try {
    // Decodificamos el token
    const decoded: JwtPayload = jwtDecode(token);

    // Verificamos que el token no esté expirado
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("accessToken");
      return null;
    }

    // Asegura que el rol decodificado sea uno de los válidos
    if (!["Administrador", "Docente", "Alumno"].includes(decoded.rol)) {
      console.error("Rol inválido en el token:", decoded.rol);
      localStorage.removeItem("accessToken");
      return null;
    }

    // Devolvemos el UserToken
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
  const [user, setUser] = useState<UserToken | null>(() =>
    getUserFromToken(token)
  ); // Calcula user inicial
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Efecto para verificar token inicial y configurar interceptor
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

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await apiClient.post<{ accessToken: string }>(
          "/auth/login",
          { email, password }
        );
        const new_token = response.data.accessToken;
        const newUser = getUserFromToken(new_token);

        if (newUser) {
          localStorage.setItem("accessToken", new_token);
          setToken(new_token);
          setUser(newUser);

          // 1. Determinar la ruta "home" basada en el rol
          let homeRoute = "/"; // Fallback

          if (newUser.rol === roles.Administrador) {
            homeRoute = "/dashboard";
          } else if (newUser.rol === roles.Docente) {
            homeRoute = "/course/dashboard"; // <-- Nueva ruta de Docente
          } else if (newUser.rol === roles.Alumno) {
            homeRoute = "/my/dashboard"; // <-- Nueva ruta de Alumno
          }

          // 2. Redirigir SIEMPRE a la ruta 'home' correcta
          navigate(homeRoute, { replace: true });
        } else {
          throw new Error("Token recibido inválido.");
        }
      } catch (error) {
        console.error("Error en AuthProvider login:", error);
        localStorage.removeItem("accessToken");
        setToken(null);
        setUser(null);
        throw error;
      }
    },
    [navigate] // <-- Añadir 'navigate' a las dependencias
  );

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken"); // Limpia el token
    setToken(null); // Limpia el estado del token
    setUser(null); // Limpia el estado del usuario
    localStorage.removeItem("selectedCourseId"); // Limpia el curso seleccionado
    // El interceptor de Axios dejará de añadir el token
    navigate("/login"); // Redirige al login
  }, [navigate]);

  if (isLoading) {
    return <div>Cargando aplicación...</div>;
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
