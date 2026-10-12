import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'avisos',
    loadChildren: () => import('./avisos/avisos.routes').then((m) => m.AVISOS_ROUTES),
  },
  {
    path: 'alumnos',
    loadChildren: () => import('./alumnos/alumnos.routes').then((m) => m.ALUMNOS_ROUTES),
  },
  {
    path: 'equipos',
    loadChildren: () => import('./equipos/equipos.routes').then((m) => m.EQUIPOS_ROUTES),
  },
  {
    path: 'prestamos',
    loadChildren: () => import('./prestamos/prestamos.routes').then((m) => m.PRESTAMOS_ROUTES),
  },
  {
    path: 'no-encontrado',
    loadComponent: () => import('./shared/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
