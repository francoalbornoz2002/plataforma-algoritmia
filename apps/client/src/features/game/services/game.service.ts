import apiClient from "../../../lib/axios";

export const getGameDownload = async (): Promise<Blob> => {
  const response = await apiClient.get("/game/download", {
    responseType: "blob", // Crucial para manejar archivos binarios
  });
  return response.data;
};
