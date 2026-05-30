# 📋 DOCUMENTACIÓN DE FUNCIONALIDADES - KALA BUSES

**Plataforma Integral de Gestión y Reserva de Transporte Urbano**

---

## 🎯 DESCRIPCIÓN DEL PROYECTO

**KALA Buses** es una aplicación web moderna construida con **Angular 20** que proporciona una solución completa para la gestión de transporte urbano. La plataforma está diseñada para tres tipos de usuarios principales:

- **Ciudadanos**: Consultar rutas, comprar boletos, buscar paraderos cercanos
- **Administradores/Gerentes**: Gestionar rutas, buses, incidentes, reportes
- **Conductores**: Gestionar turnos, reportar incidentes, consultar programación

---

## 🛠️ TECNOLOGÍAS UTILIZADAS

### **Frontend**
- **Angular**: v20.3.18 (Framework principal)
- **TypeScript**: v5.9.2 (Lenguaje de programación)
- **Tailwind CSS**: v4.2.1 (Estilos y diseño responsivo)
- **PostCSS**: v8.5.8 (Procesamiento de CSS)

### **Librerías Principales**
- **Firebase**: v11.6.1 (Autenticación y base de datos)
- **Leaflet**: v1.9.4 (Mapas interactivos)
- **Chart.js**: v4.5.1 (Gráficos y análisis)
- **ng2-charts**: v10.0.0 (Integración de gráficos en Angular)
- **ngx-toastr**: v19.1.0 (Notificaciones)
- **RxJS**: v7.8.0 (Programación reactiva)
- **JWT Decode**: v4.0.0 (Decodificación de tokens JWT)

### **Herramientas de Desarrollo**
- **Angular CLI**: v20.3.18
- **Karma**: v6.4.0 (Framework de pruebas)
- **Jasmine**: v5.9.0 (Testing)
- **Prettier**: Formateo de código

---

## 📊 ARQUITECTURA DEL PROYECTO

```
src/
├── app/
│   ├── core/                    # Servicios, modelos, configuración
│   │   ├── config/              # Configuración (API, Firebase)
│   │   ├── guards/              # Guards de autenticación
│   │   ├── interceptors/        # Interceptores HTTP
│   │   ├── models/              # Modelos de datos
│   │   ├── services/            # Servicios de negocio
│   │   └── utils/               # Utilidades
│   ├── features/                # Módulos/Componentes de la aplicación
│   │   ├── boletos/             # Gestión de boletos
│   │   ├── buses/               # Registro de buses
│   │   ├── dashboard/           # Dashboards por rol
│   │   ├── incidente-admin/     # Auditoría de incidentes
│   │   ├── incidentes/          # Reportes de incidentes
│   │   ├── permissions/         # Gestión de permisos
│   │   ├── programacion/        # Programación de viajes
│   │   ├── recarga/             # Recarga de saldo
│   │   ├── reportes/            # Reportes (ingresos, demográfico)
│   │   ├── roles/               # Gestión de roles
│   │   ├── rutas/               # Gestión de rutas y paraderos
│   │   ├── security/            # Login, registro, recuperación
│   │   ├── turnos/              # Gestión de turnos
│   │   ├── user-role/           # Asignación de roles a usuarios
│   │   ├── users/               # Gestión de usuarios
│   │   ├── dashboard-servicios/ # Panel de prueba de servicios
│   │   └── home/                # Página de inicio
│   ├── shared/                  # Componentes compartidos
│   │   └── components/          # Header, Sidebar, Modal, etc.
│   ├── environments/            # Configuración por entorno
│   └── app.routes.ts            # Rutas principales
├── environments/
│   ├── environment.ts           # Desarrollo
│   ├── environment.prod.ts      # Producción
│   └── environment.example.ts   # Ejemplo de configuración
└── styles.css                   # Estilos globales
```

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 🔐 **MÓDULO DE SEGURIDAD (Security)**

**¿QUÉ CUMPLE?**

1. **Registro de Usuarios**
   - ✅ Registro con email y contraseña
   - ✅ Validación de formularios
   - ✅ Integración con Firebase Authentication

