export interface Aviso {
  id: number;
  titulo: string;
  texto: string;
  /** YYYY-MM-DD */
  fecha: string;
  created_at: string;
  updated_at: string;
}

export interface AvisoPayload {
  /** 3-150 caracteres */
  titulo: string;
  /** mínimo 3 caracteres */
  texto: string;
  /** YYYY-MM-DD */
  fecha: string;
}
