// src/services/user.service.ts
import apiClient from "../../../lib/axios";
import type {
  BaseFilterParams,
  CreateUserData,
  estado_simple,
  PaginatedResponse,
  UpdateUserData,
  UserData,
} from "../../../types";

// Interfaz para los parámetros de búsqueda
export interface FindUsersParams extends BaseFilterParams {
  search?: string;
  roles?: string[] | ""; // Permitir string vacío para "Todos"
  estado?: estado_simple | ""; // Permitir string vacío para "Todos"
}

// Interfaz para la respuesta paginada completa de la API
export interface PaginatedUsersResponse extends PaginatedResponse<UserData> {}

export const findUsers = async (
  params: FindUsersParams,
): Promise<PaginatedUsersResponse> => {
  try {
    const response = await apiClient.get("/users/all", {
      // Axios convierte esto en query parameters:
      // /users/all?page=1&limit=6&search=juan&roles[]=Docente&roles[]=Administrador...
      params: params,
      // Importante para que axios maneje arrays correctamente
      paramsSerializer: {
        indexes: null, // Formato: roles[]=Docente&roles[]=Administrador
      },
    });
    return response.data;
  } catch (err: any) {
    // Re-lanza el error para que el 'useEffect' en la página lo atrape
    throw err.response || err;
  }
};

// --- Función para crear un nuevo usuario ---
export const createUser = async (
  userData: CreateUserData,
): Promise<UserData> => {
  try {
    // Llama al endpoint POST /users/create
    const response = await apiClient.post<UserData>("/users/create", userData);
    return response.data;
  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    throw error;
  }
};

// --- Función para actualizar un usuario existente ---
export const updateUser = async (
  userId: string,
  userData: UpdateUserData,
): Promise<UserData> => {
  try {
    // Llama al endpoint PATCH /users/edit:id
    const response = await apiClient.patch<UserData>(
      `/users/edit/${userId}`,
      userData,
    );
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar usuario ${userId}:`, error);
    throw error;
  }
};

// --- Función para actualizar el PERFIL (con foto) ---
export const updateUserProfile = async (
  userId: string,
  formData: FormData,
): Promise<UserData> => {
  try {
    // Llama al endpoint PATCH /users/profile/:id con multipart/form-data
    const response = await apiClient.patch<UserData>(
      `/users/profile/${userId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar perfil ${userId}:`, error);
    throw error;
  }
};

// --- Función para realizar el borrado lógico de un usuario ---
export const deleteUser = async (userId: string): Promise<void> => {
  // No suele devolver datos
  try {
    // Llama al endpoint DELETE /users/delete:id
    await apiClient.delete(`/users/delete/${userId}`);
    // No devuelve nada si tiene éxito
  } catch (error) {
    console.error(`Error al dar de baja usuario ${userId}:`, error);
    throw error;
  }
};

// --- Función para obtener un usuario por id ---
export const getUserById = async (userId: string): Promise<UserData> => {
  try {
    const response = await apiClient.get<UserData>(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener usuario ${userId}:`, error);
    throw error;
  }
};

// --- Función para obtener estadísticas del dashboard de ADMIN ---
export const getAdminDashboardStats = async () => {
  try {
    const response = await apiClient.get("/users/admin/dashboard");
    return response.data;
  } catch (error) {
    console.error("Error al obtener stats de admin:", error);
    throw error;
  }
};
