export interface OpcionMenu {
  titulo: string;
  descripcion: string;
  url: string;
  icono: string;
}

/** Secciones de la aplicación: las usan el menú lateral y la pantalla de inicio. */
export const OPCIONES_MENU: OpcionMenu[] = [
  { titulo: 'Inicio', descripcion: 'Resumen de la aplicación', url: '/home', icono: 'home-outline' },
  { titulo: 'Avisos', descripcion: 'Comunicados para los alumnos', url: '/avisos', icono: 'calendar-outline' },
  { titulo: 'Alumnos', descripcion: 'Alta y consulta de alumnos', url: '/alumnos', icono: 'people-outline' },
  { titulo: 'Equipos', descripcion: 'Inventario y disponibilidad', url: '/equipos', icono: 'laptop-outline' },
  { titulo: 'Préstamos', descripcion: 'Salidas y devoluciones', url: '/prestamos', icono: 'swap-horizontal-outline' },
];
