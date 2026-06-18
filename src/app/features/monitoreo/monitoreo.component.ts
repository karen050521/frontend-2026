import { Component, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MonitoreoService, BusEnRuta } from '../../core/services/monitoreo.service';
import { environment } from '../../../environments/environment';
import * as L from 'leaflet';

@Component({
  selector: 'app-monitoreo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monitoreo.component.html',
})
export class MonitoreoComponent implements OnInit, AfterViewInit, OnDestroy {

  rutaId: number = 0;
  buses: BusEnRuta[] = [];
  busesConIncidente: BusEnRuta[] = []; 
  paraderos: any[] = [];
  paraderoSeleccionadoId: number | null = null;
  etaPersonalizado: number | null = null;
  cargando = true;

  private mapa!: L.Map;
  private marcadores = new Map<number, L.Marker>();
  private pollingSubscription!: Subscription;
  private primeraCarga = true;
  // Rutas/paraderos viven en back-logic (NestJS :3000), no en back-sec (:8181)
  private apiUrl = environment.apiNestUrl;

  private monitoreoService = inject(MonitoreoService);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  ngOnInit() {
    this.rutaId = Number(this.route.snapshot.paramMap.get('rutaId'));
    this.cargarParaderos();
  }

  ngAfterViewInit() {
    this.inicializarMapa();
    this.cargarBusesInicial();
    this.iniciarPolling();
  }

  private inicializarMapa() {
    // Coordenadas base por defecto
    this.mapa = L.map('mapa-monitoreo').setView([4.7110, -74.0721], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© KALA Buses - OpenStreetMap contributors',
    }).addTo(this.mapa);
  }

  private cargarBusesInicial() {
    this.monitoreoService.getBusesActivosPorRuta(this.rutaId).subscribe({
      next: (resp: { data: BusEnRuta[] }) => {
        this.cargando = false;
        this.actualizarMapa(resp.data);
      },
      error: (err: Error) => {
        this.cargando = false;
        console.error('Error cargando buses iniciales:', err);
      },
    });
  }

  private iniciarPolling() {
    this.pollingSubscription = this.monitoreoService
      .getBusesActivosPolling(this.rutaId)
      .subscribe({
        next: (resp: { data: BusEnRuta[] }) => this.actualizarMapa(resp.data),
        error: (err: Error) => console.error('Error en ejecución de polling:', err),
      });
  }

  private cargarParaderos() {
    // GET /ruta/:id/paraderos devuelve una Ruta con rutaParaderos[].paradero (no un array plano)
    this.http.get<any>(`${this.apiUrl}/ruta/${this.rutaId}/paraderos`).subscribe({
      next: (resp: any) => {
        const rp = resp?.rutaParaderos ?? resp?.data?.rutaParaderos ?? [];
        this.paraderos = Array.isArray(rp)
          ? rp.map((x: any) => x?.paradero ?? x).filter(Boolean)
          : [];
      },
      error: () => { this.paraderos = []; }
    });
  }

  /** Formatea minutos de retraso a "Xh Ym" legible (p.ej. 867 → "14 h 27 min"). */
  formatearRetraso(minutos: number): string {
    const min = Math.max(0, Math.round(minutos ?? 0));
    const horas = Math.floor(min / 60);
    const mins = min % 60;
    if (horas === 0) return `${mins} min`;
    return mins === 0 ? `${horas} h` : `${horas} h ${mins} min`;
  }

  consultarEtaPersonal(busId: number) {
    if (!this.paraderoSeleccionadoId) return;
    this.monitoreoService
      .getEtaParaParadero(busId, this.paraderoSeleccionadoId)
      .subscribe({
        next: (resp: { eta: number; distanciaKm: number }) => {
          this.etaPersonalizado = resp.eta;
        },
        error: (err: Error) => console.error('Error al calcular ETA personalizado:', err),
      });
  }

  seleccionarParadero(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.paraderoSeleccionadoId = valor ? Number(valor) : null;
    this.etaPersonalizado = null;
  }

  private actualizarMapa(buses: BusEnRuta[]) {
    this.buses = buses;
    this.busesConIncidente = buses.filter(b => b.estado === 'incidente' || b.estaRetrasado);

    // 💥 CORRECCIÓN DE FUGA DE MEMORIA: Limpieza de unidades obsoletas o inactivas
    const idsServidor = new Set(buses.map(b => b.busId));
    this.marcadores.forEach((marker, busId) => {
      if (!idsServidor.has(busId)) {
        marker.remove(); // Remueve el marcador del mapa Leaflet
        this.marcadores.delete(busId); // Lo elimina de la memoria de la aplicación
      }
    });

    // Renderizado e inserción de marcadores activos
    buses.forEach(bus => {
      const esIncidente = bus.estado === 'incidente';
      
      const icono = L.divIcon({
        html: `
          <div class="flex flex-col items-center justify-center rounded-lg px-2 py-1 border shadow-md font-bold text-xs transition-all duration-300 ${
            esIncidente 
              ? 'bg-red-500 border-red-700 text-white animate-bounce' 
              : 'bg-green-600 border-green-800 text-white'
          }">
            <span>🚌 ${bus.placa}</span>
          </div>`,
        className: '', 
        iconSize: [85, 32],
      });

      if (this.marcadores.has(bus.busId)) {
        const marker = this.marcadores.get(bus.busId)!;
        marker.setLatLng([bus.latitude, bus.longitude]);
        marker.setIcon(icono); 
        marker.setPopupContent(this.construirPopup(bus));
      } else {
        const marker = L.marker([bus.latitude, bus.longitude], { icon: icono })
          .bindPopup(this.construirPopup(bus))
          .addTo(this.mapa);
        this.marcadores.set(bus.busId, marker);
      }
    });

    if (this.primeraCarga && buses.length > 0) {
      if (buses.length === 1) {
        this.mapa.setView([buses[0].latitude, buses[0].longitude], 15);
      } else {
        // Encuadra TODOS los buses activos para que ninguno quede fuera de cuadro
        const bounds = L.latLngBounds(
          buses.map(b => [b.latitude, b.longitude] as [number, number]),
        );
        this.mapa.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
      this.primeraCarga = false;
    }
  }

  private construirPopup(bus: BusEnRuta): string {
    const esIncidente = bus.estado === 'incidente';
    // Se asegura de desplegar el nombre por defecto de manera limpia ante fallas de red
    const nombreParadero = bus.paraderoMasCercano.nombre || 'En tránsito';
    const distancia = bus.paraderoMasCercano.distanciaMetros || 0;

    return `
      <div style="min-width:210px; font-size:13px; font-family: sans-serif; line-height: 1.4;">
        <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
          <strong>🚌 Placa: ${bus.placa}</strong>
          <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; background-color: ${esIncidente ? '#EF4444' : '#10B981'}">
            ${esIncidente ? 'INCIDENTE' : 'OPERANDO'}
          </span>
        </div>
        📍 <b>Próximo paradero:</b> ${nombreParadero}<br>
        📏 <b>Distancia:</b> ${distancia} m<br>
        ⏱️ <b>Arribo estimado:</b> <strong>${bus.tiempoEstimadoLlegada} min</strong><br>
        🚦 <b>Velocidad:</b> ${bus.velocidad} km/h<br>
        <hr style="margin: 6px 0; border: 0; border-top: 1px solid #E5E7EB;">
        ${esIncidente
          ? `<span style="color:#DC2626; font-weight: bold;">⚠️ Alerta / Retraso en Operación</span>`
          : '<span style="color:#16A34A; font-weight: medium;">✅ Horario Regulado Activo</span>'}
      </div>`;
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
    this.mapa?.remove();
  }
}