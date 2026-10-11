import type { Equipo } from './equipo';

export interface DetallePrestamo {
  id: number;
  prestamo_id: number;
  equipo_id: number;
  equipo?: Equipo;
  /** YYYY-MM-DD; null mientras el equipo no se devuelve */
  fecha_devolucion_real: string | null;
  observaciones: string | null;
  dias_retraso: number;
}