2. **Autenticación y Login**
   - ✅ Login con email/contraseña
   - ✅ Persistencia de sesión
   - ✅ Guard de autenticación (AuthGuard)
   - ✅ Interceptor para agregar token JWT a las peticiones

3. **Recuperación de Contraseña**
   - ✅ Solicitud de restablecimiento de contraseña
   - ✅ Link de restablecimiento por email
   - ✅ Validación y cambio de contraseña

4. **Protección de Rutas**
   - ✅ Rutas protegidas por AuthGuard
   - ✅ Redirección a login si no autenticado
   - ✅ Página de acceso denegado (403)

---

### 🚌 **MÓDULO DE RUTAS Y PARADEROS (Rutas)**

**¿QUÉ CUMPLE?**

1. **Consulta de Rutas (HU-001)**
   - ✅ Listar todas las rutas disponibles
   - ✅ Filtrar rutas por origen y destino
   - ✅ Ver detalles de cada ruta
   - ✅ Visualizar rutas en mapa interactivo (Leaflet)
   - ✅ Información de paraderos de la ruta
   - ✅ Duración estimada del viaje

2. **Crear Ruta (HU-009)**
   - ✅ Formulario para crear nueva ruta
   - ✅ Asignar paraderos secuenciales
   - ✅ Validación de datos
   - ✅ Persistencia en base de datos

3. **Crear Paradero (HU-010)**
   - ✅ Formulario para crear nuevos paraderos
   - ✅ Ubicación GPS (latitud, longitud)
   - ✅ Nombre y código del paradero
   - ✅ Persistencia en base de datos

4. **Paraderos Cercanos**
   - ✅ Búsqueda de paraderos cercanos por ubicación
   - ✅ Visualización en mapa
   - ✅ Distancia calculada desde la ubicación del usuario
   - ✅ Información de rutas que pasan por cada paradero

---

### 🎫 **MÓDULO DE BOLETOS (Boletos)**

**¿QUÉ CUMPLE?**

1. **Gestión de Boletos**
   - ✅ Compra de boletos para rutas disponibles
   - ✅ Consulta de boletos activos
   - ✅ Validación de fondos disponibles
   - ✅ Historial de transacciones

2. **Abordaje de Pasajeros**
   - ✅ Solicitud de abordaje en bus
   - ✅ Validación de boleto
   - ✅ Deducción de saldo

3. **Consulta de Boletos**
   - ✅ Ver boletos comprados
   - ✅ Estados del boleto (activo, usado, expirado)
   - ✅ Información del viaje

---

### 💳 **MÓDULO DE PAGOS (Recarga)**

**¿QUÉ CUMPLE?**

1. **Recarga de Saldo**
   - ✅ Interfaz para recargar saldo
   - ✅ Integración con Epayco (pasarela de pagos)
   - ✅ Histórico de recargas
   - ✅ Diferentes métodos de pago

2. **Métodos de Pago**
   - ✅ Tarjeta de crédito
   - ✅ Tarjeta de débito
   - ✅ Registro de métodos de pago

---

### 🚌 **MÓDULO DE BUSES**

**¿QUÉ CUMPLE?**

1. **Registro de Buses**
   - ✅ Formulario para registrar nuevos buses
   - ✅ Placa del bus (identificador único)
   - ✅ Modelo y marca
   - ✅ Capacidad de pasajeros
   - ✅ Generación de código QR por bus
   - ✅ Acceso público a información del bus por código QR

2. **Gestión de Buses**
   - ✅ Ver lista de buses
   - ✅ Editar información del bus
   - ✅ Cambio de estado (activo/inactivo)

---

### 📅 **MÓDULO DE PROGRAMACIÓN**

**¿QUÉ CUMPLE?**

1. **Programación de Viajes**
   - ✅ Crear programación para rutas
   - ✅ Asignar conductor a cada viaje
   - ✅ Asignar bus a cada viaje
   - ✅ Seleccionar horario de salida
   - ✅ Consultar todas las programaciones

2. **Historial de Programación**
   - ✅ Ver viajes pasados
   - ✅ Ver viajes próximos

---

### 🛣️ **MÓDULO DE TURNOS (Conductores)**

**¿QUÉ CUMPLE?**

