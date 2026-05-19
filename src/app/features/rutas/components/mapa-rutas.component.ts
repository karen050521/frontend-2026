import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutaDetalle } from '../../../core/models/ruta.model';

@Component({
  selector: 'app-mapa-rutas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-4 rounded-lg border border-gray-200">
      <h3 class="font-semibold mb-3">Mapa de Ruta</h3>
      
      <div 
        id="mapa-container"
        class="w-full h-96 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center"
      >
        <div class="text-center">
          <p class="text-gray-500 mb-2">📍 Mapa interactivo</p>
          <div class="text-sm text-gray-600">
            <p>{{ getParaderoCount() }} paraderos en esta ruta</p>
          </div>

          <div class="mt-4 text-left text-xs text-gray-600 space-y-1 max-h-48 overflow-y-auto">
            <div *ngFor="let rp of ruta().rutaParaderos" class="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
              <span class="bg-pink-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {{ rp.ordenSecuencial }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-700 truncate">{{ rp.paradero.nombre }}</p>
                <p class="text-gray-400 text-xs">{{ rp.horaLlegadaEstimada }} - {{ formatCoordenada(rp.paradero.latitud) }}, {{ formatCoordenada(rp.paradero.longitud) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-3 text-xs text-gray-500">
        💡 Aquí irá la integración con Google Maps o Leaflet
      </div>
    </div>
  `
})
export class MapaRutasComponent {
  ruta = input.required<RutaDetalle>();

  getParaderoCount(): number {
    return this.ruta().rutaParaderos?.length || 0;
  }

  formatCoordenada(valor: number | string | null | undefined): string {
    if (valor == null) return 'N/A';
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    return isNaN(num) ? 'N/A' : num.toFixed(4);
  }
}
