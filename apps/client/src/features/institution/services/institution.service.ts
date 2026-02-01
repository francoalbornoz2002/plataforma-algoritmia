import apiClient from "../../../lib/axios";
import type { Institucion, Provincia, Localidad } from "../../../types";
import type { InstitutionFormValues } from "../validations/institution.schema";

/**
 * Obtiene los datos actuales de la institución (o null)
 */
export const getInstitucion = async (): Promise<Institucion | null> => {
  try {
    const response = await apiClient.get("/institucion");
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching institucion:",
      err.response?.data || err.message,
    );
    // ¡ASEGÚRATE DE QUE ESTE 'throw' EXISTA!
    throw err.response?.data || new Error("Error al obtener los datos.");
  }
};

/**
 * Actualiza O CREA los datos de la institución
 */
export const upsertInstitucion = async (
  data: InstitutionFormValues,
  logoFile?: File | null,
): Promise<Institucion> => {
  try {
    const { idProvincia, ...dataParaApi } = data;

    const formData = new FormData();

    // Agregamos los campos de texto
    Object.entries(dataParaApi).forEach(([key, value]) => {
      if (key === "logo") return;
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    const response = await apiClient.patch("/institucion", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "Error upserting institucion:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al guardar los datos.");
  }
};

/**
 * Obtiene la lista de todas las provincias
 */
export const getProvincias = async (): Promise<Provincia[]> => {
  try {
    const response = await apiClient.get("/institucion/provincias");
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching provincias:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener las provincias.");
  }
};

/**
 * Obtiene las localidades de una provincia específica
 */
export const getLocalidadesByProvincia = async (
  idProvincia: number, // O string si es UUID
): Promise<Localidad[]> => {
  try {
    const response = await apiClient.get(
      `/institucion/localidades/by-provincia/${idProvincia}`,
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching localidades:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener las localidades.");
  }
};
