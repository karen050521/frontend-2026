# ðŸ—ï¸ ARQUITECTURA DEL PROYECTO - KALA BUSES

**GuÃ­a de Arquitectura y Estructura de CÃ³digo para Contexto de IA**

---

## ðŸ“Œ RESUMEN EJECUTIVO

**KALA Buses** es una aplicaciÃ³n Angular 20 con arquitectura **Feature-Based** que sigue principios SOLID y separaciÃ³n de responsabilidades. El proyecto estÃ¡ organizado en capas clara:

- **Core Layer**: Servicios, modelos, configuraciÃ³n, guards, interceptores
- **Features Layer**: Componentes standalone por funcionalidad
- **Shared Layer**: Componentes reutilizables
- **Environments**: ConfiguraciÃ³n por entorno (dev, prod)

**Stack TecnolÃ³gico:**
- Frontend: Angular 20 + TypeScript 5.9 + Tailwind CSS 4
- AutenticaciÃ³n: Firebase Authentication + JWT
- Backend: API REST (no implementada en este repo)
- Base de Datos: Firebase Firestore
- Mapas: Leaflet 1.9
- GrÃ¡ficos: Chart.js + ng2-charts
- Pagos: Epayco
- Notificaciones: ngx-toastr

---

## ðŸ“‚ ESTRUCTURA DE DIRECTORIOS

```
src/
â”‚
â”œâ”€â”€ app/                              # RaÃ­z de la aplicaciÃ³n
â”‚   â”‚
â”‚   â”œâ”€â”€ core/                         # CAPA DE LÃ“GICA DE NEGOCIO
â”‚   â”‚   â”œâ”€â”€ config/                   # Configuraciones globales
â”‚   â”‚   â”‚   â”œâ”€â”€ api.config.ts         # Rutas y URLs de API
â”‚   â”‚   â”‚   â”œâ”€â”€ firebase.config.ts    # InicializaciÃ³n de Firebase
â”‚   â”‚   â”‚   â””â”€â”€ firebase.provider.ts  # Provider de Firebase
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ guards/                   # ProtecciÃ³n de rutas
â”‚   â”‚   â”‚   â””â”€â”€ auth.guard.ts         # Guard de autenticaciÃ³n
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ interceptors/             # Interceptores HTTP
â”‚   â”‚   â”‚   â””â”€â”€ auth.interceptor.ts   # Agrega token JWT a peticiones
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ models/                   # Modelos de datos (Interfaces/DTOs)
â”‚   â”‚   â”‚   â”œâ”€â”€ boleto.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ ciudadano.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ detalle-viaje.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ permission.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ reporte.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ role.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ route.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ ruta.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ user.model.ts
â”‚   â”‚   â”‚   â””â”€â”€ index.ts              # Barrel exports
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ services/                 # SERVICIOS (LÃ³gica de negocio)
â”‚   â”‚   â”‚   â”œâ”€â”€ auth.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ boleto.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ bus.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ conductor.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ detalle-viaje.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ epayco.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ firebase-auth.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ forgot-password.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ incidente-admin.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ incidente-bus.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ metodo-pago-ciudadano.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ modal.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ paradero.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ permission.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ programacion.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ recaptcha.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ reporte-incidentes.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ reporte.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ role-permission.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ role.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ route.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ ruta.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ theme.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ toast.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ turno.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ user-role.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ user.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ incidente-bus.service.ts     # âœ¨ NUEVO: Reportes de incidentes (Conductores)
â”‚   â”‚   â”‚   â”œâ”€â”€ incidente-admin.service.ts   # âœ¨ NUEVO: AuditorÃ­a de incidentes (Gerentes)
â”‚   â”‚   â”‚   â”œâ”€â”€ monitoreos.service.ts        # âœ¨ NUEVO: Monitoreo de operaciones
â”‚   â”‚   â”‚   â””â”€â”€ index.ts              # Barrel exports
â”‚   â”‚   â”‚
â”‚   â”‚   â””â”€â”€ utils/                    # Utilidades
â”‚   â”‚       â””â”€â”€ leaflet-config.ts     # ConfiguraciÃ³n de Leaflet
â”‚   â”‚
â”‚   â”œâ”€â”€ features/                     # CAPA DE PRESENTACIÃ“N (Feature Modules)
â”‚   â”‚   â”œâ”€â”€ boletos/                  # Feature: GestiÃ³n de Boletos
â”‚   â”‚   â”‚   â”œâ”€â”€ boletos.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ boletos.component.html
â”‚   â”‚   â”‚   â””â”€â”€ boletos.component.css
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ buses/                    # Feature: GestiÃ³n de Buses
â”‚   â”‚   â”‚   â”œâ”€â”€ bus-registro.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ bus-registro.component.html
â”‚   â”‚   â”‚   â””â”€â”€ bus-registro.component.css
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ dashboard/                # Feature: Dashboards
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard.component.ts           # Router principal
â”‚   â”‚   â”‚   â”œâ”€â”€ citizen-dashboard/               # Sub-componente: Ciudadano
â”‚   â”‚   â”‚   â”œâ”€â”€ conductor-dashboard/             # Sub-componente: Conductor
â”‚   â”‚   â”‚   â”œâ”€â”€ company-dashboard/               # Sub-componente: Empresa
â”‚   â”‚   â”‚   â””â”€â”€ analytics-dashboard/             # Sub-componente: Analytics
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ dashboard-servicios/      # Feature: Panel de pruebas
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard-servicios.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard-servicios.component.html
â”‚   â”‚   â”‚   â””â”€â”€ dashboard-servicios.component.css
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ home/                     # Feature: PÃ¡gina de inicio
â”‚   â”‚   â”‚   â”œâ”€â”€ home.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ home.component.html
â”‚   â”‚   â”‚   â””â”€â”€ home.component.css
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ incidente-admin/          # Feature: AuditorÃ­a de incidentes
â”‚   â”‚   â”‚   â”œâ”€â”€ incidente-admin.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ incidente-admin.component.html
â”‚   â”‚   â”‚   â”œâ”€â”€ incidente-admin.component.css
â”‚   â”‚   â”‚   â””â”€â”€ tendencia-incidentes/ # Sub-feature de anÃ¡lisis
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ incidentes/               # Feature: Reporte de incidentes (Conductores)
â”‚   â”‚   â”‚   â”œâ”€â”€ incidente-bus.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ incidente-bus.component.html
â”‚   â”‚   â”‚   â”œâ”€â”€ incidente-bus.component.css
â”‚   â”‚   â”‚   â””â”€â”€ # IntegraciÃ³n: GPS, fotos base64, validaciÃ³n de turnos
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ permissions/              # Feature: GestiÃ³n de permisos
â”‚   â”‚   â”‚   â”œâ”€â”€ manage-permissions.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ manage-permissions.component.html
â”‚   â”‚   â”‚   â””â”€â”€ manage-permissions.component.css
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ programacion/             # Feature: ProgramaciÃ³n
â”‚   â”‚   â”‚   â”œâ”€â”€ programacion.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ programacion.component.html
â”‚   â”‚   â”‚   â””â”€â”€ programacion.component.css
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ recarga/                  # Feature: Recarga de saldo
â”‚   â”‚   â”‚   â”œâ”€â”€ recarga.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ recarga.component.html
â”‚   â”‚   â”‚   â””â”€â”€ recarga.component.css
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ reportes/                 # Feature: Reportes
â”‚   â”‚   â”‚   â”œâ”€â”€ ingresos/
â”‚   â”‚   â”‚   â”œâ”€â”€ demografico/
â”‚   â”‚   â”‚   â””â”€â”€ ...
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ roles/                    # Feature: GestiÃ³n de roles
â”‚   â”‚   â”‚   â”œâ”€â”€ roles.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ roles.component.html
â”‚   â”‚   â”‚   â””â”€â”€ roles.component.css
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ rutas/                    # Feature: GestiÃ³n de rutas
â”‚   â”‚   â”‚   â”œâ”€â”€ consulta-rutas.component.ts      # Componente principal
â”‚   â”‚   â”‚   â”œâ”€â”€ crear-ruta/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ crear-ruta.component.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ crear-ruta.component.html
â”‚   â”‚   â”‚   â”œâ”€â”€ crear-paradero/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ crear-paradero.component.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ crear-paradero.component.html
â”‚   â”‚   â”‚   â”œâ”€â”€ paraderos-cercanos/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ paraderos-cercanos.component.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ paraderos-cercanos.component.html
â”‚   â”‚   â”‚   â”œâ”€â”€ components/                      # Sub-componentes reutilizables
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ filtro-rutas.component.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ listado-rutas.component.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ detalle-ruta.component.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ mapa-rutas.component.ts
â”‚   â”‚   â”‚   â””â”€â”€ consulta-rutas.component.html
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ security/                 # Feature: AutenticaciÃ³n
â”‚   â”‚   â”‚   â”œâ”€â”€ login.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ register.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ forgot-password.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ reset-password.component.ts
â”‚   â”‚   â”‚   â””â”€â”€ *.html / *.css
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ turnos/                   # Feature: GestiÃ³n de turnos
â”‚   â”‚   â”‚   â”œâ”€â”€ turno-conductor.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ turno-conductor.component.html
â”‚   â”‚   â”‚   â””â”€â”€ turno-conductor.component.css
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ user-role/                # Feature: AsignaciÃ³n de roles
â”‚   â”‚   â”‚   â”œâ”€â”€ user-role.component.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ user-role.component.html
â”‚   â”‚   â”‚   â””â”€â”€ user-role.component.css
â”‚   â”‚   â”‚
â”‚   â”‚   â””â”€â”€ users/                    # Feature: GestiÃ³n de usuarios
â”‚   â”‚       â”œâ”€â”€ users.component.ts
â”‚   â”‚       â”œâ”€â”€ users.component.html
â”‚   â”‚       â””â”€â”€ users.component.css
â”‚   â”‚
â”‚   â”œâ”€â”€ shared/                       # CAPA COMPARTIDA
â”‚   â”‚   â””â”€â”€ components/               # Componentes reutilizables
â”‚   â”‚       â”œâ”€â”€ header/               # Encabezado
â”‚   â”‚       â”œâ”€â”€ sidebar/              # Barra lateral
â”‚   â”‚       â”œâ”€â”€ main-layout/          # Layout principal
â”‚   â”‚       â”œâ”€â”€ modal/                # Modal genÃ©rico
â”‚   â”‚       â”œâ”€â”€ permissions-modal/    # Modal de permisos
â”‚   â”‚       â”œâ”€â”€ toast-container/      # Contenedor de toasts
â”‚   â”‚       â”œâ”€â”€ global-modal/         # Modal global
â”‚   â”‚       â””â”€â”€ access-denied/        # PÃ¡gina 403
â”‚   â”‚
â”‚   â”œâ”€â”€ environments/                 # ConfiguraciÃ³n por entorno
â”‚   â”‚   â”œâ”€â”€ environment.ts            # Desarrollo
â”‚   â”‚   â”œâ”€â”€ environment.prod.ts       # ProducciÃ³n
â”‚   â”‚   â””â”€â”€ environment.example.ts    # Plantilla de ejemplo
â”‚   â”‚
â”‚   â”œâ”€â”€ app.ts                        # Componente raÃ­z
â”‚   â”œâ”€â”€ app.html                      # Template del componente raÃ­z
â”‚   â”œâ”€â”€ app.css                       # Estilos del componente raÃ­z
â”‚   â”œâ”€â”€ app.config.ts                 # ConfiguraciÃ³n global de Angular
â”‚   â”œâ”€â”€ app.routes.ts                 # DefiniciÃ³n de rutas
â”‚   â””â”€â”€ app.spec.ts                   # Tests (no implementado)
â”‚
â”œâ”€â”€ index.html                        # HTML de entrada
â”œâ”€â”€ main.ts                           # Entry point
â”œâ”€â”€ styles.css                        # Estilos globales
â””â”€â”€ favicon.ico                       # Favicon
```