1. **Gestión de Turnos de Conductor**
   - ✅ Ver turnos asignados
   - ✅ Iniciar turno
   - ✅ Finalizar turno
   - ✅ Horario del turno
   - ✅ Ruta asignada

2. **Información del Turno**
   - ✅ Bus asignado
   - ✅ Programación del día
   - ✅ Horarios de salida

---

### 🚨 **MÓDULO DE INCIDENTES**

**¿QUÉ CUMPLE?**

1. **Reporte de Incidentes (Conductor - HU-008)**
   - ✅ Formulario rápido para reportar incidentes
   - ✅ Tipos de incidentes predefinidos
   - ✅ Descripción del incidente
   - ✅ Prioridad del incidente
   - ✅ Ubicación GPS del incidente
   - ✅ Fotos/evidencia del incidente

2. **Auditoría de Incidentes (Admin - HU-019)**
   - ✅ Ver todos los incidentes reportados
   - ✅ Filtrar por bus, ruta, tipo, estado
   - ✅ Cambiar estado del incidente (abierto, en proceso, resuelto)
   - ✅ Asignar personal responsable
   - ✅ Ver detalles completos del incidente

3. **Tendencia de Incidentes**
   - ✅ Gráfico de líneas mostrando tendencia
   - ✅ Análisis por período
   - ✅ Identificación de patrones

---

### 📊 **MÓDULO DE REPORTES**

**¿QUÉ CUMPLE?**

1. **Reporte de Ingresos**
   - ✅ Ingresos por ruta
   - ✅ Ingresos por período (diario, semanal, mensual)
   - ✅ Gráficos de barras y líneas
   - ✅ Información exportable

2. **Reporte Demográfico**
   - ✅ Datos de pasajeros por ruta
   - ✅ Franja horaria de mayor uso
   - ✅ Análisis de ocupación
   - ✅ Distribución geográfica

3. **Dashboard de Reportes**
   - ✅ Resumen de KPI principales
   - ✅ Visualización de datos en tiempo real

---

### 👥 **MÓDULO DE ADMINISTRACIÓN**

**¿QUÉ CUMPLE?**

1. **Gestión de Roles (HU-005)**
   - ✅ Crear nuevos roles
   - ✅ Editar roles existentes
   - ✅ Eliminar roles
   - ✅ Asignar permisos a roles
   - ✅ Descripción y nombre del rol

2. **Gestión de Permisos (HU-006)**
   - ✅ Crear permisos
   - ✅ Definir URL del recurso
   - ✅ Definir método HTTP (GET, POST, PUT, DELETE)
   - ✅ Asignar modelo afectado
   - ✅ Validación de formato de URL

3. **Asignación de Roles a Usuarios (HU-007)**
   - ✅ Ver usuarios del sistema
   - ✅ Asignar roles a usuarios
   - ✅ Cambiar roles de usuarios
   - ✅ Ver roles actuales
   - ✅ Activar/desactivar usuarios

4. **Gestión de Usuarios**
   - ✅ Crear usuarios
   - ✅ Ver lista de usuarios
   - ✅ Editar información del usuario
   - ✅ Cambiar estado (activo/inactivo)
   - ✅ Filtrado de usuarios

---

### 📱 **MÓDULO DE DASHBOARDS**

**¿QUÉ CUMPLE?**

1. **Dashboard Ciudadano**
   - ✅ Carrusel de rutas disponibles
   - ✅ Búsqueda rápida de rutas
   - ✅ Acceso rápido a paraderos cercanos
   - ✅ Botón para buscar rutas
   - ✅ Consulta de saldo disponible
   - ✅ Historial de viajes recientes
   - ✅ Botones de acciones rápidas

2. **Dashboard Conductor**
   - ✅ Información del turno actual
   - ✅ Información del bus asignado
   - ✅ Información de la ruta
   - ✅ Botones de acción (Iniciar turno, Finalizar turno)
   - ✅ Horarios programados

3. **Dashboard Administrador/Gerente**
   - ✅ Resumen de KPI principales
   - ✅ Acceso rápido a funcionalidades principales
   - ✅ Gestión de recursos
   - ✅ Visualización de estadísticas

