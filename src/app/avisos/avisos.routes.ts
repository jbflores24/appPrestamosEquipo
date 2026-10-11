import { Routes } from '@angular/router';

export const AVISOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./aviso-list.page').then((m) => m.AvisoListPage),
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./aviso-form.page').then((m) => m.AvisoFormPage),
  },
  {
    path: ':id/editar',
    loadComponent: () => import('./aviso-form.page').then((m) => m.AvisoFormPage),
  },
];
