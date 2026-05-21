import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutaLista } from '../../../core/models/ruta.model';

@Component({
  selector: 'app-listado-rutas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <div *ngIf="loading()" class="text-center text-gray-500">Cargando...</div>

      <div *ngIf="!loading() && rutas().length === 0" class="text-center text-gray-500">
        No hay rutas disponibles
      </div>

      <button
        *ngFor="let ruta of rutas()"
        (click)="seleccionar.emit(ruta.id)"
        [class.ring-2]="esSeleccionada(ruta)"
        [class.ring-pink-500]="esSeleccionada(ruta)"
        [class.bg-pink-50]="esSeleccionada(ruta)"
        class="w-full text-left p-3 border border-gray-300 rounded-lg hover:border-pink-500 transition cursor-pointer"
      >
        <div class="font-semibold">{{ ruta.nombre }}</div>
        <div *ngIf="ruta.origen || ruta.destino" class="text-sm text-gray-600">
          {{ ruta.origen }} → {{ ruta.destino }}
        </div>
        <div class="flex justify-between items-center mt-2">
          <span class="text-green-600 font-bold">{{ formatTarifa(+ruta.tarifa) }}</span>
          <span class="text-xs text-pink-600">{{ formatDuracion(ruta.duracionEstimada) }}</span>
        </div>
      </button>
    </div>
  `,
})
export class ListadoRutasComponent {
  rutas = input<RutaLista[]>([]);
  loading = input(false);
  rutaSeleccionada = input<number | null>(null);

  seleccionar = output<number>();

  esSeleccionada(ruta: RutaLista): boolean {
    return this.rutaSeleccionada() === ruta.id;
  }

  formatTarifa(tarifa: number): string {
    return '$' + tarifa.toFixed(2);
  }

  formatDuracion(minutos: number): string {
    if (minutos < 60) return minutos + 'm';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? horas + 'h ' + mins + 'm' : horas + 'h';
  }
}