---

## ðŸŽ¯ PATRONES DE ARQUITECTURA

### **1. Feature-Based Architecture**
La aplicaciÃ³n estÃ¡ organizada por **features/mÃ³dulos de funcionalidad**, no por tipos de archivo. Cada feature es independiente y contiene:
- Componentes especÃ­ficos
- LÃ³gica de presentaciÃ³n
- Modelos locales (si aplica)

```
features/
â”œâ”€â”€ boletos/           # Feature independiente
â”œâ”€â”€ buses/             # Feature independiente
â”œâ”€â”€ dashboard/         # Feature independiente
```

**Ventajas:**
- Escalabilidad
- ReutilizaciÃ³n de cÃ³digo
- Facilidad para mantener
- Modularidad

### **2. Lazy Loading**
Las rutas utilizan lazy loading para cargar componentes bajo demanda:

```typescript
// app.routes.ts
{
  path: 'boletos',
  loadComponent: () => 
    import('./features/boletos/boletos.component')
      .then(m => m.BoletosComponent),
  canActivate: [AuthGuard]
}
```

**Beneficios:**
- Bundle mÃ¡s pequeÃ±o
- Carga mÃ¡s rÃ¡pida
- Mejor rendimiento

### **3. Standalone Components**
Todos los componentes utilizan Angular Standalone Components (Angular 14+):

```typescript
@Component({
  selector: 'app-boletos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './boletos.component.html',
  styleUrl: './boletos.component.css'
})
export class BoletosComponent { }
```

**Ventajas:**
- No necesitan NgModule
- MÃ¡s declarativo
- Menor boilerplate

### **4. SeparaciÃ³n de Responsabilidades (SOLID)**

#### **Single Responsibility Principle (SRP)**
Cada servicio tiene una Ãºnica responsabilidad:

```typescript
// Cada servicio maneja un dominio especÃ­fico
RutaService      â†’ GestiÃ³n de rutas
BusService       â†’ GestiÃ³n de buses
BoletoService    â†’ GestiÃ³n de boletos
AuthService      â†’ AutenticaciÃ³n
```

#### **Dependency Injection (DI)**
Los servicios se inyectan en componentes:

```typescript
constructor(
  private rutaService: RutaService,
  private toastService: ToastService,
  private router: Router
) { }
```

#### **Open/Closed Principle (OCP)**
Los componentes son extensibles mediante propiedades de entrada:

