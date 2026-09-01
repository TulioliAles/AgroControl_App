import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'categorias',
        data: {
          kind: 'input-categories',
          title: 'Categorias',
          subtitle: 'Organize os insumos por finalidade e classificação.'
        },
        loadComponent: () =>
          import('./features/catalog/reference-data/reference-data-page.component').then(
            (m) => m.ReferenceDataPageComponent
          )
      },
      {
        path: 'fabricantes',
        data: {
          kind: 'manufacturers',
          title: 'Fabricantes',
          subtitle: 'Mantenha os fabricantes vinculados aos insumos.'
        },
        loadComponent: () =>
          import('./features/catalog/reference-data/reference-data-page.component').then(
            (m) => m.ReferenceDataPageComponent
          )
      },
      {
        path: 'unidades-medida',
        data: {
          kind: 'measurement-units',
          title: 'Unidades de medida',
          subtitle: 'Cadastre símbolos e fatores de conversão utilizados no estoque.'
        },
        loadComponent: () =>
          import('./features/catalog/reference-data/reference-data-page.component').then(
            (m) => m.ReferenceDataPageComponent
          )
      },
      {
        path: 'insumos',
        loadComponent: () =>
          import('./features/catalog/agricultural-inputs/agricultural-input-list.component').then(
            (m) => m.AgriculturalInputListComponent
          )
      },
      {
        path: 'estoque',
        loadComponent: () =>
          import('./features/inventory/stock-lots/stock-lot-list.component').then(
            (m) => m.StockLotListComponent
          )
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