4. **Dashboard de Servicios (Pruebas)**
   - ✅ Panel de prueba para desarrolladores
   - ✅ Botones para cargar datos de prueba
   - ✅ Verificación de servicios

---

### 🎨 **MÓDULO DE INTERFAZ Y EXPERIENCIA**

**¿QUÉ CUMPLE?**

1. **Tema Oscuro/Claro**
   - ✅ Toggle de tema en header
   - ✅ Persistencia del tema seleccionado
   - ✅ Aplicación en toda la plataforma

2. **Sidebar de Navegación**
   - ✅ Menú lateral con opciones según rol
   - ✅ Iconos descriptivos
   - ✅ Collapsible en dispositivos móviles
   - ✅ Navegación activa resaltada

3. **Header**
   - ✅ Logo de la aplicación
   - ✅ Información del usuario autenticado
   - ✅ Toggle del sidebar
   - ✅ Toggle del tema
   - ✅ Botón de logout

4. **Notificaciones (Toast)**
   - ✅ Notificaciones de éxito
   - ✅ Notificaciones de error
   - ✅ Notificaciones de información
   - ✅ Notificaciones de advertencia
   - ✅ Auto-cierre configurable

5. **Modal Reutilizable**
   - ✅ Modal para confirmaciones
   - ✅ Modal para formularios
   - ✅ Modal personalizable
   - ✅ Eventos de confirmar/cancelar

6. **Diseño Responsivo**
   - ✅ Mobile-first
   - ✅ Adaptable a tablet
   - ✅ Optimizado para desktop
   - ✅ Tailwind CSS para estilos

---

### 📍 **MAPAS Y UBICACIÓN**

**¿QUÉ CUMPLE?**

1. **Integración de Mapas (Leaflet)**
   - ✅ Visualización de rutas en mapa
   - ✅ Marcadores de paraderos
   - ✅ Polyline para mostrar recorrido
   - ✅ Zoom y navegación del mapa
   - ✅ Captura de ubicación GPS del usuario

2. **Geolocalización**
   - ✅ Solicitud de permiso de ubicación
   - ✅ Captura de coordenadas del usuario
   - ✅ Cálculo de distancia a paraderos cercanos

---

### 🏠 **PÁGINA DE INICIO**

**¿QUÉ CUMPLE?**

1. **Hero Section**
   - ✅ Título y descripción principal
   - ✅ Botones de acción (Comenzar, Saber más)

2. **Características**
   - ✅ Grid de características principales
   - ✅ Descripción de beneficios
   - ✅ Iconos representativos

3. **Sección "¿Por qué elegirnos?"**
   - ✅ Información sobre seguridad
   - ✅ Información sobre rapidez
   - ✅ Información sobre diseño
   - ✅ Información sobre confiabilidad

4. **CTA (Call To Action)**
   - ✅ Botones para acciones principales

---

## ❌ FUNCIONALIDADES NO IMPLEMENTADAS / PENDIENTES

### 🔴 **FUNCIONALIDADES INCOMPLETAS O FALTANTES**

1. **Validación de Recaptcha**
   - ❌ Aunque existe el servicio `RecaptchaService`, no está integrado en formularios
   - ⚠️ Configuración pendiente de reCAPTCHA v3

2. **Notificaciones en Tiempo Real**
   - ❌ No hay WebSockets implementados
   - ⚠️ Las notificaciones son solo locales, no se sincronizan entre dispositivos

3. **Chat o Soporte en Vivo**
   - ❌ No existe módulo de chat
   - ⚠️ No hay sistema de tickets de soporte

4. **Integración Completa de Epayco**
   - ⚠️ Servicio existe pero no está completamente integrado en todas las vistas
   - ⚠️ Falta documentación de API Epayco

5. **Búsqueda Avanzada**
   - ⚠️ La búsqueda es básica en la mayoría de módulos
   - ❌ Falta búsqueda full-text
   - ❌ Falta búsqueda por criterios múltiples

6. **Exportación de Reportes**
   - ⚠️ Los reportes se visualizan pero no se pueden exportar a PDF o Excel

7. **Análisis Predictivo**
   - ❌ No hay modelos de machine learning
   - ❌ No hay predicción de demanda