```typescript
@Component({
  selector: 'app-modal',
  inputs: ['isOpen', 'title', 'type']
})
export class ModalComponent { }
```

---

## ðŸ”„ FLUJO DE DATOS

### **Ciclo de Vida de Datos**

```
User Interaction
    â†“
Component Event Handler
    â†“
Service Method Call
    â†“
HTTP Request (via Interceptor)
    â†“
Backend API / Firebase
    â†“
Response Processing
    â†“
Signal/State Update
    â†“
Template Re-render
    â†“
UI Update
```

### **Ejemplo Completo: Cargar Rutas**

```typescript
// 1. Usuario hace clic en componente
citizen-dashboard.component.html:
  (click)="loadRoutes()"

// 2. Componente llama al servicio
citizen-dashboard.component.ts:
protected loadRoutes(): void {
  this.isLoadingRoutes.set(true);
  this.rutaService.obtenerRutas().subscribe({
    next: (rutas) => {
      this.routes.set(rutas);
      this.isLoadingRoutes.set(false);
    },
    error: (err) => {
      this.toastService.error('Error al cargar rutas');
      this.isLoadingRoutes.set(false);
    }
  });
}

// 3. Servicio hace HTTP request
ruta.service.ts:
obtenerRutas(): Observable<Ruta[]> {
  return this.http.get<Ruta[]>(
    `${this.apiUrl}/rutas`
  );
}

// 4. Interceptor agrega token
auth.interceptor.ts:
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = this.authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next.handle(req);
}

// 5. Backend procesa y responde
// 6. Signal se actualiza (reactivity)
// 7. Template se re-renderiza
```

---

## ðŸ“‹ CAPA DE SERVICIOS (Core Services)

### **Servicio TÃ­pico: RutaService**

```typescript
@Injectable({ providedIn: 'root' })
export class RutaService {
  private apiUrl = `${environment.apiUrl}/rutas`;
  
  constructor(private http: HttpClient) { }
  
  // OperaciÃ³n READ
  obtenerRutas(): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(this.apiUrl);
  }
  
  // OperaciÃ³n READ (por ID)
  obtenerRuta(id: string): Observable<Ruta> {
    return this.http.get<Ruta>(`${this.apiUrl}/${id}`);
  }
  
  // OperaciÃ³n CREATE
  crearRuta(ruta: CreateRutaDto): Observable<Ruta> {
    return this.http.post<Ruta>(this.apiUrl, ruta);
  }
  
  // OperaciÃ³n UPDATE
  actualizarRuta(id: string, ruta: UpdateRutaDto): Observable<Ruta> {
    return this.http.put<Ruta>(`${this.apiUrl}/${id}`, ruta);
  }
  
  // OperaciÃ³n DELETE
  eliminarRuta(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### **PatrÃ³n TÃ­pico de Componente + Servicio**

```typescript
// Componente
@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RutasComponent implements OnInit {
  // State Management con Signals
  protected rutas = signal<Ruta[]>([]);
  protected loading = signal<boolean>(false);
  protected error = signal<string | null>(null);
  
  constructor(
    private rutaService: RutaService,
    private toastService: ToastService
  ) { }
  
  ngOnInit(): void {
    this.cargarRutas();
  }
  
  private cargarRutas(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.rutaService.obtenerRutas().subscribe({
      next: (data) => {
        this.rutas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar rutas');
        this.toastService.error(this.error());
        this.loading.set(false);
      }
    });
  }
}
```

---

## ðŸ”’ AUTENTICACIÃ“N Y SEGURIDAD

### **Flujo de AutenticaciÃ³n**

```
Login Form
    â†“
AuthService.login(email, password)
    â†“
Firebase Authentication
    â†“
JWT Token Generado
    â†“
Token Almacenado en LocalStorage
    â†“
AuthGuard Valida Token
    â†“
Acceso Permitido/Denegado
```

### **Auth Guard**

```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivateFn {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }
  
  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
```

### **Auth Interceptor**

```typescript
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
```

---

## ðŸŽ¨ ESTADO Y SIGNALS

### **Angular Signals (Nueva forma de reactividad)**

La aplicaciÃ³n utiliza **Signals** para state management:

```typescript
// Declarar signal
protected routes = signal<Ruta[]>([]);
protected isLoading = signal<boolean>(false);

// Leer valor
const routeList = this.routes();

// Actualizar valor
this.routes.set(newRoutes);

// Actualizar valor con funciÃ³n
this.routes.update(prev => [...prev, newRoute]);

// Computed signal (derivado)
protected routeCount = computed(() => this.routes().length);

// Effect (reacciÃ³n a cambios)
effect(() => {
  console.log('Routes changed:', this.routes());
});
```

**Ventajas:**
- Reactividad mÃ¡s explÃ­cita
- Mejor rendimiento
- Compatible con RxJS

### **Mejores PrÃ¡cticas con Signals**

```typescript
// âŒ INCORRECTO: Acceso redundante
protected data = signal<Data[]>([]);

ngOnInit() {
  const items = this.data();    // Lectura innecesaria
  this.data.set(items);         // Sin cambios reales
}

// âœ… CORRECTO: Uso eficiente
protected data = signal<Data[]>([]);

ngOnInit() {
  this.loadData();
}

private loadData() {
  this.service.getData().subscribe(data => {
    this.data.set(data);  // ActualizaciÃ³n directa
  });
}

// âœ… CORRECTO: Computed signals para derivados
protected filteredData = computed(() => 
  this.data().filter(item => item.status === 'active')
);

