import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import type { Role } from './core/models/app.types';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/components/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/components/register/register.page').then((m) => m.RegisterPage),
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
          import('./features/board/components/kanban/kanban.component').then(
            (m) => m.KanbanComponent,
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/components/analytics/analytics.component').then(
            (m) => m.AnalyticsComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager'] satisfies Role[] },
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./features/team/components/team/team.component').then((m) => m.TeamComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin'] satisfies Role[] },
      },
    ],
  },
  { path: '**', redirectTo: 'board' },
];
