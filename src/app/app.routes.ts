import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { AuthGuard } from './core/guards/auth.guard';
import { BusRegistroComponent } from './features/buses/bus-registro.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  // VISTA DEL CIUDADANO (La que ya tenías del boleto)
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [AuthGuard],
  },
  // 🎫 NUEVA RUTA: Gestión de Boletos y Abordaje del Ciudadano
  {
    path: 'boletos',
    loadComponent: () => import('./features/boletos/boletos.component').then((m) => m.BoletosComponent),
    canActivate: [AuthGuard],
  },
  // VISTA DEL ADMINISTRADOR / GERENTE DE EMPRESA
  {
    path: 'registro-bus',
    loadComponent: () => import('./features/buses/bus-registro.component').then((m) => m.BusRegistroComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'programacion',
    loadComponent: () => import('./features/programacion/programacion.component').then((m) => m.ProgramacionComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'auditoria-incidentes', // 🚨 NUEVA RUTA: Consulta y seguimiento de incidentes por Bus
    loadComponent: () => 
      import('./features/incidente-admin/incidente-admin.component').then((m) => m.IncidenteAdminComponent),
    canActivate: [AuthGuard],
  },
  // VISTA DEL CONDUCTOR (Sincronizada con el Sidebar)
  {
    path: 'features/turno-conductor',
    loadComponent: () => import('./features/turnos/turno-conductor.component').then((m) => m.TurnoConductorComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'reportar-incidente', // VISTA DEL CONDUCTOR: Reporte rápido
    loadComponent: () => 
      import('./features/incidentes/incidente-bus.component').then((m) => m.IncidenteBusComponent),
    canActivate: [AuthGuard],
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
    path: 'consulta-rutas',
    loadComponent: () =>
      import('./features/rutas/consulta-rutas.component').then((m) => m.ConsultaRutasComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'rutas',
    loadComponent: () =>
      import('./features/rutas/consulta-rutas.component').then((m) => m.ConsultaRutasComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard-servicios',
    loadComponent: () =>
      import('./features/dashboard-servicios/dashboard-servicios.component').then((m) => m.DashboardServiciosComponent),
    canActivate: [AuthGuard],
  },
{
    path: 'tendencia-incidentes', // 📊 Gráfico de líneas para el Gerente
    loadComponent: () => 
      import('./features/incidente-admin/tendencia-incidentes/tendencia-incidentes').then((m) => m.TendenciaIncidentes),
    canActivate: [AuthGuard],
  },
  { path: 'buses/publico/:placa', component: BusRegistroComponent },//QR del bus
  {
    path: 'recarga',
    loadComponent: () =>
      import('./features/recarga/recarga.component').then((m) => m.RecargaComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'crear-ruta',
    loadComponent: () =>
      import('./features/rutas/crear-ruta/crear-ruta.component').then((m) => m.CrearRutaComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'crear-paradero',
    loadComponent: () =>
      import('./features/rutas/crear-paradero/crear-paradero.component').then((m) => m.CrearParaderoComponent),
    canActivate: [AuthGuard],
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