8. **Validación de Permisos en Frontend**
   - ⚠️ Existe autenticación pero falta validación granular de permisos en componentes

9. **Testing Automatizado**
   - ⚠️ Existen archivos `.spec.ts` pero no están desarrollados
   - ❌ Falta cobertura de pruebas

10. **Offline Mode**
    - ❌ La aplicación requiere conexión a internet
    - ❌ No hay sincronización offline

11. **Multiidioma (i18n)**
    - ❌ La aplicación solo está en español
    - ❌ No hay soporte para múltiples idiomas

12. **Accesibilidad (a11y)**
    - ⚠️ Falta ARIA labels en muchos componentes
    - ⚠️ Navegación por teclado no optimizada
    - ⚠️ Falta alto contraste para modo oscuro

13. **Validación de Formularios Avanzada**
    - ⚠️ Validaciones básicas implementadas
    - ❌ Falta validación asíncrona personalizada
    - ❌ Falta validación cross-field

14. **Caché de Datos**
    - ⚠️ No hay estrategia de caché implementada
    - ❌ Cada consulta va a la API

15. **Rate Limiting en Frontend**
    - ❌ No hay protección contra múltiples solicitudes rápidas

16. **Autenticación Multifactor (MFA)**
    - ❌ No está implementado MFA
    - ⚠️ Aunque existe el concepto en la documentación

17. **OAuth/SSO**
    - ❌ No hay integración con Google, Microsoft, etc.
    - ⚠️ Solo autenticación directa

18. **Historial de Auditoria Detallado**
    - ⚠️ Falta log detallado de todas las acciones del usuario

19. **Gestión de Sesiones Múltiples**
    - ❌ No hay protección contra múltiples sesiones simultáneas

20. **Recuperación de Errores**
    - ⚠️ Falta retry automático en solicitudes fallidas
    - ⚠️ Falta manejo elegante de timeouts

21. **Documentación de API**
    - ⚠️ Falta Swagger/OpenAPI documentado
    - ⚠️ Falta documentación de endpoints específicos

22. **Validación de Datos en Entrada**
    - ⚠️ Las validaciones son básicas en formularios
    - ❌ Falta sanitización de entrada en algunos campos

---

## 📈 SERVICIOS PRINCIPALES

### **Core Services**

| Servicio | Responsabilidad | Estado |
|----------|-----------------|--------|
| `RutaService` | Gestión de rutas | ✅ Activo |
| `ParaderoService` | Gestión de paraderos | ✅ Activo |
| `BusService` | Gestión de buses | ✅ Activo |
| `AuthService` | Autenticación local | ✅ Activo |
| `FirebaseAuthService` | Autenticación Firebase | ✅ Activo |
| `UserService` | Gestión de usuarios | ✅ Activo |
| `RoleService` | Gestión de roles | ✅ Activo |
| `PermissionService` | Gestión de permisos | ✅ Activo |
| `BoletoService` | Gestión de boletos | ✅ Activo |
| `ProgramacionService` | Gestión de programación | ✅ Activo |
| `IncidenteAdminService` | Auditoría de incidentes | ✅ Activo |
| `IncidenteBusService` | Reporte de incidentes | ✅ Activo |
| `ReporteService` | Generación de reportes | ✅ Activo |
| `EpaycoService` | Integración de pagos | ⚠️ Parcial |
| `MetodoPagoCiudadanoService` | Métodos de pago | ✅ Activo |
| `RecaptchaService` | Validación de reCAPTCHA | ⚠️ Sin integrar |
| `ThemeService` | Gestión de tema (claro/oscuro) | ✅ Activo |
| `ToastService` | Notificaciones | ✅ Activo |
| `ModalService` | Gestión de modales | ✅ Activo |
| `ConductorService` | Gestión de conductores | ✅ Activo |
| `TurnoService` | Gestión de turnos | ✅ Activo |

---

## 🔒 SEGURIDAD IMPLEMENTADA

**¿QUÉ CUMPLE?**

- ✅ Autenticación con Firebase
- ✅ Token JWT para autenticación
- ✅ Interceptor para agregar token a solicitudes
- ✅ Guard para proteger rutas
- ✅ Encriptación de datos en tránsito (HTTPS)
- ✅ Validación en formularios

