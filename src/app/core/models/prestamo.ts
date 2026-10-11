import type { AlumnoResumen } from './alumno';
import type { DetallePrestamo } from './detalle-prestamo';

export interface Prestamo {
  id: number;
  alumno_id: number;
  alumno?: AlumnoResumen;
  /** YYYY-MM-DD */
  fecha_salida: string;
  /** YYYY-MM-DD */
  fecha_devolucion_esperada: string;
  detalles?: DetallePrestamo[];
  created_at: string;
  updated_at: string;
}

export interface PrestamoPayload {
  alumno_id: number;
  /** YYYY-MM-DD */
  fecha_salida: string;
  /** YYYY-MM-DD, igual o posterior a fecha_salida */
  fecha_devolucion_esperada: string;
  /** ids de equipos disponibles; al menos uno */
  equipos: number[];
}

export interface DevolucionPayload {
  /** ids de equipos pendientes del préstamo; al menos uno si se envía. Sin él se devuelven todos. */
  equipos?: number[];
  /** máximo 255 caracteres */
  observaciones?: string | null;
}
