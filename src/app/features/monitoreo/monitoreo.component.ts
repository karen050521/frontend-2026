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
  busesRetrasados: BusEnRuta[] = [];
  paraderos: any[] = [];
  paraderoSeleccionadoId: number | null = null;
  etaPersonalizado: number | null = null;
  cargando = true;

  private mapa!: L.Map;
  private marcadores = new Map<number, L.Marker>();
  private pollingSubscription!: Subscription;
  private primeraCarga = true;
  private apiUrl = environment.apiBaseUrl;

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
    this.mapa = L.map('mapa-monitoreo').setView([4.7110, -74.0721], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
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
        console.error('Error cargando buses:', err);
      },
    });
  }

  private iniciarPolling() {
    this.pollingSubscription = this.monitoreoService
      .getBusesActivosPolling(this.rutaId)
      .subscribe({
        next: (resp: { data: BusEnRuta[] }) => this.actualizarMapa(resp.data),
        error: (err: Error) => console.error('Error en polling:', err),
      });
  }

  private cargarParaderos() {
    this.http.get<any>(`${this.apiUrl}/ruta/${this.rutaId}/paraderos`).subscribe({
      next: (resp: any) => {
        this.paraderos = resp.data ?? resp ?? [];
      },
      error: () => { this.paraderos = []; }
    });
  }

  consultarEtaPersonal(busId: number) {
    if (!this.paraderoSeleccionadoId) return;
    this.monitoreoService
      .getEtaParaParadero(busId, this.paraderoSeleccionadoId)
      .subscribe({
        next: (resp: { eta: number; distanciaKm: number }) => {
          this.etaPersonalizado = resp.eta;
        },
        error: (err: Error) => console.error('Error ETA:', err),
      });
  }

  seleccionarParadero(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.paraderoSeleccionadoId = valor ? Number(valor) : null;
    this.etaPersonalizado = null;
  }

  private actualizarMapa(buses: BusEnRuta[]) {
    this.buses = buses;
    this.busesRetrasados = buses.filter(b => b.estaRetrasado);

    buses.forEach(bus => {
      const icono = L.divIcon({
        html: `<div class="bus-marker ${bus.estaRetrasado ? 'retrasado' : ''}">
                 🚌 <small>${bus.placa}</small>
               </div>`,
        className: '',
        iconSize: [70, 36],
      });

      if (this.marcadores.has(bus.busId)) {
        this.marcadores.get(bus.busId)!.setLatLng([bus.latitude, bus.longitude]);
        this.marcadores.get(bus.busId)!.setPopupContent(this.construirPopup(bus));
      } else {
        const marker = L.marker([bus.latitude, bus.longitude], { icon: icono })
          .bindPopup(this.construirPopup(bus))
          .addTo(this.mapa);
        this.marcadores.set(bus.busId, marker);
      }
    });

    if (this.primeraCarga && buses.length > 0) {
      this.mapa.setView([buses[0].latitude, buses[0].longitude], 14);
      this.primeraCarga = false;
    }
  }

  private construirPopup(bus: BusEnRuta): string {
    return `
      <div style="min-width:180px; font-size:13px;">
        <strong>🚌 ${bus.placa}</strong><br>
        📍 ${bus.paraderoMasCercano.nombre}<br>
        📏 ${bus.paraderoMasCercano.distanciaMetros}m del paradero<br>
        ⏱️ Llega en <strong>${bus.tiempoEstimadoLlegada} min</strong><br>
        🚦 ${bus.velocidad} km/h<br>
        ${bus.estaRetrasado
          ? `<span style="color:red">⚠️ Retrasado ${bus.minutosRetraso} min</span>`
          : '<span style="color:green">✅ A tiempo</span>'}
      </div>`;
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
    this.mapa?.remove();
  }
}