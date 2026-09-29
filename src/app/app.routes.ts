import { Routes } from '@angular/router';
import { HomeView } from './views/home/home';

export const routes: Routes = [
  {
    path: '',
    component: HomeView,
    title: 'Friendly E-Shop | Panel',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
