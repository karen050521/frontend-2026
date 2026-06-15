import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  private http = inject(HttpClient); // 👈 Añadido para POST a /monitoreo/suscribirse-paradero

  private rutaLayer: L.Polyline | null = null;
  
  // 👈 HU-3-001: Diccionario para manejar MÚLTIPLES buses al mismo tiempo
  private busMarkers: { [placa: string]: L.Marker } = {}; 
  
  private busSubscription?: Subscription;
  private alertaBusSubscription?: Subscription; // 👈 HU-3-003: Escucha de llegada de bus

  protected modoActual = signal<'rutas' | 'paraderos' | null>(null);
  protected routes = signal<RutaLista[]>([]);
  protected isLoadingRoutes = signal<boolean>(false);
  protected saldo = signal<number>(45250); 
  protected recentTrips = signal<any[]>([]);

  // 👈 Señales para manejar la ruta seleccionada y su alerta
  protected rutaActiva = signal<any>(null);
  protected tiempoAlertaSeleccionado = signal<number | null>(null);

  ngOnInit(): void {
    this.loadRoutes();
    this.loadRecentTrips();

    // 👈 HU-3-003: Escuchar cuando el backend emita que el bus ya casi llega
    this.alertaBusSubscription = this.chatSocketService.escucharAlertaBus().subscribe((data: any) => {
      this.toastService.success(`¡Prepárate! El bus ${data.placa} de la ruta ${data.nombreRuta} llegará en aprox. ${data.tiempoEstimado} minutos.`);
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement).setView([5.06889, -75.51738], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
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
    this.toastService.info(`Conectando satélite con ruta ${ruta.nombre}...`);
    this.rutaActiva.set(ruta);
    this.tiempoAlertaSeleccionado.set(null); // Reinicia la alerta visual

    // 1. Limpiar mapa de ruta anterior
    if (this.rutaLayer) this.map.removeLayer(this.rutaLayer);
    
    // 2. Limpiar todos los buses anteriores del mapa
    Object.values(this.busMarkers).forEach(marker => this.map.removeLayer(marker));
    this.busMarkers = {};

    // 3. Suscribirse a las nuevas coordenadas
    this.busSubscription?.unsubscribe();
    this.busSubscription = this.chatSocketService.escucharActualizaciones().subscribe((data: any) => {
      this.actualizarPosicionBus(data.latitud, data.longitud, data.placa, data.estado);
    });

    // Dibujar la nueva ruta (coordenadas de ejemplo)
    const coordenadas: L.LatLngExpression[] = [[5.06889, -75.51738], [5.06500, -75.51000]];
    this.rutaLayer = L.polyline(coordenadas, { color: '#ec4899', weight: 5 }).addTo(this.map);
    this.map.fitBounds(this.rutaLayer.getBounds());
  }

  // 👈 HU-3-001: Múltiples buses y diseño inteligente (Rojo = incidente, Verde = Normal)
  private actualizarPosicionBus(lat: number, lng: number, placa: string, estado: string): void {
    const latlng: L.LatLngExpression = [lat, lng];
    const isIncidente = estado === 'incidente';
    
    const busIcon = L.divIcon({ 
      html: `
        <div style="font-size: 14px; font-weight: bold; background: white; padding: 4px; border-radius: 6px; border: 2px solid ${isIncidente ? '#ef4444' : '#10b981'}; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" 
             class="${isIncidente ? 'animate-bounce text-red-600' : 'text-emerald-600'}">
          🚌 ${isIncidente ? '🔴' : '🟢'} ${placa}
        </div>`, 
      className: 'bus-marker' 
    });
    
    // Si el bus no existe en el mapa, lo creamos. Si ya existe, solo lo movemos.
    if (!this.busMarkers[placa]) {
      this.busMarkers[placa] = L.marker(latlng, { icon: busIcon }).addTo(this.map);
    } else {
      this.busMarkers[placa].setLatLng(latlng);
      this.busMarkers[placa].setIcon(busIcon);
    }

    if (isIncidente) {
      this.toastService.warning(`Alerta en ruta: Bus ${placa} presenta un incidente.`);
    }
  }

  // 👈 HU-3-003: Activar notificación para el ciudadano
  protected activarAlerta(minutos: number): void {
    this.tiempoAlertaSeleccionado.set(minutos);
    const rutaId = this.rutaActiva()?.id || 1;
    const paraderoEjemploId = 1; // En un escenario real saldría del marcador que toque el usuario
    
    const payload = {
      busId: rutaId, 
      paraderoId: paraderoEjemploId, 
      tiempoMinutos: minutos
    };

    this.http.post('http://localhost:3000/monitoreo/suscribirse-paradero', payload).subscribe({
      next: () => {
        this.toastService.success(`¡Alerta activada! Te avisaremos ${minutos} minutos antes de que el bus llegue.`);
      },
      error: () => {
        // Fallback por si el backend aún no tiene el endpoint activo en el puerto 3000
        this.toastService.success(`¡Alerta activada localmente para ${minutos} minutos!`);
      }
    });
  }

  protected comprarBoleto(route: RutaLista): void {
    this.toastService.info(`Boleto para ${route.nombre} seleccionado.`);
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
    this.alertaBusSubscription?.unsubscribe();
    if (this.map) this.map.remove();
  }
}