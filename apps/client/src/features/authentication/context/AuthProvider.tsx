// src/providers/AuthProvider.tsx
import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router";
import { jwtDecode } from "jwt-decode";
import type { Rol } from "../../../types/roles";
import apiClient from "../../../lib/axios";
import { roles, type UserData } from "../../../types";

// Defino la interfaz UserToken
export interface UserToken {
  userId: string;
  rol: Rol;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserToken | null;
  profile: UserData | null; // <-- Nuevo estado con datos completos
  token: string | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>; // <-- Función para recargar datos
  mustChangePassword: boolean;
  setMustChangePassword: (value: boolean) => void; // <-- Exponemos el setter
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
    localStorage.getItem("accessToken"),
  ); // Lee token inicial
  const [user, setUser] = useState<UserToken | null>(() =>
    getUserFromToken(token),
  ); // Calcula user inicial
  const [profile, setProfile] = useState<UserData | null>(null); // <-- Estado del perfil
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Estado para controlar el modal de cambio de contraseña obligatorio
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Función para obtener/refrescar los datos completos del perfil
  const refreshProfile = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const { data } = await apiClient.get<UserData>(`/users/${user.userId}`);
      setProfile(data);

      // Verificamos si es el primer login (ultimoAcceso null) aquí mismo
      // para evitar una segunda llamada a la API.
      // Nota: TypeScript puede quejarse si UserData no tiene ultimoAcceso explícito,
      // pero viene del backend.
      if ((data as any).ultimoAcceso === null) {
        setMustChangePassword(true);
      }
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
    }
  }, [user?.userId]);

  // Efecto para verificar token inicial y configurar interceptor
  useEffect(() => {
    const initAuth = async () => {
      const initialToken = localStorage.getItem("accessToken");
      const validUser = getUserFromToken(initialToken);

      if (validUser) {
        setToken(initialToken);
        setUser(validUser);
        setIsLoading(false);
      } else {
        // Si no hay token o expiró, intentamos usar el Refresh Token (Cookie)
        try {
          const { data } = await apiClient.post("/auth/refresh");
          const newToken = data.accessToken;

          localStorage.setItem("accessToken", newToken);
          setToken(newToken);
          setUser(getUserFromToken(newToken));
        } catch (error) {
          // Si falla el refresh, limpiamos todo
          localStorage.removeItem("accessToken");
          setToken(null);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initAuth();
  }, []); // Ejecutar solo al montar

  // Efecto para cargar el perfil cuando cambia el usuario
  useEffect(() => {
    if (user) {
      refreshProfile();
    } else {
      setProfile(null);
    }
  }, [user, refreshProfile]);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      try {
        const response = await apiClient.post<{ accessToken: string }>(
          "/auth/login",
          { email, password, remember: rememberMe },
        );
        const new_token = response.data.accessToken;
        const newUser = getUserFromToken(new_token);

        if (newUser) {
          localStorage.setItem("accessToken", new_token);
          setToken(new_token);
          setUser(newUser);

          // No llamamos a checkFirstLogin ni refreshProfile aquí manualmente.
          // Al hacer setUser(newUser), el useEffect de arriba detectará el cambio
          // y llamará a refreshProfile automáticamente.

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
    [navigate],
  );

  const logout = useCallback(async () => {
    // 1. Llamada al backend para limpiar la cookie (mientras el token aún está en memoria/localStorage)
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      console.error("Error informando logout al servidor", err);
    }

    // 2. Limpiamos todo el estado local independientemente del resultado de la API
    localStorage.removeItem("accessToken"); // Limpia el token
    setToken(null); // Limpia el estado del token
    setUser(null); // Limpia el estado del usuario
    setProfile(null); // Limpia el perfil
    setMustChangePassword(false); // Resetea el modal
    localStorage.removeItem("selectedCourseId"); // Limpia el curso seleccionado

    navigate("/login"); // Redirige al login
  }, [navigate]);

  if (isLoading) {
    return <div>Cargando aplicación...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        profile,
        token,
        isLoading,
        login,
        logout,
        refreshProfile,
        mustChangePassword,
        setMustChangePassword,
      }}
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