// âœ… CORRECTO: Effects para reacciones complejas
constructor() {
  effect(() => {
    const count = this.data().length;
    console.log(`Data count changed to: ${count}`);
  });
}
```

**Reglas de Oro:**
1. Usa `signal()` para estado que cambia
2. Usa `computed()` para valores derivados
3. Usa `effect()` para side effects (console.log, llamadas HTTP, etc)
4. Evita `setTimeout` en effects, usa `afterRender` en su lugar
5. Accede a signals con `()` solo cuando sea necesario en template o computed

---

## 🚌 SERVICIO DE MONITOREO (Nuevo)

### **MonitoreoService - Rastreo en Tiempo Real de Buses**

Este servicio proporciona funcionalidad de rastreo y monitoreo de buses en operación con geolocalización y cálculo de tiempos estimados de llegada (ETA).

\\	ypescript
export interface BusEnRuta {
  busId: number;
  placa: string;
  latitude: number;               // Latitud actual del bus
  longitude: number;              // Longitud actual del bus
  velocidad: number;              // Velocidad en km/h
  ultimaActualizacion: string;    // ISO timestamp
  paraderoMasCercano: {
    id: number;
    nombre: string;
    distanciaMetros: number;      // Distancia al paradero más cercano
  };
  tiempoEstimadoLlegada: number;  // Minutos estimados
  estaRetrasado: boolean;         // Indicador de retraso
  minutosRetraso: number;         // Cantidad de minutos de retraso
}

@Injectable({ providedIn: 'root' })
export class MonitoreoService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene lista de buses activos en una ruta específica (una sola vez)
   */
  getBusesActivosPorRuta(rutaId: number): Observable<{ data: BusEnRuta[] }> {
    return this.http.get<{ data: BusEnRuta[] }>(
      \/monitoreo/ruta/\/buses-activos    );
  }

  /**
   * Obtiene buses activos con polling automático cada 10 segundos
   */
  getBusesActivosPolling(rutaId: number): Observable<{ data: BusEnRuta[] }> {
    return interval(10000).pipe(
      switchMap(() => this.getBusesActivosPorRuta(rutaId)),
      shareReplay(1)
    );
  }

  /**
   * Calcula ETA (Tiempo Estimado de Llegada) para un bus a un paradero específico
   */
  getEtaParaParadero(
    busId: number, 
    paraderoId: number
  ): Observable<{ eta: number; distanciaKm: number }> {
    return this.http.get<{ eta: number; distanciaKm: number }>(
      \/monitoreo/bus/\/eta/\
    );
  }
}
\
**Características:**
- ✅ Rastreo GPS en tiempo real (latitud, longitud, velocidad)
- ✅ Polling cada 10 segundos con \switchMap\ y \shareReplay- ✅ Cálculo de ETA (Tiempo Estimado de Llegada)
- ✅ Detección de retrasos con cantidad de minutos
- ✅ Identificación de paradero más cercano

---

## ï¿½ SERVICIOS DE INCIDENTES (Nuevos)

### **IncidenteBusService - Reporte de Incidentes (Conductor)**

Este servicio permite que los conductores reporten incidentes en tiempo real con geolocalizaciÃ³n y evidencia fotogrÃ¡fica.

```typescript
@Injectable({ providedIn: 'root' })
export class IncidenteBusService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiNestUrl}/incidentes-buses`;

  // Reportar incidente con GPS y fotos
  public reportarIncidente(dto: CreateIncidenteBusDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reportar`, dto);
  }

  // Obtener alertas crÃ­ticas (Gerentes)
  public obtenerAlertasGerente(empresaId: number): Observable<any[]> {
    return this.http
      .get<any>(`${this.apiUrl}/alertas/${empresaId}`)
      .pipe(map((res) => res?.data || []));
  }
}

// DTO para crear reporte
export interface CreateIncidenteBusDto {
  tipo: 'mecanico' | 'accidente' | 'retraso' | 'otro';
  gravedad: 'bajo' | 'medio' | 'alto' | 'critico';
  descripcion: string;
  latitud: number;        // GPS obtenido en tiempo real
  longitud: number;       // GPS obtenido en tiempo real
  base64Fotos?: string[]; // Fotos capturadas y convertidas a base64
}
```

**CaracterÃ­sticas:**
- âœ… Captura de coordenadas GPS con precisiÃ³n
- âœ… AdjunciÃ³n de mÃºltiples fotos en base64
- âœ… ClasificaciÃ³n de incidentes por tipo y gravedad
- âœ… GeneraciÃ³n de alertas crÃ­ticas para gerentes
- âœ… ValidaciÃ³n de turno activo antes de reportar

---

### **IncidenteAdminService - AuditorÃ­a de Incidentes (Gerente)**

Este servicio permite auditar, dar seguimiento y analizar incidentes reportados.

```typescript
@Injectable({ providedIn: 'root' })
export class IncidenteAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiNestUrl}/admin/incidentes`;

  // Historial de incidentes por bus
  obtenerHistorialPorBus(
    busId: number,
    filtros?: { tipo?: string; estado?: string }
  ): Observable<IncidenteHistorialDto[]> {
    return this.http.get<IncidenteHistorialDto[]>(
      `${this.apiUrl}/bus/${busId}`,
      { params: filtros as any }
    );
  }

  // EstadÃ­sticas de incidentes
  obtenerEstadisticasPorBus(busId: number): Observable<EstadisticasBusDto> {
    return this.http.get<EstadisticasBusDto>(
      `${this.apiUrl}/bus/${busId}/estadisticas`
    );
  }

  // Actualizar estado o agregar comentarios
  actualizarSeguimiento(
    incidenteId: number,
    payload: { estado?: string; comentario?: string }
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/${incidenteId}/seguimiento`,
      payload
    );
  }
}

// Interfaces de datos
export interface IncidenteHistorialDto {
  id: number;
  fecha: Date;
  tipo: 'mecanico' | 'accidente' | 'retraso' | 'otro';
  estado: 'pendiente' | 'en_revision' | 'resuelto';
  descripcion: string;
  gravedad: 'bajo' | 'medio' | 'alto' | 'critico';
  conductor: string;
  comentarios: Array<{ autor: string; texto: string; fecha: Date }>;
  fotos: string[];
}

export interface EstadisticasBusDto {
  totalIncidentes: number;
  porTipo: Record<string, number>;
  tasaResolucion: string;
}
```

**CaracterÃ­sticas:**
- âœ… Consulta de historial de incidentes por bus
- âœ… AnÃ¡lisis estadÃ­stico (totales, tipos, tasa de resoluciÃ³n)
- âœ… Sistema de seguimiento con bitÃ¡cora de comentarios
- âœ… Estados: pendiente â†’ en_revisiÃ³n â†’ resuelto
- âœ… VisualizaciÃ³n de evidencias (fotos)

---

## ðŸŽ¯ FLUJOS COMPLEJOS IMPLEMENTADOS

### **Flujo 1: Reporte de Incidente por Conductor**

```
1. Conductor accede a "Reportar Incidente"
    â†“
2. Sistema valida que tiene turno activo (en_curso)
    â†“
3. Conductor completa formulario:
   - Tipo (mecÃ¡nico, accidente, retraso)
   - Gravedad (bajo, medio, alto, crÃ­tico)
   - DescripciÃ³n detallada
   - (Opcional) Fotos
    â†“
4. Sistema obtiene ubicaciÃ³n GPS del dispositivo
    â†“
5. Conductor envÃ­a reporte
    â†“
6. Fotos se convierten a base64
    â†“
7. Sistema envÃ­a payload con GPS + fotos al backend
    â†“
8. Backend registra incidente y genera alertas
    â†“
9. Gerentes reciben notificaciÃ³n en "AuditorÃ­a de Incidentes"
    â†“
