// src/services/user.service.ts
import apiClient from "../lib/axios";
import type { CreateUserData, UpdateUserData, User } from "../types";

//Interfaz para la respuesta paginada
export interface PaginatedUsersResponse {
  data: User[];
  total: number;
  page: number;
  totalPages: number;
}

//Interfaz para los parámetros de búsqueda
export interface FindUsersParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search?: string;
  roles?: string[];
  estado?: string;
}

// --- Función para obtener todos los usuarios ---
// TODO: Añadir parámetros de filtro
//export const getAllUsers = async (): Promise<User[]> => {
//  try {
//    // Llama al endpoint GET /usuarios (asumiendo prefijo /api en apiClient)
//    const response = await apiClient.get<User[]>("/users/all");
//    // Devuelve solo los datos de la respuesta
//    return response.data;
//  } catch (error) {
//    console.error("Error al obtener usuarios:", error);
//    // Relanza el error para que el componente que llama lo maneje
//    throw error;
//  }
//};

export const findUsers = async (
  params: FindUsersParams
): Promise<PaginatedUsersResponse> => {
  try {
    const response = await apiClient.get("/users/all", {
      // Axios convierte esto en query parameters:
      // /usuarios?page=1&limit=6&search=juan&roles[]=DOCENTE&roles[]=ADMIN...
      params: params,
      // Importante para que axios maneje arrays correctamente
      paramsSerializer: {
        indexes: null, // Formato: roles[]=DOCENTE&roles[]=ADMIN
      },
    });
    return response.data;
  } catch (err: any) {
    // Re-lanza el error para que el 'useEffect' en la página lo atrape
    throw err.response || err;
  }
};

// --- Función para crear un nuevo usuario ---
export const createUser = async (userData: CreateUserData): Promise<User> => {
  try {
    // Llama al endpoint POST /usuarios
    const response = await apiClient.post<User>("/users/create", userData);
    return response.data;
  } catch (error) {
    console.error("Error al crear usuario:", error);
    throw error;
  }
};

// --- Función para actualizar un usuario existente ---
export const updateUser = async (
  userId: string,
  userData: UpdateUserData
): Promise<User> => {
  try {
    // Llama al endpoint PATCH /usuarios/:id
    const response = await apiClient.patch<User>(
      `/users/edit/${userId}`,
      userData
    );
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar usuario ${userId}:`, error);
    throw error;
  }
};

// --- Función para realizar el borrado lógico de un usuario ---
export const deleteUser = async (userId: string): Promise<void> => {
  // No suele devolver datos
  try {
    // Llama al endpoint DELETE /usuarios/:id
    await apiClient.delete(`/users/delete/${userId}`);
    // No devuelve nada si tiene éxito
  } catch (error) {
    console.error(`Error al dar de baja usuario ${userId}:`, error);
    throw error;
  }
};

// Puedes añadir más funciones aquí si es necesario (ej. getUserById)
export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener usuario ${userId}:`, error);
    throw error;
  }
};
