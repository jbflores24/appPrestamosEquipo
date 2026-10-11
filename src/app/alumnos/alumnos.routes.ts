import { Routes } from '@angular/router';

export const ALUMNOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./alumno-list.page').then((m) => m.AlumnoListPage),
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./alumno-form.page').then((m) => m.AlumnoFormPage),
  },
  {
    path: ':id/editar',
    loadComponent: () => import('./alumno-form.page').then((m) => m.AlumnoFormPage),
  },
];
