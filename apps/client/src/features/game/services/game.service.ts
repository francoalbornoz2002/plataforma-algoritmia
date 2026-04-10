import apiClient from "../../../lib/axios";

export const getGameDownloadUrl = (): string => {
  // Extraemos la URL base de axios y el token directamente del localStorage
  const baseURL = apiClient.defaults.baseURL || "";
  const token = localStorage.getItem("accessToken");

  return `${baseURL}/game/download?token=${token}`;
};