10. Conductor recibe confirmaciÃ³n vÃ­a toast
```

**CÃ³digo del Componente:**

```typescript
@Component({
  selector: 'app-incidente-bus',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class IncidenteBusComponent implements OnInit {
  private readonly incidenteService = inject(IncidenteBusService);
  private readonly toastService = inject(ToastService);
  private readonly http = inject(HttpClient);

  // State Management
  protected tipo = signal<'mecanico' | 'accidente' | 'retraso' | 'otro'>('mecanico');
  protected gravedad = signal<'bajo' | 'medio' | 'alto' | 'critico'>('bajo');
  protected descripcion = signal<string>('');
  protected fotosBase64 = signal<string[]>([]);
  protected procesando = signal<boolean>(false);
  protected tieneTurnoActivo = signal<boolean>(false);
  protected validandoTurno = signal<boolean>(true);

  ngOnInit(): void {
    this.verificarTurnoDelConductor();
  }

  private verificarTurnoDelConductor(): void {
    this.validandoTurno.set(true);

    this.http.get<any>(`${environment.apiNestUrl}/turnos/mi-turno-activo`).subscribe({
      next: (turno) => {
        // Solo puede reportar si tiene turno en estado 'en_curso'
        if (turno && turno.estado === 'en_curso') {
          this.tieneTurnoActivo.set(true);
        } else {
          this.tieneTurnoActivo.set(false);
          this.toastService.warning(
            'ðŸ‘‹ Debes iniciar tu jornada antes de reportar un incidente.'
          );
        }
        this.validandoTurno.set(false);
      },
      error: (err) => {
        this.tieneTurnoActivo.set(false);
        this.validandoTurno.set(false);
      }
    });
  }

  protected procesarReporte(): void {
    // 1. Validaciones
    if (!this.tieneTurnoActivo()) {
      this.toastService.error('âŒ No posees un turno activo en el sistema.');
      return;
    }

    if (!this.descripcion().trim()) {
      this.toastService.error('Por favor, ingresa una descripciÃ³n detallada.');
      return;
    }

    this.procesando.set(true);

    // 2. Obtener GPS
    if (!navigator.geolocation) {
      this.toastService.error('GeolocalizaciÃ³n no disponible.');
      this.procesando.set(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const payload: CreateIncidenteBusDto = {
          tipo: this.tipo(),
          gravedad: this.gravedad(),
          descripcion: this.descripcion().trim(),
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          base64Fotos: this.fotosBase64(),
        };

        // 3. Enviar al servicio
        this.incidenteService.reportarIncidente(payload).subscribe({
          next: (res) => {
            this.toastService.success('âœ… Incidente reportado correctamente');
            this.limpiarFormulario();
            this.procesando.set(false);
          },
          error: (err) => {
            this.toastService.error('âŒ Error al enviar reporte');
            this.procesando.set(false);
          }
        });
      },
      (error) => {
        this.toastService.error('Error al obtener ubicaciÃ³n GPS');
        this.procesando.set(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  protected onFotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        this.fotosBase64.update(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  }

  private limpiarFormulario(): void {
    this.tipo.set('mecanico');
    this.gravedad.set('bajo');
    this.descripcion.set('');
    this.fotosBase64.set([]);
  }
}
```

---

### **Flujo 2: AuditorÃ­a de Incidentes por Gerente**

```
1. Gerente accede a "AuditorÃ­a de Incidentes"
    â†“
2. Sistema muestra alertas crÃ­ticas (gravedad alto/crÃ­tico)
    â†“
3. Gerente busca incidente por placa de bus o ID
    â†“
4. Sistema carga:
   - Historial del bus
   - EstadÃ­sticas (total, por tipo, tasa resoluciÃ³n)
   - Incidentes con evidencias (fotos)
    â†“
5. Gerente selecciona un incidente
    â†“
6. Se abre panel de auditorÃ­a con:
   - Datos del incidente
   - Fotos adjuntas
   - Historial de comentarios
   - Botones para cambiar estado
    â†“
7. Gerente:
   - Cambia estado (pendiente â†’ en_revisiÃ³n â†’ resuelto)
   - Agrega comentarios y observaciones
    â†“
8. Sistema registra cambios en bitÃ¡cora
    â†“
9. Conductor puede ver estado actualizado
```

---

## âœ¨ CAMBIOS RECIENTES (Mayo 2026)

### **1. Sistema de Incidentes Completo**
- âœ… Reporte de incidentes desde conductores con GPS
- âœ… Captura de evidencia fotogrÃ¡fica (base64)
- âœ… AuditorÃ­a y seguimiento por gerentes
- âœ… GeneraciÃ³n de alertas crÃ­ticas

### **2. ValidaciÃ³n de Turnos**
- âœ… Bloqueo de operaciones sin turno activo
- âœ… VerificaciÃ³n de estado 'en_curso'
- âœ… IntegraciÃ³n con sistema de turnos

### **3. Mejoras en Dashboard del Conductor**
- âœ… VisualizaciÃ³n de incidentes recientes
- âœ… Indicador de turno activo
- âœ… Acceso directo a reportar incidente

### **4. Panel de AuditorÃ­a Avanzado**
- âœ… BÃºsqueda por placa de bus
- âœ… Filtrado por tipo y estado
- âœ… BitÃ¡cora de comentarios
- âœ… VisualizaciÃ³n de estadÃ­sticas

---

## ï¿½ðŸ›£ï¸ ENRUTAMIENTO

### **Estructura de Rutas (app.routes.ts)**

```typescript
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  
  // Rutas pÃºblicas
  {
    path: 'login',
    loadComponent: () => 
      import('./features/security/login.component')
        .then(m => m.LoginComponent)
  },
  
  // Rutas protegidas
  {
    path: 'dashboard',
    loadComponent: () => 
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  
  // âœ¨ NUEVAS RUTAS DE INCIDENTES
  {
    path: 'auditoria-incidentes',
    loadComponent: () =>
      import('./features/incidente-admin/incidente-admin.component')
        .then(m => m.IncidenteAdminComponent),
    canActivate: [AuthGuard]
  },
  
  {
    path: 'reportar-incidente',
    loadComponent: () =>
      import('./features/incidentes/incidente-bus.component')
        .then(m => m.IncidenteBusComponent),
    canActivate: [AuthGuard]
  },
  
  // Rutas mejoradas
  {
    path: 'mi-jornada',
    loadComponent: () =>
      import('./features/turnos/turno-conductor.component')
        .then(m => m.TurnoConductorComponent),
    canActivate: [AuthGuard]
  },
  
  // Wildcard
  {
    path: '**',
    redirectTo: 'home'
  }
];
```

### **ConfiguraciÃ³n en app.config.ts**

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true })
  ]
};
```

---

## ðŸŽ­ COMPONENTES COMPARTIDOS

### **Componente Modal Reutilizable**

```typescript
@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="onClose()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2>{{ title() }}</h2>
          <ng-content></ng-content>
          <button (click)="onConfirm()">Confirmar</button>
          <button (click)="onClose()">Cancelar</button>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');
  onConfirm = output<void>();
  onClose = output<void>();
}
```

### **Uso en Componente**

```typescript
// En el componente
protected showModal = signal(false);

// En el template
<app-modal 
  [isOpen]="showModal()"
  title="Confirmar acciÃ³n"
  (onConfirm)="handleConfirm()"
  (onClose)="showModal.set(false)">
  Â¿EstÃ¡ seguro?
</app-modal>

<button (click)="showModal.set(true)">Abrir Modal</button>
```

---

## ðŸ“¦ MODELOS DE DATOS

### **PatrÃ³n TÃ­pico de Modelo**

```typescript
// Model Interface
export interface Ruta {
  id: string;
  nombre: string;
  codigoRuta: string;
  origen: string;
  destino: string;
  distancia: number;
  duracion: number;
  paraderos: Paradero[];
  estado: 'activa' | 'inactiva';
  createdAt: Date;
  updatedAt: Date;
}

// DTO para Crear (sin id, timestamps)
export interface CreateRutaDto {
  nombre: string;
  codigoRuta: string;
  origen: string;
  destino: string;
  distancia: number;
  duracion: number;
  paraderos: Paradero[];
}

// DTO para Actualizar (todos opcionales)
export interface UpdateRutaDto {
  nombre?: string;
  origen?: string;
  destino?: string;
  estado?: 'activa' | 'inactiva';
}

// Barrel export en index.ts
export * from './ruta.model';
export * from './paradero.model';
export * from './bus.model';
```

---

## ðŸŽ¯ CONVENCIONES DE CÃ“DIGO

### **Naming Conventions**

```typescript
// Archivos
feature.component.ts          // Componentes
feature.service.ts            // Servicios
feature.model.ts              // Modelos
feature.guard.ts              // Guards
feature.interceptor.ts        // Interceptores

// Selectores de componentes
<app-feature>                 // Componentes principales
<app-modal>                   // Componentes reutilizables

// MÃ©todos privados/protegidos
private hideModal(): void
protected loadData(): void

// Propiedades con Signal
protected datos = signal<Data[]>([]);
protected isLoading = signal<boolean>(false);

// MÃ©todos pÃºblicos
public getData(): Observable<Data[]>
public createData(data: CreateDataDto): Observable<Data>

// Observables terminan en $
protected data$: Observable<Data[]>;
```

### **Estructura TÃ­pica de Componente**

```typescript
@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './feature.component.html',
  styleUrl: './feature.component.css'
})
export class FeatureComponent implements OnInit {
  // 1. Signals para estado
  protected items = signal<Item[]>([]);
  protected loading = signal<boolean>(false);
  protected form: FormGroup;
  
  // 2. Constructor con inyecciÃ³n de dependencias
  constructor(
    private itemService: ItemService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required]
    });
  }
  
  // 3. Lifecycle hooks
  ngOnInit(): void {
    this.loadItems();
  }
  
  // 4. MÃ©todos privados
  private loadItems(): void {
    this.loading.set(true);
    this.itemService.getItems().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      }
    });
  }
  
  // 5. MÃ©todos protegidos (para template)
  protected submitForm(): void {
    if (this.form.valid) {
      this.itemService.createItem(this.form.value).subscribe({
        next: () => this.toastService.success('Creado'),
        error: () => this.toastService.error('Error')
      });
    }
  }
}
```

---

## ðŸ“‹ TIPOS Y DTOs PRINCIPALES

### **DTOs de Incidentes**

```typescript
// DTO para crear reporte (Conductor)
export interface CreateIncidenteBusDto {
  tipo: 'mecanico' | 'accidente' | 'retraso' | 'otro';
  gravedad: 'bajo' | 'medio' | 'alto' | 'critico';
  descripcion: string;
  latitud: number;        // Coordenada GPS
  longitud: number;       # Coordenada GPS
  base64Fotos?: string[]; // Fotos en base64
}

// Modelo de Incidente en Historial
export interface IncidenteHistorialDto {
  id: number;
  fecha: Date;
  tipo: 'mecanico' | 'accidente' | 'retraso' | 'otro';
  estado: 'pendiente' | 'en_revision' | 'resuelto';
  descripcion: string;
  gravedad: 'bajo' | 'medio' | 'alto' | 'critico';
  conductor: string;
  placaBus: string;
  latitud?: number;
  longitud?: number;
  comentarios: Array<{
    autor: string;
    texto: string;
    fecha: Date;
  }>;
  fotos: string[];
}

// EstadÃ­sticas de Incidentes por Bus
export interface EstadisticasBusDto {
  totalIncidentes: number;
  porTipo: Record<'mecanico' | 'accidente' | 'retraso' | 'otro', number>;
  porGravedad: Record<'bajo' | 'medio' | 'alto' | 'critico', number>;
  tasaResolucion: string;  // Porcentaje resueltos
  ultimoIncidente?: Date;
}
```

### **DTOs de Turnos**

```typescript
export interface CreateTurnoDto {
  fecha: string;           // YYYY-MM-DD
  horaInicio: string;      // HH:mm
  horaFin: string;         // HH:mm
  conductorId: number;
  busId: number;
}

export interface TurnoDto {
  id: number;
  fecha: Date;
  horaInicio: Date;
  horaFin: Date;
  estado: 'pendiente' | 'en_curso' | 'completado' | 'cancelado';
  conductorId: number;
  busId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### **DTOs de AutenticaciÃ³n**

```typescript
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;           // JWT Token
  user: UserDto;
}

export interface UserDto {
  id: number;
  email: string;
  nombre: string;
  roles: string[];
  empresa?: {
    id: number;
    nombre: string;
  };
}

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
}
```

### **Enumeraciones Importantes**

```typescript
// Estados de Incidente
export enum EstadoIncidente {
  PENDIENTE = 'pendiente',
  EN_REVISION = 'en_revision',
  RESUELTO = 'resuelto'
}

// Tipos de Incidente
export enum TipoIncidente {
  MECANICO = 'mecanico',
  ACCIDENTE = 'accidente',
  RETRASO = 'retraso',
  OTRO = 'otro'
}

// Niveles de Gravedad
export enum GravedadIncidente {
  BAJO = 'bajo',
  MEDIO = 'medio',
  ALTO = 'alto',
  CRITICO = 'critico'
}

// Estados de Turno
export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  EN_CURSO = 'en_curso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado'
}

// Roles de Usuario
export enum RolUsuario {
  CIUDADANO = 'ciudadano',
  CONDUCTOR = 'conductor',
  GERENTE = 'gerente',
  ADMIN = 'admin'
}
```

---

### **ConfiguraciÃ³n de Tailwind**

```css
/* tailwind.config.js */
export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#ec4899',
        secondary: '#8b5cf6'
      }
    }
  }
}
```

### **Clases TemÃ¡ticas Reutilizables**

```css
/* styles.css - Clases reutilizables */
.theme-button {
  @apply px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition;
}

