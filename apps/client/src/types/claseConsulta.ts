import { modalidad, estado_clase_consulta } from "./enums";
import type { ConsultaDocente } from "./consulta";

// 1. Para el objeto 'ClaseConsulta' (lo que devuelve el backend)
export interface ClaseConsulta {
  id: string;
  idDocente: string | undefined;
  idCurso: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string; // ISO
  fechaFin: string; // ISO
  modalidad: modalidad;
  estadoClase: estado_clase_consulta;
  estadoActual?: estado_clase_consulta;
  createdAt: string; // ISO
  deletedAt: string | null; // Llega como string ISO
  motivo?: string | null; // Motivo de cancelación o no realización

  // Relaciones (del 'include')
  docenteResponsable: {
    nombre: string;
    apellido: string;
  } | null;
  consultasEnClase: {
    consulta: ConsultaDocente;
    revisadaEnClase?: boolean;
  }[];
}

// 2. Payload para CREAR una clase (Lo que se envía al Backend)
export interface CreateClaseConsultaPayload {
  idCurso?: string; // Se inyecta en el servicio
  idDocente: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string; // ISO
  fechaFin: string; // ISO
  modalidad: modalidad;
  consultasIds: string[];
}

// 3. Payload para EDITAR una clase
export type UpdateClaseConsultaPayload = Partial<CreateClaseConsultaPayload>;
