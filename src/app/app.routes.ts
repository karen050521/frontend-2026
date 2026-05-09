import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/security/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/security/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'listancia',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'roles',
    loadComponent: () => import('./features/roles/roles.component').then((m) => m.RolesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'user-role',
    loadComponent: () =>
      import('./features/user-role/user-role.component').then((m) => m.UserRoleComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'permissions',
    loadComponent: () =>
      import('./features/permissions/manage-permissions.component').then(
        (m) => m.ManagePermissionsComponent,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/security/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/security/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: '403',
    loadComponent: () =>
      import('./shared/components/access-denied/access-denied.component').then(
        (m) => m.AccessDeniedComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
