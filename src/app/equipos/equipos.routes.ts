import { Routes } from '@angular/router';

export const EQUIPOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./equipo-list.page').then((m) => m.EquipoListPage),
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./equipo-form.page').then((m) => m.EquipoFormPage),
  },
  {
    path: ':id/editar',
    loadComponent: () => import('./equipo-form.page').then((m) => m.EquipoFormPage),
  },
];
