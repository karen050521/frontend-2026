# 📚 Guía de Uso de Servicios y Modelos

## 🎯 Servicios Implementados

### 1. RutaService
Gestión de rutas de transporte con detalles de paraderos.

**HU Soportadas:**
- HU-001: Consulta de rutas disponibles
- HU-005: Visualización de recorrido de un viaje
- HU-009: Creación de nueva ruta

**Ejemplo de uso:**
```typescript
import { RutaService } from '@core/services';

export class ConsultaRutasComponent {
  constructor(private rutaService: RutaService) {}

  cargarRutas() {
    this.rutaService.obtenerRutas().subscribe(rutas => {
      console.log('Rutas disponibles:', rutas);
    });
  }

  verDetalles(rutaId: number) {
    this.rutaService.obtenerRutaConParaderos(rutaId).subscribe(detalle => {
      console.log('Paraderos en orden:', detalle.rutaParaderos);
    });
  }
}
```

---

### 2. ParaderoService (HU-002, HU-010)
Búsqueda de paraderos cercanos y registro de nuevos paraderos.

**HU Soportadas:**
- HU-002: Búsqueda de paraderos cercanos (GPS proximity)
- HU-010: Registro de nuevo paradero

**Métodos principales:**

#### HU-002: Buscar paraderos cercanos
```typescript
import { ParaderoService } from '@core/services';
import { GeolocationService } from '@core/services'; // Necesitarás este también

export class BuscadorParaderosComponent {
  constructor(private paraderoService: ParaderoService) {}

  buscarCercanos() {
    // Obtener ubicación GPS del usuario (ejemplo)
    const lat = 10.5; // Latitud
    const lon = 76.3; // Longitud
    const radio = 500; // 500 metros
    const limite = 5; // Top 5 más cercanos

    this.paraderoService.obtenerParaderosCercanos(lat, lon, radio, limite).subscribe(
      response => {
        console.log('Paraderos cercanos:', response.paraderos);
        console.log('Total encontrados:', response.total);
      },
      error => console.error('Error en búsqueda:', error)
    );
  }

  // Alternativa más simple
  buscarCercanosSimple(coords: { lat: number; lng: number }) {
    this.paraderoService.findNearby(coords).subscribe(paraderos => {
      console.log('Paraderos:', paraderos);
    });
  }
}
```

#### HU-010: Crear nuevo paradero
```typescript
import { ParaderoService, CreateParaderoDto } from '@core/services';

export class RegistroParaderoComponent {
  constructor(private paraderoService: ParaderoService) {}

  registrarNuevoParadero() {
    const nuevoParadero: CreateParaderoDto = {
      nombre: 'Paradero Centro',
      latitud: 10.5,
      longitud: 76.3,
      descripcion: 'Parada principal del centro',
      tipo: 'Parada',
      codigo: 'PC-001'
    };

    this.paraderoService.crearParadero(nuevoParadero).subscribe(
      paradero => {
        console.log('Paradero creado:', paradero);
      },
      error => console.error('Error al crear paradero:', error)
    );
  }
}
```

---

### 3. MetodoPagoCiudadanoService (HU-013)
Gestión de métodos de pago y recarga de saldo con ePayco.

**HU Soportadas:**
- HU-013: Recarga tarjeta con ePayco

**⭐ CRÍTICO: Cada tarjeta tiene SALDO INDIVIDUAL**

**Flujo de recarga (HU-013):**
```typescript
import { MetodoPagoCiudadanoService } from '@core/services';

export class RecargaSaldoComponent implements OnInit {
  metodosPago: MetodoPagoCiudadano[] = [];
  saldoActual = 0;

  constructor(private metodoPagoService: MetodoPagoCiudadanoService) {}

  ngOnInit() {
    this.cargarMetodosPago();
  }

  cargarMetodosPago() {
    this.metodoPagoService.obtenerMetodosPago().subscribe(metodos => {
      this.metodosPago = metodos;
      if (metodos.length > 0) {
        this.saldoActual = metodos[0].saldo || 0;
      }
    });
  }

  recargar(metodoPagoId: number, monto: number) {
    if (monto <= 0) {
      console.error('Monto debe ser > 0');
      return;
    }

    this.metodoPagoService.recargarSaldo(metodoPagoId, monto).subscribe(
      response => {
        if (response.success) {
          console.log('Recarga exitosa');
          console.log('Nuevo saldo:', response.nuevoSaldo);
          // ✅ Actualizar saldo reactivo
          this.saldoActual = response.nuevoSaldo!;
        } else {
          console.error('Recarga fallida:', response.error);
        }
      },
      error => console.error('Error en recarga:', error)
    );
  }

  desactivarTarjeta(id: number) {
    this.metodoPagoService.desactivarMetodoPago(id).subscribe(
      () => {
        console.log('Tarjeta desactivada');
        this.cargarMetodosPago();
      }
    );
  }
}
```

