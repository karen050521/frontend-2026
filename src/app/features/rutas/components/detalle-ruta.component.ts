import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutaDetalle } from '../../../core/models/ruta.model';

@Component({
  selector: 'app-detalle-ruta',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-4 rounded-lg border border-gray-200">
      <h3 class="text-lg font-bold mb-2">{{ ruta().nombre }}</h3>
      <p class="text-gray-600 text-sm mb-3">
        <strong>{{ ruta().origen }}</strong> → <strong>{{ ruta().destino }}</strong>
      </p>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-gray-600 text-sm">Tarifa</span>
          <p class="text-xl font-bold text-green-600">{{ formatTarifa(ruta().tarifa) }}</p>
        </div>
        <div>
          <span class="text-gray-600 text-sm">Duración</span>
          <p class="text-xl font-bold text-pink-600">{{ ruta().duracionEstimadoFormato }}</p>
        </div>
      </div>

      <div class="mt-3">
        <span class="text-gray-600 text-sm">Estado</span>
        <p>
          <span 
            [class.bg-green-100]="ruta().estado === 'activa'"
            [class.bg-red-100]="ruta().estado === 'inactiva'"
            [class.text-green-800]="ruta().estado === 'activa'"
            [class.text-red-800]="ruta().estado === 'inactiva'"
            class="px-2 py-1 rounded text-xs font-semibold"
          >
            {{ ruta().estado | uppercase }}
          </span>
        </p>
      </div>

      <div *ngIf="ruta().rutaParaderos" class="mt-4">
        <h4 class="font-semibold text-sm mb-2">Paraderos ({{ ruta().rutaParaderos.length }})</h4>
        <div class="space-y-1 max-h-40 overflow-y-auto text-sm">
          <div *ngFor="let rp of ruta().rutaParaderos" class="flex items-center gap-2">
            <span class="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {{ rp.ordenSecuencial }}
            </span>
            <span class="text-gray-700">{{ rp.paradero.nombre }}</span>
            <span class="text-gray-400 text-xs">{{ rp.horaLlegadaEstimada }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DetalleRutaComponent {
  ruta = input.required<RutaDetalle>();

  formatTarifa(tarifa: number): string {
    return '$' + tarifa.toFixed(2);
  }
}