.theme-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700;
}

.theme-text-primary {
  @apply text-gray-900 dark:text-white;
}

.theme-text-secondary {
  @apply text-gray-600 dark:text-gray-400;
}
```

---

## ðŸ”§ CONFIGURACIÃ“N POR ENTORNO

### **environment.ts (Desarrollo)**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebaseConfig: {
    apiKey: '...',
    authDomain: '...',
    projectId: '...',
    storageBucket: '...',
    messagingSenderId: '...',
    appId: '...'
  }
};
```

### **environment.prod.ts (ProducciÃ³n)**

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.kalabuses.com',
  firebaseConfig: {
    // ... configuraciÃ³n de Firebase
  }
};
```

### **Uso en Servicios**

```typescript
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl;
  private nestApiUrl = environment.apiNestUrl; // Backend NestJS
  
  constructor(private http: HttpClient) { }
}
```

---

## ðŸ”Œ INTEGRACIÃ“N CON APIs

### **Endpoints Principales del Backend NestJS**

La aplicaciÃ³n se integra con un backend NestJS para operaciones de datos. Los principales endpoints utilizados son:

```typescript
// AutenticaciÃ³n
POST   /auth/login
POST   /auth/register
POST   /auth/forgot-password
POST   /auth/reset-password

// Turnos
GET    /turnos/mi-turno-activo     # Verificar turno activo del conductor
POST   /turnos                      # Crear turno (Gerente)
PUT    /turnos/:id                  # Actualizar turno
DELETE /turnos/:id                  # Eliminar turno

