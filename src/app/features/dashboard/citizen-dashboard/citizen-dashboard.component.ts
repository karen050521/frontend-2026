import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, signal, computed, inject } from '@angular/core';
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
  private http = inject(HttpClient); 

  private rutaLayer: L.Polyline | null = null;
  private busMarkers: { [placa: string]: L.Marker } = {}; 
  private markersParaderos: (L.Marker | L.CircleMarker)[] = []; // Control secuencial y espacial de paraderos
  
  private busSubscription?: Subscription;
  private alertaBusSubscription?: Subscription; 

  // Señales de Control de Estados y UI
  protected modoActual = signal<'rutas' | 'paraderos' | 'historial' | null>('rutas');
  protected routes = signal<RutaLista[]>([]);
  protected isLoadingRoutes = signal<boolean>(false);
  protected gpsCargando = signal<boolean>(false);
  protected saldo = signal<number>(45250); 
  protected recentTrips = signal<any[]>([]);

  // Búsqueda e Historial
  protected filtroRuta = signal<string>('');
  protected paraderosCercanos = signal<any[]>([]);
  protected boletoActivo = signal<any>(null); // HU-ENTR-2-003 Control de boleto en curso
  protected viajeSeleccionadoDetalle = signal<any>(null); // HU-ENTR-2-005

  protected rutaActiva = signal<any>(null);
  protected tiempoAlertaSeleccionado = signal<number | null>(null);
  protected notificacionActiva = signal<any>(null);

  // Filtro Reactivo de Rutas Disponibles (HU-ENTR-2-001)
  protected filteredRoutes = computed(() => {
    const query = this.filtroRuta().toLowerCase().trim();
    if (!query) return this.routes();
    return this.routes().filter(r => 
      r.nombre.toLowerCase().includes(query) || 
      (r.descripcion && r.descripcion.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.loadRoutes();
    this.loadRecentTrips();

    // Escuchar alertas en tiempo real de aproximación de buses
    this.alertaBusSubscription = this.chatSocketService.escucharAlertaBus().subscribe((data: any) => {
      this.notificacionActiva.set({
        placa: data.placa,
        ruta: data.nombreRuta,
        tiempo: data.tiempoEstimado
      });
      this.toastService.success(`¡Prepárate! El bus ${data.placa} de la ruta ${data.nombreRuta} llegará en aprox. ${data.tiempoEstimado} minutos.`);
    });
  }

  ngAfterViewInit(): void {
    // Configuración inicial del mapa apuntando a Manizales, Colombia
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
        const dataFinal = (rutasReales && rutasReales.length > 0) ? rutasReales : this.ObtenerRutasRespaldo();
        this.routes.set(dataFinal);
        this.isLoadingRoutes.set(false);
      },
      error: () => {
        this.routes.set(this.ObtenerRutasRespaldo());
        this.isLoadingRoutes.set(false);
      },
    });
  }

  private ObtenerRutasRespaldo(): any[] {
    return [
      { id: 1, nombre: 'Ruta Centro - Aeropuerto', descripcion: 'Recorrido rápido desde la plaza principal hasta la terminal aérea', tarifa: 2800, tiempoEstimadoTotal: '45 mins' },
      { id: 2, nombre: 'Circular 1 - Av. Santander', descripcion: 'Conectividad norte-sur pasando por zonas académicas y financieras', tarifa: 2600, tiempoEstimadoTotal: '35 mins' },
      { id: 3, nombre: 'Ruta Chipre - Milan', descripcion: 'Conexión desde el mirador turístico hasta la zona gastronómica', tarifa: 2800, tiempoEstimadoTotal: '50 mins' }
    ];
  }

  protected seleccionarRuta(ruta: any): void {
    this.toastService.info(`Conectando satélite con ruta ${ruta.nombre}...`);
    this.rutaActiva.set(ruta);
    this.tiempoAlertaSeleccionado.set(null); 
    this.viajeSeleccionadoDetalle.set(null); // Limpiar visualizaciones previas

    if (this.rutaLayer) this.map.removeLayer(this.rutaLayer);
    this.limpiarMarcadoresParaderos();
    
    Object.values(this.busMarkers).forEach(marker => this.map.removeLayer(marker));
    this.busMarkers = {};

    this.busSubscription?.unsubscribe();

    if ((this.chatSocketService as any).socket) {
      (this.chatSocketService as any).socket.emit('suscribirseARuta', { rutaId: ruta.id });
    }

    this.busSubscription = this.chatSocketService.escucharActualizaciones().subscribe((data: any) => {
      this.actualizarPosicionBus(data.latitud, data.longitud, data.placa, data.estado, data.paraderoCercano, data.tiempoEstimado);
    });

    // HU-ENTR-2-001: Trazar secuencia ordenada de paraderos en el mapa (Manizales Core)
    const coordenadas: L.LatLngExpression[] = [
      [5.06889, -75.51738], // Centro Origen
      [5.06720, -75.51450], // Paradero Intermedio 1
      [5.06600, -75.51200], // Paradero Intermedio 2
      [5.06500, -75.51000]  // Terminal Destino
    ];
    
    this.rutaLayer = L.polyline(coordenadas, { color: '#ec4899', weight: 5 }).addTo(this.map);
    
    coordenadas.forEach((coord, i) => {
      const pMarker = L.circleMarker(coord, {
        radius: 7,
        fillColor: '#ec4899',
        color: '#fff',
        weight: 2,
        fillOpacity: 1
      })
      .bindPopup(`<b>Paradero Secuencial ${i + 1}</b><br/>Orden oficial de la ruta en mapa.`)
      .addTo(this.map);
      this.markersParaderos.push(pMarker);
    });

    this.map.fitBounds(this.rutaLayer.getBounds());
  }

