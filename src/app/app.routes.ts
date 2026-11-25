import { Routes } from '@angular/router';
import { shopUnsavedChangesGuard } from './views/shop/shop-unsaved-changes.guard';
import { HomeView } from './views/home/home';

export const routes: Routes = [
  {
    path: '',
    component: HomeView,
    title: 'Friendly E-Shop | Panel',
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./views/catalog-list/catalog-list').then((module) => module.CatalogListView),
    title: 'Catálogo | Friendly E-Shop',
  },
  {
    path: 'catalog/new',
    loadComponent: () =>
      import('./views/catalog-form/catalog-form').then((module) => module.CatalogFormView),
    title: 'Nuevo producto | Friendly E-Shop',
  },
  {
    path: 'catalog/:id/edit',
    loadComponent: () =>
      import('./views/catalog-form/catalog-form').then((module) => module.CatalogFormView),
    title: 'Editar producto | Friendly E-Shop',
  },
  {
    path: 'shop',
    loadComponent: () => import('./views/shop/shop').then((module) => module.ShopView),
    title: 'Mi tienda | Friendly E-Shop',
    canDeactivate: [shopUnsavedChangesGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