// Incidentes - Conductor
POST   /incidentes-buses/reportar   # Reportar incidente con GPS
GET    /incidentes-buses/alertas/:empresaId  # Alertas crÃ­ticas

// Incidentes - Gerente (Admin)
GET    /admin/incidentes/bus/:busId # Historial de incidentes
GET    /admin/incidentes/bus/:busId/estadisticas # EstadÃ­sticas
PATCH  /admin/incidentes/:id/seguimiento # Actualizar estado/comentarios

// Rutas y Paraderos
GET    /rutas
POST   /rutas
GET    /rutas/:id
PUT    /rutas/:id
DELETE /rutas/:id

// Buses
GET    /buses
POST   /buses
PUT    /buses/:id
DELETE /buses/:id

// Usuarios
GET    /usuarios
POST   /usuarios
PUT    /usuarios/:id
DELETE /usuarios/:id
```

### **ConfiguraciÃ³n de Ambiente (environment.ts)**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',        // API REST general
  apiNestUrl: 'http://localhost:3001/api',    # Backend NestJS
  firebaseConfig: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  }
};
```

### **PatrÃ³n de Llamadas HTTP con Interceptores**

Todas las peticiones HTTP pasan por el `authInterceptor` que:

1. **Obtiene el token JWT** del localStorage
2. **Agrega el header** `Authorization: Bearer <token>`
3. **Adjunta credentials** si es necesario
4. **Maneja errores** de autenticaciÃ³n (401, 403)

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401 || error.status === 403) {
        // Redirigir a login
        window.location.href = '/login';
      }
      return throwError(() => error);
    })
  );
};
```

---

## ðŸ› DEBUGGING Y TROUBLESHOOTING COMÃšN

### **Problema: Las Fotos no se Convierten a Base64**

**SÃ­ntoma:** El array `fotosBase64` estÃ¡ vacÃ­o despuÃ©s de seleccionar archivos.

```typescript
// âŒ INCORRECTO: No accede al evento correctamente
protected onFotosSelected(event: Event): void {
  const files = event.target.files;  // Undefined
}

// âœ… CORRECTO: Casta al tipo correcto
protected onFotosSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  
  Array.from(input.files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      this.fotosBase64.update(prev => [...prev, base64]);
    };
    reader.readAsDataURL(file);
  });
}
```

---

### **Problema: GPS no Funciona en Localhost**

**SÃ­ntoma:** `navigator.geolocation.getCurrentPosition()` no retorna coordenadas.

**Causa:** HTTPS requerido (excepto en localhost con http://127.0.0.1)

```typescript
// âœ… Verificar HTTPS o localhost
if (!navigator.geolocation) {
  console.error('Geolocation not available');
  return;
}

navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('âœ… GPS obtenido:', position.coords);
  },
  (error) => {
    console.error('âŒ Error GPS:', error.message);
    // En desarrollo: permiso denegado es normal
  },
  { 
    enableHighAccuracy: true,  // MÃ¡s preciso pero mÃ¡s lento
    timeout: 10000,            // 10 segundos
    maximumAge: 0              # No usar cache
  }
);
```

---

### **Problema: Turno Activo no se Valida**

**SÃ­ntoma:** `tieneTurnoActivo` siempre es false incluso con turno activo.

```typescript
// âŒ INCORRECTO: Llamar al endpoint incorrecto
this.http.get('/turnos/actual').subscribe(...);  // No existe

// âœ… CORRECTO: Endpoint correcto del backend
this.http.get<any>(`${environment.apiNestUrl}/turnos/mi-turno-activo`).subscribe({
  next: (turno) => {
    // Verificar estado exacto
    if (turno && turno.estado === 'en_curso') {
      this.tieneTurnoActivo.set(true);
    }
  }
});

// âœ… Agregar logging para debug
private verificarTurnoDelConductor(): void {
  this.http.get<any>(`${environment.apiNestUrl}/turnos/mi-turno-activo`)
    .subscribe({
      next: (turno) => {
        console.log('ðŸ“‹ Turno obtenido:', turno);
        console.log('Estado:', turno?.estado);
        if (turno && turno.estado === 'en_curso') {
          this.tieneTurnoActivo.set(true);
        }
      },
      error: (err) => {
        console.error('âŒ Error obteniendo turno:', err);
      }
    });
}
```

---

### **Problema: Toast no Aparece**

**SÃ­ntoma:** Los toasts de error/Ã©xito no se muestran.

```typescript
// âŒ INCORRECTO: No inyectar servicio
constructor() {
  // ToastService no disponible
}

// âœ… CORRECTO: Inyectar servicio
private readonly toastService = inject(ToastService);

// âœ… Verificar que ToastService estÃ© en providers
// En app.config.ts o component providers[]
providers: [
  ToastService,  // O provideZoneChangeDetection si usas standalone
  // ...
]

// âœ… Usar mÃ©todos correctos
this.toastService.success('Ã‰xito');
this.toastService.error('Error');
this.toastService.warning('Advertencia');
this.toastService.info('InformaciÃ³n');
```

---

### **Problema: Signal no se Actualiza en el Template**

**SÃ­ntoma:** El template no refleja cambios en el signal.

```typescript
// âŒ INCORRECTO: No es un signal
export class MyComponent {
  protected data = [];  // Plain array
  
  ngOnInit() {
    this.service.getData().subscribe(data => {
      this.data = data;  // Template no se actualiza
    });
  }
}

// âœ… CORRECTO: Usar signal
export class MyComponent {
  protected data = signal<any[]>([]);  // Signal
  
  ngOnInit() {
    this.service.getData().subscribe(data => {
      this.data.set(data);  // Template se actualiza automÃ¡ticamente
    });
  }
}

// âœ… En el template
@for (item of data(); track item.id) {
  <div>{{ item.name }}</div>
}
```

---

### **Problema: AutenticaciÃ³n Rechazada (401)**

**SÃ­ntoma:** Todas las requests retornan 401 Unauthorized.

```typescript
// âŒ INCORRECTO: Token no se enviÃ¡ o es invÃ¡lido
// Verificar en Network > Headers > Authorization

// âœ… Verificar token en localStorage
console.log('Token:', localStorage.getItem('token'));

// âœ… Verificar que el interceptor estÃ© configurado
// En app.config.ts
provideHttpClient(
  withInterceptors([authInterceptor])
)

// âœ… Verificar formato del token
const token = localStorage.getItem('token');
if (token && token.startsWith('Bearer ')) {
  console.log('âŒ Token ya tiene prefijo Bearer');
  // El interceptor lo aÃ±ade automÃ¡ticamente
}
```

---

### **Problema: Componente no Carga (Lazy Loading Falla)**

**SÃ­ntoma:** Blank page, no error visible.

```typescript
// âŒ INCORRECTO: Ruta relativa incorrecta
{
  path: 'mi-feature',
  loadComponent: () => 
    import('./features/mi-feature/component')  // Falta .component.ts
      .then(m => m.MiFeatureComponent)
}

// âœ… CORRECTO: Ruta completa
{
  path: 'mi-feature',
  loadComponent: () => 
    import('./features/mi-feature/mi-feature.component')
      .then(m => m.MiFeatureComponent)
}

