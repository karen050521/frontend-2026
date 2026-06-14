import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet'; 
import { RutaService } from '../../../core/services/ruta.service';
import { ChatSocketService } from '../../../core/services/chat-socket.service';
import { ToastService } from '../../../core/services/toast.service';
import { RutaLista } from '../../../core/models/ruta.model';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citizen-dashboard.component.html',
  styleUrl: './citizen-dashboard.component.css',
})
export class CitizenDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapaFijo') mapElement!: ElementRef;
  private map!: L.Map;
  
  private rutaService = inject(RutaService);
  private chatSocketService = inject(ChatSocketService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  private rutaLayer: L.Polyline | null = null;
  private busMarker: L.Marker | null = null;
  private busSubscription?: Subscription;

  protected modoActual = signal<'rutas' | 'paraderos' | null>(null);
  protected routes = signal<RutaLista[]>([]);
  protected isLoadingRoutes = signal<boolean>(false);
  protected saldo = signal<number>(45250); 
  protected recentTrips = signal<any[]>([]);

  ngOnInit(): void {
    this.loadRoutes();
    this.loadRecentTrips();
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement).setView([5.06889, -75.51738], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    setTimeout(() => { this.map.invalidateSize(); }, 400);
  }

  protected loadRoutes(): void {
    this.isLoadingRoutes.set(true);
    this.rutaService.obtenerRutas().subscribe({
      next: (response: any) => {
        const rutasReales = response.data ? response.data : response;
        this.routes.set(rutasReales || []);
        this.isLoadingRoutes.set(false);
      },
      error: () => {
        this.toastService.error('No se pudieron cargar las rutas');
        this.isLoadingRoutes.set(false);
      },
    });
  }

  protected seleccionarRuta(ruta: any): void {
    this.toastService.info(`Conectando con ruta ${ruta.nombre}...`);
    if (this.rutaLayer) this.map.removeLayer(this.rutaLayer);
    this.busSubscription?.unsubscribe();

    this.busSubscription = this.chatSocketService.escucharActualizaciones().subscribe((data: any) => {
      this.actualizarPosicionBus(data.latitud, data.longitud, data.placa, data.estado);
    });

    const coordenadas: L.LatLngExpression[] = [[5.06889, -75.51738], [5.06500, -75.51000]];
    this.rutaLayer = L.polyline(coordenadas, { color: '#ec4899', weight: 5 }).addTo(this.map);
    this.map.fitBounds(this.rutaLayer.getBounds());
  }

  private actualizarPosicionBus(lat: number, lng: number, placa: string, estado: string): void {
    const latlng: L.LatLngExpression = [lat, lng];
    const colorIcon = estado === 'incidente' ? '🔴' : '🟢';
    
    if (!this.busMarker) {
      const busIcon = L.divIcon({ 
        html: `<div style="font-size: 20px; font-weight: bold;">🚌 ${colorIcon} ${placa}</div>`, 
        className: 'bus-marker' 
      });
      this.busMarker = L.marker(latlng, { icon: busIcon }).addTo(this.map);
    } else {
      this.busMarker.setLatLng(latlng);
    }
  }

  // MÉTODO QUE FALTABA
  protected comprarBoleto(route: RutaLista): void {
    this.toastService.info(`Boleto para ${route.nombre} seleccionado.`);
    // Lógica adicional de compra aquí
  }

  protected activarModoRutas(): void { this.modoActual.set('rutas'); }
  protected activarModoParaderos(): void { this.modoActual.set('paraderos'); }
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  }
  protected loadRecentTrips(): void {
    this.recentTrips.set([{ id: 1, route: 'Centro - Aeropuerto', date: '2024-05-12', fare: 8500, status: 'Completado' }]);
  }
  protected iniciarRecarga(): void { this.router.navigate(['/recarga']); }

  ngOnDestroy(): void {
    this.busSubscription?.unsubscribe();
    if (this.map) this.map.remove();
  }
}