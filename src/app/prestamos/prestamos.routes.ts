import { Routes } from '@angular/router';

export const PRESTAMOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./prestamo-list.page').then((m) => m.PrestamoListPage),
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./prestamo-form.page').then((m) => m.PrestamoFormPage),
  },
  {
    path: ':id/editar',
    loadComponent: () => import('./prestamo-form.page').then((m) => m.PrestamoFormPage),
  },
  {
    path: ':id/devolucion',
    loadComponent: () => import('./prestamo-devolucion.page').then((m) => m.PrestamoDevolucionPage),
  },
];