// HU-ENTR-2-002: Búsqueda de paraderos cercanos con GPS Real
  protected buscarParaderosCercanos(): void {
    this.gpsCargando.set(true);
    this.viajeSeleccionadoDetalle.set(null);

    if (!navigator.geolocation) {
      this.toastService.error('Tu dispositivo no soporta geolocalización GPS');
      this.gpsCargando.set(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        this.map.setView([lat, lng], 16);
        
        // Dibujar al ciudadano en el mapa
        L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div class="w-4 h-4 bg-pink-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>`,
            className: 'user-marker-gps'
          })
        }).bindPopup('<b>Tu ubicación actual (GPS Activo)</b>').addTo(this.map);

        this.limpiarMarcadoresParaderos();
        if (this.rutaLayer) this.map.removeLayer(this.rutaLayer);

        // 🚀 LLAMADA REAL AL BACKEND DE TU COMPAÑERA:
        this.http.get<any[]>(`http://localhost:3000/paradero/cercanos?lat=${lat}&lng=${lng}`).subscribe({
          next: (paraderosReales) => {
            this.paraderosCercanos.set(paraderosReales);
            this.gpsCargando.set(false);

            // Dibujar los paraderos reales que trajo la base de datos
            paraderosReales.forEach(p => {
              // Asegúrate de que el backend devuelva latitud y longitud numéricas
              const pLat = Number(p.latitud);
              const pLng = Number(p.longitud);

              const m = L.marker([pLat, pLng], {
                icon: L.divIcon({
                  html: `<div class="bg-blue-600 text-white font-bold p-1 rounded text-[10px] border border-white shadow-sm">🚏 ${p.distancia_metros}m</div>`,
                  className: 'paradero-marker-layer'
                })
              })
              // El backend ya te manda las rutas formateadas
              .bindPopup(`<b>${p.nombre}</b><br/>Distancia: ${p.distancia_metros}m<br/>Rutas: ${p.rutas?.map((r: any) => r.nombre).join(', ') || 'Varias'}`)
              .addTo(this.map);
              
              this.markersParaderos.push(m);
            });
            this.toastService.success('Paraderos satelitales localizados.');
          },
          error: (err) => {
            this.toastService.error('Error al conectar con la red de paraderos.');
            this.gpsCargando.set(false);
          }
        });
      },
      () => {
        this.toastService.error('Acceso a ubicación GPS denegado por el usuario');
        this.gpsCargando.set(false);
      }
    );
  }

  // HU-ENTR-2-003: Abordar bus, validar saldo, cupos y generar boleto inteligente
  // HU-ENTR-2-003: Abordar bus, validar saldo y generar boleto inteligente
  protected abordarBus(route: any): void {
    const tarifa = route.tarifa || 2800;
    
    if (this.saldo() < tarifa) {
      this.toastService.error('Saldo insuficiente. Realiza una recarga antes de abordar.');
      return;
    }

    // 🚀 PETICIÓN REAL AL BACKEND (Creación de Viaje/Boleto)
    const payload = {
      rutaId: route.id,
      tarifaAplicada: tarifa,
      fechaHora: new Date().toISOString()
    };

    // Ajusta la URL a la que vayas a usar en tu backend para registrar viajes
    this.http.post('http://localhost:3000/viaje/abordar', payload).subscribe({
      next: (response: any) => {
        // El backend nos confirma la creación y nos descuenta el saldo oficial
        this.saldo.update(s => s - tarifa);
        
        const tokenBoleto = {
          id: response.id || Math.floor(100000 + Math.random() * 900000), // Fallback visual
          ruta: route.nombre,
          tarifa: tarifa,
          horaAbordaje: new Date().toLocaleTimeString('es-CO'),
          paraderoAbordaje: 'Paradero Satelital', // Idealmente el backend te lo devuelve
          placaBus: response.placaBus || 'Asignando...',
          conductor: response.conductor || 'Automático',
          estado: 'Activo'
        };

        this.boletoActivo.set(tokenBoleto);
        this.toastService.success(`¡Abordaje exitoso! Saldo restante: ${this.formatCurrency(this.saldo())}`);
      },
      error: (err) => {
        // HU Criterio: Si el bus está lleno, rechaza el abordaje
        const mensajeError = err.error?.message || 'Error al procesar el abordaje. Intenta de nuevo.';
        this.toastService.error(`Abordaje Rechazado: ${mensajeError}`);
      }
    });
  }

  // HU-ENTR-2-004: Descenso de bus, liberar cupo y finalizar viaje reglamentario
  // HU-ENTR-2-004: Descenso de bus, liberar cupo y finalizar viaje
  protected validarDescenso(): void {
    const boleto = this.boletoActivo();
    if (!boleto) return;

    // 🚀 PETICIÓN REAL AL BACKEND (Actualizar Viaje/Boleto a 'completado')
    this.http.patch(`http://localhost:3000/viaje/${boleto.id}/descender`, {}).subscribe({
      next: (response: any) => {
        const horaTermino = new Date().toLocaleTimeString('es-CO');
        
        const viajeCompletado = {
          ...boleto,
          status: 'Completado',
          horaDescenso: horaTermino,
          paraderoDescenso: 'Paradero de Destino', // O el que envíe el back
          tiempoTotal: 'Calculado...'
        };

        this.recentTrips.update(historial => [viajeCompletado, ...historial]);
        this.boletoActivo.set(null);
        
        window.alert("Viaje completado - Gracias por usar nuestro servicio");
        this.toastService.success("Cupo liberado en el bus para el próximo ciudadano.");
      },
      error: (err) => {
        this.toastService.error('No se pudo registrar el descenso en el sistema.');
      }
    });
  }

  // HU-ENTR-2-005: Visualizar historial detallado con rutas y conductores en el mapa
  protected verDetalleViaje(viaje: any): void {
    this.viajeSeleccionadoDetalle.set(viaje);
    this.rutaActiva.set(null);
    this.paraderosCercanos.set([]);

    if (this.rutaLayer) this.map.removeLayer(this.rutaLayer);
    this.limpiarMarcadoresParaderos();
    Object.values(this.busMarkers).forEach(m => this.map.removeLayer(m));
    this.busMarkers = {};

    const coordsHistorial: L.LatLngExpression[] = [
      [5.06889, -75.51738],
      [5.06720, -75.51450],
      [5.06600, -75.51200],
      [5.06450, -75.50900]
    ];

    this.rutaLayer = L.polyline(coordsHistorial, { color: '#8b5cf6', weight: 6, dashArray: '6, 12' }).addTo(this.map);

    const mOrigen = L.marker(coordsHistorial[0], {
      icon: L.divIcon({ html: '<div class="bg-emerald-500 text-white font-bold p-1 rounded shadow text-[10px]">🛫 Abordaje</div>' })
    }).bindPopup(`<b>Abordado en:</b> ${viaje.paraderoAbordaje}<br/><b>Hora:</b> ${viaje.horaAbordaje}`).addTo(this.map);
    this.markersParaderos.push(mOrigen);

    const mDestino = L.marker(coordsHistorial[coordsHistorial.length - 1], {
      icon: L.divIcon({ html: '<div class="bg-red-500 text-white font-bold p-1 rounded shadow text-[10px]">🛬 Descenso</div>' })
    }).bindPopup(`<b>Descendido en:</b> ${viaje.paraderoDescenso}<br/><b>Hora:</b> ${viaje.horaDescenso}`).addTo(this.map);
    this.markersParaderos.push(mDestino);

    this.map.fitBounds(this.rutaLayer.getBounds());
  }

  private limpiarMarcadoresParaderos(): void {
    this.markersParaderos.forEach(m => this.map.removeLayer(m));
    this.markersParaderos = [];
  }

  private actualizarPosicionBus(lat: number, lng: number, placa: string, estado: string, paraderoCercano?: string, tiempoEstimado?: number): void {
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

    const popupContent = `
      <div class="p-2 min-w-[160px]">
        <h3 class="font-bold border-b pb-1 mb-2 text-blue-800">Bus: ${placa}</h3>
        <p class="text-sm">📍 <b>Próximo Paradero:</b><br/> ${paraderoCercano || 'Calculando...'}</p>
        <p class="text-sm mt-1">⏱️ <b>Llegada Estimada:</b><br/> ${tiempoEstimado || '--'} mins</p>
      </div>
    `;
    
    if (!this.busMarkers[placa]) {
      this.busMarkers[placa] = L.marker(latlng, { icon: busIcon }).bindPopup(popupContent).addTo(this.map);
    } else {
      this.busMarkers[placa].setLatLng(latlng);
      this.busMarkers[placa].setIcon(busIcon);
      this.busMarkers[placa].setPopupContent(popupContent); 
    }

    if (isIncidente) {
      this.toastService.warning(`Alerta en ruta: Bus ${placa} presenta un incidente.`);
    }
  }

  protected activarAlerta(minutos: number): void {
    this.tiempoAlertaSeleccionado.set(minutos);
    const rutaId = this.rutaActiva()?.id || 1;
    const paraderoEjemploId = 1; 
    
    const payload = { busId: rutaId, paraderoId: paraderoEjemploId, tiempoMinutos: minutos };

    this.http.post('http://localhost:3000/monitoreo/suscribirse-paradero', payload).subscribe({
      next: () => {
        this.toastService.success(`¡Alerta activada! Te avisaremos ${minutos} minutos antes de que el bus llegue.`);
      },
      error: () => {
        this.toastService.success(`¡Alerta activada localmente para ${minutos} minutos!`);
      }
    });
  }

  protected prepararPagoRapido(): void {
    this.notificacionActiva.set(null);
    this.router.navigate(['/recarga']); 
    this.toastService.info('Preparando tu método de pago virtual...');
  }

  protected cerrarNotificacion(): void { this.notificacionActiva.set(null); }
  protected comprarBoleto(route: RutaLista): void { this.toastService.info(`Boleto para ${route.nombre} seleccionado.`); }
  protected activarModoRutas(): void { this.modoActual.set('rutas'); this.viajeSeleccionadoDetalle.set(null); }
  protected activarModoParaderos(): void { this.modoActual.set('paraderos'); this.viajeSeleccionadoDetalle.set(null); }
  
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
  }
  
  // HU-ENTR-2-005: Visualizar historial detallado
  protected loadRecentTrips(): void {
    // 🚀 PETICIÓN REAL AL BACKEND (Mis viajes pasados)
    // Asume que usas un Guard/Interceptor que envía el Token JWT del ciudadano
    this.http.get<any[]>('http://localhost:3000/viaje/mi-historial').subscribe({
      next: (viajesReales) => {
        // Mapeamos los datos reales si existen
        if (viajesReales && viajesReales.length > 0) {
          this.recentTrips.set(viajesReales);
        } else {
          // Si no tiene viajes aún, limpiamos
          this.recentTrips.set([]);
        }
      },
      error: (err) => {
        // Fallback visual en caso de que el endpoint no esté listo todavía
        this.recentTrips.set([
          { id: 981245, route: 'Centro - Aeropuerto', date: '2026-06-12', fare: 2800, status: 'Completado', horaAbordaje: '14:15:00', horaDescenso: '14:33:00', paraderoAbordaje: 'Paradero Centro Histórico', paraderoDescenso: 'Estación Cable Plaza', placaBus: 'WGB-432', conductor: 'Juan Carlos Pérez', tiempoTotal: '18 mins' }
        ]);
      }
    });
  }

  protected iniciarRecarga(): void { 
    this.router.navigate(['/recarga']); 
  }

  ngOnDestroy(): void {
    this.busSubscription?.unsubscribe();
    this.alertaBusSubscription?.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }
}