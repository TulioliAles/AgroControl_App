import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
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
