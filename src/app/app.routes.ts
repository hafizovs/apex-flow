import { Routes } from '@angular/router';
import { AppShellComponent } from './components/shell/app-shell.component';
import { authGuard, guestGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import type { Role } from './models/app.types';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'board' },
      {
        path: 'board',
        loadComponent: () =>
          import('./components/kanban/kanban.component').then(
            (m) => m.KanbanComponent,
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./components/analytics/analytics.component').then(
            (m) => m.AnalyticsComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager'] satisfies Role[] },
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./components/team/team.component').then((m) => m.TeamComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin'] satisfies Role[] },
      },
    ],
  },
  { path: '**', redirectTo: 'board' },
];
