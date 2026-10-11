import type { Prestamo } from './prestamo';

export interface Alumno {
  id: number;
  matricula: string;
  nombre: string;
  carrera: string;
  /** Solo viene en el detalle (GET /alumno/{id}) y al crear. */
  prestamos?: Prestamo[];
  created_at: string;
  updated_at: string;
}

/** Alumno tal como aparece anidado en un préstamo. */
export type AlumnoResumen = Omit<Alumno, 'prestamos'>;

export interface AlumnoPayload {
  /** máximo 20 caracteres, única */
  matricula: string;
  /** 3-150 caracteres */
  nombre: string;
  /** 3-150 caracteres */
  carrera: string;
}
