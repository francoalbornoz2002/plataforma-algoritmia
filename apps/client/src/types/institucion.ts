export interface Provincia {
  id: number;
  provincia: string;
}

export interface Localidad {
  id: number;
  idProvincia: number;
  localidad: string;
}

export interface Institucion {
  id: string;
  idLocalidad: number;
  nombre: string;
  direccion: string;
  email: string;
  telefono: string;
  logoUrl?: string | null;
  localidad: {
    id: number;
    idProvincia: number;
    localidad: string;
    provincia: {
      id: number;
      provincia: string;
    };
  };
}