**¿QUÉ FALTA?**

- ❌ Autenticación Multifactor (MFA)
- ❌ Validación granular de permisos en frontend
- ❌ CSRF Protection
- ❌ Rate limiting
- ❌ Sanitización de entrada en algunos campos
- ❌ CSP (Content Security Policy)

---

## 📱 CARACTERÍSTICAS DE RESPONSIVE DESIGN

**¿QUÉ CUMPLE?**

- ✅ Mobile-first approach
- ✅ Grid responsivo con Tailwind CSS
- ✅ Sidebar colapsible en móvil
- ✅ Menú adaptable
- ✅ Optimizado para tablets
- ✅ Optimizado para desktop

---

## 🎯 MODELOS DE DATOS PRINCIPALES

```typescript
// Ciudadano
Ciudadano {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  cedula: string
  saldo: number
}

// Ruta
Ruta {
  id: string
  nombre: string
  codigoRuta: string
  origen: string
  destino: string
  distancia: number
  duracion: number
  paraderos: Paradero[]
  estado: 'activa' | 'inactiva'
}

// Paradero
Paradero {
  id: string
  nombre: string
  codigo: string
  latitud: number
  longitud: number
}

// Bus
Bus {
  id: string
  placa: string
  marca: string
  modelo: string
  capacidad: number
  estado: 'activo' | 'inactivo'
}

// Boleto
Boleto {
  id: string
  ciudadano: Ciudadano
  ruta: Ruta
  fechaCompra: Date
  estado: 'activo' | 'usado' | 'expirado'
  precio: number
}

// Programacion
Programacion {
  id: string
  ruta: Ruta
  bus: Bus
  conductor: Usuario
  fechaSalida: Date
  estado: 'programado' | 'en_proceso' | 'completado'
}

// Incidente
Incidente {
  id: string
  tipo: string
  descripcion: string
  bus: Bus
  ruta: Ruta
  ubicacion: { lat: number, lng: number }
  estado: 'abierto' | 'en_proceso' | 'resuelto'
  evidencia: string[]
}

// Role
Role {
  id: string
  nombre: string
  descripcion: string
  permisos: Permission[]
}

// Permission
Permission {
  id: string
  url: string
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE'
  modelo: string
}
```

---

## 🚀 PRÓXIMAS MEJORAS SUGERIDAS

### **Corto Plazo (1-2 meses)**
1. Implementar MFA (Autenticación Multifactor)
2. Agregar validación de permisos en componentes
3. Mejorar validaciones de formularios
4. Completar testing unitario (Jest/Jasmine)
5. Exportación de reportes a PDF

### **Mediano Plazo (2-4 meses)**
1. Implementar WebSockets para notificaciones en tiempo real
2. Agregar soporte multiidioma (i18n)
3. Mejorar accesibilidad (a11y)
4. Implementar caché de datos
5. Agregar sistema de tickets de soporte

### **Largo Plazo (4+ meses)**
1. Machine Learning para análisis predictivo
2. Modo offline con sincronización
3. OAuth/SSO con Google y Microsoft
4. Sistema de chat en vivo
5. Análisis avanzado con BI

---

## 📝 NOTAS IMPORTANTES

### **Archivos de Configuración**
- `environment.ts` - Configuración de desarrollo
- `environment.prod.ts` - Configuración de producción
- `firebase.config.ts` - Configuración de Firebase
- `api.config.ts` - Configuración de API

### **Componentes Standalone**
Todos los componentes en este proyecto utilizan Angular Standalone Components (Angular 14+), lo que simplifica la importación de módulos.

### **Estilización**
El proyecto utiliza Tailwind CSS 4 con PostCSS para todos los estilos. Los temas (claro/oscuro) se manejan mediante clases CSS dinámicas.

### **Versionamiento**
La aplicación utiliza Angular 20.3.18, la versión más reciente disponible.

---

## 📞 CONTACTO Y SOPORTE

Para reportar bugs o solicitar nuevas funcionalidades, contacta al equipo de desarrollo.

---

**Última actualización**: Mayo 2026  
**Estado del Proyecto**: En Desarrollo  
**Versión**: 0.0.0  
**Licencia**: Privada
