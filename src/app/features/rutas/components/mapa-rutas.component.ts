import { Component, input, effect, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutaDetalle, RutaRecorrido } from '../../../core/models/ruta.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa-rutas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 shadow-xl text-white">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-lg font-bold text-pink-500">🗺️ Mapa de la Ruta</h3>
          <p class="text-gray-400 text-xs mt-0.5">{{ getParaderoCount() }} paraderos secuenciales en el trayecto</p>
        </div>
        @if (recorrido()) {
          <div class="text-right text-xs">
            <span class="text-emerald-400 font-medium block">⏱️ {{ recorrido()?.tiempoTotalEstimado }} mins</span>
            <span class="text-fuchsia-400 block font-mono">📏 {{ ((recorrido()?.distanciaTotal || 0) / 1000) | number:'1.1-2' }} km</span>
          </div>
        }
      </div>
      
      <div 
        class="w-full h-[400px] bg-[#121212] rounded-xl border border-gray-800 overflow-hidden relative shadow-inner"
      >
        <div #mapContainer style="width: 100%; height: 100%;"></div>
      </div>

      <div class="mt-3 text-[11px] text-gray-500 flex items-center gap-1.5 justify-end">
        <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span> Inicio
        <span class="w-2.5 h-2.5 bg-pink-500 rounded-full inline-block"></span> Parada
        <span class="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span> Fin
      </div>
    </div>
  `
})
export class MapaRutasComponent implements AfterViewInit, OnDestroy {
  ruta = input.required<RutaDetalle>();
  recorrido = input<RutaRecorrido | null>(null);

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private map: L.Map | null = null;
  private routeLayers = L.layerGroup();
  private initTimeout: any = null;
  private isViewInitialized = false;

  constructor() {
    effect(() => {
      const rec = this.recorrido();
      if (rec && this.isViewInitialized) {
        this.actualizarMapa(rec);
      }
    });
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    const rec = this.recorrido();
    if (rec) {
      this.actualizarMapa(rec);
    }
  }

  getParaderoCount(): number {
    return this.ruta().rutaParaderos?.length || 0;
  }

  ngOnDestroy(): void {
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private actualizarMapa(rec: RutaRecorrido): void {
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
    }

    this.initTimeout = setTimeout(() => {
      const container = this.mapContainer?.nativeElement;
      if (!container) {
        return;
      }

      // Si ya existía un mapa, lo destruimos para evitar inconsistencias
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      // Clean leftover Leaflet IDs on the container element just in case
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }

      // Center initially on Manizales (approx. 5.0689, -75.5173)
      this.map = L.map(container).setView([5.0689, -75.5173], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(this.map);

      this.routeLayers = L.layerGroup().addTo(this.map);

      // Force recalculate dimensions so Leaflet computes bounds correctly
      this.map.invalidateSize();

      // Get stop coordinates
      const coordenadas: L.LatLngTuple[] = (rec.paraderos || []).map(
        (p) => [+p.latitud, +p.longitud] as L.LatLngTuple
      );

      if (coordenadas.length > 0) {
        // Draw route line
        const polyline = L.polyline(coordenadas, { 
          color: '#ec4899', 
          weight: 4, 
          opacity: 0.8 
        }).addTo(this.routeLayers);

        this.map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      } else {
        // Default city view if no coordinates are associated yet
        this.map.setView([5.0689, -75.5173], 13);
      }

      // Draw sequence markers
      (rec.paraderos || []).forEach((p) => {
        const isStart = p.orden === 1;
        const isEnd = p.orden === rec.paraderos.length;
        const color = isStart ? '#10b981' : isEnd ? '#ef4444' : '#ec4899'; // Green, Red, Pink

        const markerHtml = `
          <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4); color: white; font-size: 10px; font-weight: bold;">
            ${p.orden}
          </div>`;

        const customIcon = L.divIcon({ 
          html: markerHtml, 
          className: '', 
          iconSize: [24, 24], 
          iconAnchor: [12, 12] 
        });

        L.marker([+p.latitud, +p.longitud], { icon: customIcon })
          .bindPopup(`
            <div class="text-xs text-gray-800">
              <strong class="text-pink-600">Secuencia ${p.orden}: ${p.nombre}</strong>
              ${p.descripcion ? `<p class="mt-1">${p.descripcion}</p>` : ''}
              <div class="mt-1.5 border-t pt-1 text-[10px] text-gray-500">
                <span>Distancia desde anterior: ${p.distanciaDesdeAnteriorMetros}m</span><br>
                <span>Tiempo estimado: ${p.tiempoEstimadoMinutos} min</span>
              </div>
            </div>
          `)
          .addTo(this.routeLayers);
      });
    }, 300);
  }
}
