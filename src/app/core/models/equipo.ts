export type EstadoEquipo = 'disponible' | 'prestado' | 'mantenimiento';

export interface Equipo {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  estado: EstadoEquipo;
  created_at: string;
  updated_at: string;
}

export interface EquipoPayload {
  /** máximo 30 caracteres, único */
  codigo: string;
  /** 3-150 caracteres */
  nombre: string;
  /** 3-80 caracteres */
  tipo: string;
  /** 'prestado' lo asigna el servidor y no se puede enviar */
  estado?: Exclude<EstadoEquipo, 'prestado'>;
}
