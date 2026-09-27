import { Routes } from '@angular/router';
import { Shell } from './features/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    title: 'Friendly E-Shop | Panel',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