// âœ… Verificar en browser console
// Network tab: ver si el chunk se descarga
// Console: si hay errors en la importaciÃ³n
```

---

## ðŸ§ª TESTING

### **Estructura de Tests (Spec Files)**

```typescript
// feature.component.spec.ts
describe('FeatureComponent', () => {
  let component: FeatureComponent;
  let fixture: ComponentFixture<FeatureComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(FeatureComponent);
    component = fixture.componentInstance;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should load items on init', () => {
    // Test implementation
  });
});
```

**Estado actual:** Archivos de test existen pero no estÃ¡n completamente implementados.

---

## ðŸ“Š DEPENDENCIAS PRINCIPALES Y SUS ROLES

| LibrerÃ­a | VersiÃ³n | Rol | Uso |
|----------|---------|-----|-----|
| @angular/core | 20.3.18 | Framework | Componentes, Servicios, DI, Signals |
| @angular/router | 20.3.18 | Routing | NavegaciÃ³n entre vistas |
| @angular/forms | 20.3.18 | Formularios | Reactive Forms, Template Forms |
| @angular/common | 20.3.18 | Common | CommonModule, Pipes, ngIf/ngFor |
| typescript | 5.9.2 | Lenguaje | Tipado estÃ¡tico |
| tailwindcss | 4.2.1 | CSS Framework | Estilos y diseÃ±o responsivo |
| firebase | 11.6.1 | Backend-as-a-Service | Auth, Firestore |
| leaflet | 1.9.4 | Mapas | VisualizaciÃ³n de rutas/paraderos |
| chart.js | 4.5.1 | GrÃ¡ficos | VisualizaciÃ³n de datos |
| ng2-charts | 10.0.0 | IntegraciÃ³n | Componentes de grÃ¡ficos en Angular |
| ngx-toastr | 19.1.0 | Notificaciones | Toasts de notificaciÃ³n |
| rxjs | 7.8.0 | Reactividad | Observables, Operadores |
| jwt-decode | 4.0.0 | AutenticaciÃ³n | DecodificaciÃ³n de JWT |
| navigator.geolocation | Native API | UbicaciÃ³n | GPS para reportes de incidentes |
| FileReader API | Native API | Archivos | ConversiÃ³n de fotos a base64 |

---

## ðŸš€ ESCALABILIDAD Y EXTENSIÃ“N

### **Agregar Nueva Feature**

1. **Crear estructura de carpetas:**
   ```
   features/mi-feature/
   â”œâ”€â”€ mi-feature.component.ts
   â”œâ”€â”€ mi-feature.component.html
   â””â”€â”€ mi-feature.component.css
   ```

2. **Crear servicio (si es necesario):**
   ```
   core/services/mi-feature.service.ts
   ```

3. **Agregar ruta:**
   ```typescript
   // app.routes.ts
   {
     path: 'mi-feature',
     loadComponent: () => 
       import('./features/mi-feature/mi-feature.component')
         .then(m => m.MiFeatureComponent),
     canActivate: [AuthGuard]
   }
   ```

4. **Exportar en barrel (si aplica):**
   ```typescript
   // core/services/index.ts
   export * from './mi-feature.service';
   ```

---

## ðŸ“ˆ BUENAS PRÃCTICAS APLICADAS

âœ… **SOLID Principles:**
- Single Responsibility: Cada componente/servicio tiene una funciÃ³n
- Open/Closed: Extensible mediante inputs/outputs
- Liskov Substitution: Interfaces consistentes
- Interface Segregation: Servicios especializados
- Dependency Inversion: InyecciÃ³n de dependencias

âœ… **Clean Code:**
- Nombres descriptivos
- Funciones pequeÃ±as y enfocadas
- Comentarios en lÃ³gica compleja
- DRY (Don't Repeat Yourself)
- MÃ©todos cortos (<30 lÃ­neas)

âœ… **Angular Best Practices:**
- Standalone Components
- Lazy Loading de rutas
- Change Detection optimizado
- Signals para reactividad
- SeparaciÃ³n de responsabilidades

âœ… **Performance:**
- Lazy loading de features
- Bundle size optimizado
- OnPush change detection
- Signals en lugar de observables globales

---

## ðŸŽ¯ PUNTOS DE EXTENSIÃ“N CLAVE

### **DÃ³nde Agregar Nueva LÃ³gica**

1. **Nueva Funcionalidad de Negocio**
   â†’ `core/services/nuevo.service.ts`

2. **Nuevo Componente Reutilizable**
   â†’ `shared/components/nuevo/`

3. **Nueva PÃ¡gina/Feature**
   â†’ `features/nueva-feature/`

4. **Nueva Ruta**
   â†’ Agregar en `app.routes.ts`

5. **Validaciones HTTP**
   â†’ `core/interceptors/nuevo.interceptor.ts`

6. **Modelos de Datos**
   â†’ `core/models/nuevo.model.ts`

---

## ðŸ“ SUMMARY RÃPIDO

**Arquitectura:** Feature-Based con Lazy Loading  
**PatrÃ³n de Estado:** Signals + RxJS  
**AutenticaciÃ³n:** Firebase + JWT  
**Base de Datos:** Firebase Firestore  
**Estilos:** Tailwind CSS 4  
**Componentes:** Standalone  
**Tipado:** TypeScript Strict  
**Enrutamiento:** Protegido con AuthGuard  

Esta arquitectura permite **escalabilidad, mantenibilidad y reutilizaciÃ³n** de cÃ³digo. Ideal para equipos de desarrollo colaborativo con IA.

---

## ðŸ“Š ESTADO DEL PROYECTO (Mayo 2026)

### **MÃ³dulos Implementados âœ…**
- âœ… AutenticaciÃ³n (Login, Registro, RecuperaciÃ³n)
- âœ… GestiÃ³n de Rutas y Paraderos
- âœ… Sistema de Boletos
- âœ… Dashboards por Rol (Ciudadano, Conductor, Gerente)
- âœ… GestiÃ³n de Turnos
- âœ… Reportes (Ingresos, DemogrÃ¡ficos)
- âœ… **NUEVO**: Sistema Completo de Incidentes (Reporte + AuditorÃ­a)
- âœ… **NUEVO**: GeolocalizaciÃ³n GPS en tiempo real
- âœ… **NUEVO**: Captura de evidencia fotogrÃ¡fica

### **Arquitectura Solidificada**
- âœ… Feature-Based Architecture completa
- âœ… Lazy Loading optimizado
- âœ… Signals para state management
- âœ… Guards y Interceptors
- âœ… Servicios desacoplados
- âœ… Componentes Standalone
- âœ… TypeScript Strict Mode

### **PrÃ³ximas Mejoras Recomendadas**
- ðŸ“‹ Monitoreo en tiempo real (WebSockets)
- ðŸ“Š Analytics avanzado
- ðŸ”” Notificaciones push
- ðŸ“± Progressive Web App (PWA)
- âš¡ OptimizaciÃ³n de performance

---

**Generado:** Mayo 2026  
**VersiÃ³n Angular:** 20.3.18  
**TypeScript:** 5.9.2  
**Ãšltima ActualizaciÃ³n:** IncorporaciÃ³n del Sistema de Incidentes con GPS y AuditorÃ­a