---

### 4. ReporteService (HU-014, HU-015)
Reportes analíticos de ingresos y distribución demográfica.

**HU Soportadas:**
- HU-014: Reporte de ingresos por método de pago
- HU-015: Distribución porcentual por rango etario

#### HU-014: Reporte de ingresos por método
```typescript
import { ReporteService } from '@core/services';

export class ReporteIngresosComponent {
  constructor(private reporteService: ReporteService) {}

  obtenerIngresos() {
    this.reporteService.obtenerIngresosPorMetodo().subscribe(reporte => {
      console.log('Período:', reporte.periodo);
      console.log('Fecha generación:', reporte.fechaGeneracion);
      
      // Datos tabulares
      console.table(reporte.ingresos);
      // [
      //   { tipoInstrumento: 'TARJETA_DEBITO', cantidadTransacciones: 45, ingresosTotal: 5600, promedio: 124.44 },
      //   { tipoInstrumento: 'TARJETA_CREDITO', cantidadTransacciones: 32, ingresosTotal: 4200, promedio: 131.25 },
      //   { tipoInstrumento: 'RECARGABLE', cantidadTransacciones: 120, ingresosTotal: 14400, promedio: 120 }
      // ]

      console.log('Total general:', reporte.totalGeneral); // 24200
    });
  }

  exportarCSV() {
    this.reporteService.exportarIngresosCSV().subscribe(blob => {
      // Descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ingresos-por-metodo.csv';
      a.click();
    });
  }
}
```

#### HU-015: Distribución por rango etario
```typescript
export class ReporteDemograficoComponent {
  constructor(private reporteService: ReporteService) {}

  obtenerDistribucionEtaria() {
    this.reporteService.obtenerDistribucionEtaria().subscribe(reporte => {
      console.log('Período:', reporte.periodo);
      
      // Datos tabulares
      console.table(reporte.distribucion);
      // [
      //   { rangoEtario: '18-25', usuarios: 125, ingresos: 3500, porcentaje: 14.47 },
      //   { rangoEtario: '26-35', usuarios: 280, ingresos: 8400, porcentaje: 34.71 },
      //   { rangoEtario: '36-45', usuarios: 210, ingresos: 6800, porcentaje: 28.10 },
      //   { rangoEtario: '46-55', usuarios: 95, ingresos: 3600, porcentaje: 14.88 },
      //   { rangoEtario: '55+', usuarios: 30, ingresos: 1900, porcentaje: 7.85 }
      // ]

      console.log('Total ingresos:', reporte.totalIngresos); // 24200
      console.log('Total usuarios:', reporte.totalUsuarios); // 740
    });
  }

  obtenerConFiltros() {
    const filtros: FiltrosReporte = {
      fechaInicio: new Date('2026-04-18'),
      fechaFin: new Date('2026-05-18'),
      tipoInstrumento: 'TARJETA_DEBITO'
    };

    this.reporteService.obtenerIngresosPorMetodo(filtros).subscribe(reporte => {
      console.log('Ingresos filtrados:', reporte);
    });
  }
}
```

---

## 📦 Importaciones Recomendadas

**Usar barrel exports para simplificar:**
```typescript
// ❌ Evitar
import { RutaService } from '@core/services/ruta.service';
import { ParaderoService } from '@core/services/paradero.service';
import { MetodoPagoCiudadanoService } from '@core/services/metodo-pago-ciudadano.service';

// ✅ Usar
import { 
  RutaService, 
  ParaderoService, 
  MetodoPagoCiudadanoService,
  ReporteService 
} from '@core/services';

import { 
  Ciudadano, 
  MetodoPagoCiudadano, 
  Ruta, 
  Paradero 
} from '@core/models';
```

---

## 🔌 Configuración de Environment

Asegúrate que `environment.ts` contiene:
```typescript
export const environment = {
  apiNestUrl: 'http://localhost:3000/api',
  // ... otras configuraciones
};
```

---

## 🚀 Próximos Pasos

1. **Backend:** Implementar endpoints REST según documentación
2. **Componentes:** Usar servicios en components (ejemplos arriba)
3. **Validaciones:** Agregar validadores para DTOs
4. **Error Handling:** Implementar interceptores de errores
5. **Testing:** Crear specs para servicios

