import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RutaLista, RutaDetalle, RutaRecorrido } from '../../core/models/ruta.model';
import { RutaService } from '../../core/services/ruta.service';
import { FiltroRutasComponent } from './components/filtro-rutas.component';
import { ListadoRutasComponent } from './components/listado-rutas.component';
import { DetalleRutaComponent } from './components/detalle-ruta.component';
import { MapaRutasComponent } from './components/mapa-rutas.component';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-consulta-rutas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FiltroRutasComponent,
    ListadoRutasComponent,
    DetalleRutaComponent,
    MapaRutasComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Encabezado -->
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-[#fafafa]">Consulta de Rutas Disponibles</h1>
          <p class="text-gray-600 dark:text-[#a3a3a3] mt-1">Busca rutas disponibles y visualiza los paraderos en el mapa</p>
        </div>

        <!-- Filtro -->
        <app-filtro-rutas (buscar)="onBuscar($event)" class="mb-6" />

        <!-- Layout principal: Listado + Detalle -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Listado de rutas (1 columna) -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-[#262626] rounded-lg shadow p-4">
              <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-[#fafafa]">Rutas Disponibles</h2>
              <app-listado-rutas
                [rutas]="rutas()"
                [loading]="loading()"
                [rutaSeleccionada]="rutaSeleccionada()?.id || null"
                (seleccionar)="onSeleccionar($event)"
              />
            </div>
          </div>

          <!-- Detalle + Mapa (2 columnas) -->
          <div class="lg:col-span-2 space-y-6" *ngIf="rutaSeleccionada()">
            <app-detalle-ruta [ruta]="rutaSeleccionada()!" />
            <!-- HU-3-001: seguimiento en tiempo real de los buses de esta ruta -->
            <a
              [routerLink]="['/monitoreo', rutaSeleccionada()!.id]"
              class="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow transition-colors"
            >
              🚌 Ver buses en vivo
            </a>
            <app-mapa-rutas [ruta]="rutaSeleccionada()!" [recorrido]="recorridoMapa()" />
          </div>

          <!-- Placeholder cuando no hay ruta seleccionada -->
          <div 
            *ngIf="!rutaSeleccionada() && !loading()"
            class="lg:col-span-2 bg-white dark:bg-[#262626] rounded-lg shadow p-8 flex items-center justify-center text-gray-500 dark:text-[#a3a3a3]"
          >
            <p>👈 Selecciona una ruta para ver los detalles y el mapa</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ConsultaRutasComponent implements OnInit {
  private rutaService = inject(RutaService);

  rutas = signal<RutaLista[]>([]);
  rutaSeleccionada = signal<RutaDetalle | null>(null);
  loading = signal(false);
  recorridoMapa = signal<RutaRecorrido | null>(null);
  
  ngOnInit(): void {
    this.cargarRutas();
  }

  cargarRutas(nombre?: string): void {
    this.loading.set(true);
    this.rutaService.obtenerRutas(nombre).subscribe({
      next: (datos) => {
        this.rutas.set(datos);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar rutas:', error);
        this.loading.set(false);
      }
    });
  }

  onBuscar(nombre: string): void {
    this.rutaSeleccionada.set(null); // Limpiar selección
    if (nombre.trim()) {
      this.cargarRutas(nombre);
    } else {
      this.cargarRutas();
    }
  }

  onSeleccionar(rutaId: number): void {
    this.loading.set(true);
    
    // El forkJoin reemplaza por completo a la petición anterior
    forkJoin({
      detalle: this.rutaService.obtenerRutaConParaderos(rutaId),
      recorrido: this.rutaService.obtenerRecorrido(rutaId)
    }).subscribe({
      next: (respuestas) => {
        this.rutaSeleccionada.set(respuestas.detalle);
        this.recorridoMapa.set(respuestas.recorrido);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar la ruta completa:', error);
        this.loading.set(false);
      }
    });
  }}