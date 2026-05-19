import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RutaService } from '../../core/services/ruta.service';
import { ParaderoService } from '../../core/services/paradero.service';
import { MetodoPagoCiudadanoService } from '../../core/services/metodo-pago-ciudadano.service';
import { ReporteService } from '../../core/services/reporte.service';

@Component({
  selector: 'app-dashboard-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold mb-6">🧪 Dashboard de Servicios</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Rutas -->
        <button (click)="cargarRutas()" class="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg font-bold">
          📍 Cargar Rutas (HU-001)
        </button>
        
        <!-- Paraderos -->
        <button (click)="cargarParaderos()" class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg font-bold">
          📍 Cargar Paraderos (HU-010)
        </button>
        
        <!-- Paraderos Cercanos -->
        <button (click)="buscarCercanos()" class="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg font-bold">
          🗺️ Buscar Cercanos (HU-002)
        </button>
        
        <!-- Métodos de Pago -->
        <button (click)="cargarMetodosPago()" class="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-lg font-bold">
          💳 Métodos de Pago (HU-013)
        </button>
        
        <!-- Reportes Ingresos -->
        <button (click)="cargarReporteIngresos()" class="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg font-bold">
          📊 Reporte Ingresos (HU-014)
        </button>
        
        <!-- Reportes Demográficos -->
        <button (click)="cargarReporteDemografico()" class="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-lg font-bold">
          👥 Reporte Demográfico (HU-015)
        </button>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
        <strong>❌ Error:</strong> {{ error }}
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="bg-blue-100 border border-blue-400 text-blue-700 p-4 rounded mb-4">
        ⏳ Cargando datos...
      </div>

      <!-- Datos -->
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-bold mb-4">📋 Datos:</h2>
        <pre class="bg-gray-100 p-4 rounded overflow-auto max-h-96">{{ datos | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardServiciosComponent implements OnInit {
  datos: any = {};
  error: string = '';
  loading = false;

  constructor(
    private rutaService: RutaService,
    private paraderoService: ParaderoService,
    private metodoPagoService: MetodoPagoCiudadanoService,
    private reporteService: ReporteService
  ) {}

  ngOnInit() {
    console.log('✅ Dashboard de servicios inicializado');
  }

  cargarRutas() {
    this.loading = true;
    this.error = '';
    this.rutaService.obtenerRutas().subscribe({
      next: (rutas: any) => {
        this.datos = { rutas, total: rutas.length };
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Error al cargar rutas';
        this.loading = false;
      }
    });
  }

  cargarParaderos() {
    this.loading = true;
    this.error = '';
    this.paraderoService.obtenerParaderos().subscribe({
      next: (paraderos: any) => {
        this.datos = { paraderos, total: paraderos.length };
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Error al cargar paraderos';
        this.loading = false;
      }
    });
  }

  buscarCercanos() {
    this.loading = true;
    this.error = '';
    // Coordenadas de ejemplo (Pereira)
    this.paraderoService.obtenerParaderosCercanos(10.39, -75.51, 500, 5).subscribe({
      next: (response: any) => {
        this.datos = response;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Error al buscar cercanos';
        this.loading = false;
      }
    });
  }

  cargarMetodosPago() {
    this.loading = true;
    this.error = '';
    this.metodoPagoService.obtenerMetodosPago().subscribe({
      next: (metodos: any) => {
        this.datos = { metodos, total: metodos.length };
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Error al cargar métodos de pago';
        this.loading = false;
      }
    });
  }

  cargarReporteIngresos() {
    this.loading = true;
    this.error = '';
    this.reporteService.obtenerIngresosPorMetodo().subscribe({
      next: (reporte: any) => {
        this.datos = reporte;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Error al cargar reporte de ingresos';
        this.loading = false;
      }
    });
  }

  cargarReporteDemografico() {
    this.loading = true;
    this.error = '';
    this.reporteService.obtenerDistribucionEtaria().subscribe({
      next: (reporte: any) => {
        this.datos = reporte;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Error al cargar reporte demográfico';
        this.loading = false;
      }
    });
  }
}
