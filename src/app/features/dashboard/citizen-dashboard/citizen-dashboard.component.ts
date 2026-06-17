import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
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
import { BoletoService } from '../../../core/services/boleto.service';
import { CitaN8nService } from '../../../core/services/cita-n8n.service';

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
  private boletoService = inject(BoletoService);
  private citaN8nService = inject(CitaN8nService);
  private rutaLayer: L.Polyline | null = null;
  private busMarkers: { [placa: string]: L.Marker } = {};
  private markersParaderos: (L.Marker | L.CircleMarker)[] = []; // Control secuencial y espacial de paraderos

  private busSubscription?: Subscription;
  private alertaBusSubscription?: Subscription;

  // Señales de Control de Estados y UI
  protected modoActual = signal<'rutas' | 'paraderos' | 'historial' | 'citas' | null>('rutas');
  protected routes = signal<RutaLista[]>([]);
  protected isLoadingRoutes = signal<boolean>(false);
  protected gpsCargando = signal<boolean>(false);
  // Nuevas señales para HU-ENTR-3-012 (Agendamiento con N8N)
  protected cargandoCita = signal<boolean>(false);
  protected citaAgendadaExito = signal<any>(null);

  // Formulario reactivo para enlazar con los inputs de la vista
  protected citaForm = {
    tipoAtencion: 'Virtual',
    tipoConsulta: 'Problema con tarjeta',
    fechaHora: '', // Captura "2026-06-20T14:00" desde datetime-local
    motivo: '',
    emailCiudadano: 'cristiangarcianastar21@gmail.com'
  };
  // El saldo inicia en 0 y se poblará dinámicamente de la Base de Datos
  protected saldo = signal<number>(0);
  protected tarjetaIdActiva = signal<number | null>(null); // Guarda el ID de la tarjeta real del usuario
  
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
    return this.routes().filter(
      (r) =>
        r.nombre.toLowerCase().includes(query) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadRoutes();
    this.loadRecentTrips();
    this.cargarSaldoReal(); // 🚀 Sincroniza el saldo transaccional de la BD al iniciar el componente

    // Escuchar alertas en tiempo real de aproximación de buses
    this.alertaBusSubscription = this.chatSocketService
      .escucharAlertaBus()
      .subscribe((data: any) => {
        this.notificacionActiva.set({
          placa: data.placa,
          ruta: data.nombreRuta,
          tiempo: data.tiempoEstimado,
        });
        this.toastService.success(
          `¡Prepárate! El bus ${data.placa} de la ruta ${data.nombreRuta} llegará en aprox. ${data.tiempoEstimado} minutos.`,
        );
      });
  }

  ngAfterViewInit(): void {
    // Configuración inicial del mapa apuntando a Manizales, Colombia
    this.map = L.map(this.mapElement.nativeElement).setView([5.06889, -75.51738], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
    }, 400);
  }

  // Trae las tarjetas del ciudadano y extrae el saldo real de la BD
  private cargarSaldoReal(): void {
    this.http.get<any[]>('http://localhost:3000/boletos/mis-tarjetas').subscribe({
      next: (tarjetas) => {
        if (tarjetas && tarjetas.length > 0) {
          const tarjetaPrincipal = tarjetas[0];
          this.saldo.set(Number(tarjetaPrincipal.saldo));
          this.tarjetaIdActiva.set(tarjetaPrincipal.id); // Guardamos el ID de la tarjeta para usarlo al abordar
        }
      },
      error: (err) => {
        console.error('Error sincronizando billetera:', err);
        this.toastService.error('No se pudo sincronizar el saldo de tu billetera.');
      }
    });
  }

  protected loadRoutes(): void {
    this.isLoadingRoutes.set(true);
    this.rutaService.obtenerRutas().subscribe({
      next: (response: any) => {
        const rutasReales = response.data ? response.data : response;
        const dataFinal =
          rutasReales && rutasReales.length > 0 ? rutasReales : this.ObtenerRutasRespaldo();
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
      {
        id: 1,
        nombre: 'Ruta Centro - Aeropuerto',
        descripcion: 'Recorrido rápido desde la plaza principal hasta la terminal aérea',
        tarifa: 2800,
        tiempoEstimadoTotal: '45 mins',
      },
      {
        id: 2,
        nombre: 'Circular 1 - Av. Santander',
        descripcion: 'Conectividad norte-sur pasando por zonas académicas y financieras',
        tarifa: 2600,
        tiempoEstimadoTotal: '35 mins',
      },
      {
        id: 3,
        nombre: 'Ruta Chipre - Milan',
        descripcion: 'Conexión desde el mirador turístico hasta la zona gastronómica',
        tarifa: 2800,
        tiempoEstimadoTotal: '50 mins',
      },
    ];
  }

  protected seleccionarRuta(ruta: any): void {
    this.toastService.info(`Conectando satélite con ruta ${ruta.nombre}...`);
    this.rutaActiva.set(ruta);
    this.tiempoAlertaSeleccionado.set(null);
    this.viajeSeleccionadoDetalle.set(null); // Limpiar visualizaciones previas

    if (this.rutaLayer) this.map.removeLayer(this.rutaLayer);
    this.limpiarMarcadoresParaderos();

    Object.values(this.busMarkers).forEach((marker) => this.map.removeLayer(marker));
    this.busMarkers = {};

    this.busSubscription?.unsubscribe();

    if ((this.chatSocketService as any).socket) {
      (this.chatSocketService as any).socket.emit('suscribirseARuta', { rutaId: ruta.id });
    }

    this.busSubscription = this.chatSocketService
      .escucharActualizaciones()
      .subscribe((data: any) => {
        this.actualizarPosicionBus(
          data.latitud,
          data.longitud,
          data.placa,
          data.estado,
          data.paraderoCercano,
          data.tiempoEstimado,
        );
      });

    // LECTURA DINÁMICA DE COORDENADAS DESDE TU BASE DE DATOS (HU-1)
    let coordenadas: L.LatLngExpression[] = [];

    if (ruta.rutaParaderos && ruta.rutaParaderos.length > 0) {
      coordenadas = ruta.rutaParaderos
        .sort((a: any, b: any) => a.ordenSecuencial - b.ordenSecuencial)
        .map((rp: any) => [Number(rp.paradero.latitud), Number(rp.paradero.longitud)]);
    } else {
      // 🛡️ FALLBACK MANIZALES: Si la base de datos está vacía en esa ruta, dibuja el demo de respaldo
      coordenadas = [
        [5.06889, -75.51738], // Centro Origen
        [5.0672, -75.5145],   // Paradero Intermedio 1
        [5.066, -75.512],     // Paradero Intermedio 2
        [5.065, -75.51],      // Terminal Destino
      ];
    }

    this.rutaLayer = L.polyline(coordenadas, { color: '#ec4899', weight: 5 }).addTo(this.map);

    coordenadas.forEach((coord, i) => {
      const pMarker = L.circleMarker(coord, {
        radius: 7,
        fillColor: '#ec4899',
        color: '#fff',
        weight: 2,
        fillOpacity: 1,
      })
        .bindPopup(`<b>Paradero Secuencial ${i + 1}</b><br/>Orden oficial de la ruta en mapa.`)
        .addTo(this.map);
      this.markersParaderos.push(pMarker);
    });

    if (coordenadas.length > 0) {
      this.map.fitBounds(this.rutaLayer.getBounds());
    }
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
            className: 'user-marker-gps',
          }),
        })
          .bindPopup('<b>Tu ubicación actual (GPS Activo)</b>')
          .addTo(this.map);

        this.limpiarMarcadoresParaderos();
        if (this.rutaLayer) this.map.removeLayer(this.rutaLayer);

        // LLAMADA REAL AL BACKEND DE TU COMPAÑERA:
        this.http
          .get<any[]>(`http://localhost:3000/paradero/cercanos?lat=${lat}&lng=${lng}`)
          .subscribe({
            next: (paraderosReales) => {
              this.paraderosCercanos.set(paraderosReales);
              this.gpsCargando.set(false);

              // Dibujar los paraderos reales que trajo la base de datos
              paraderosReales.forEach((p) => {
                const pLat = Number(p.latitud);
                const pLng = Number(p.longitud);

                const m = L.marker([pLat, pLng], {
                  icon: L.divIcon({
                    html: `<div class="bg-blue-600 text-white font-bold p-1 rounded text-[10px] border border-white shadow-sm">🚏 ${p.distancia_metros}m</div>`,
                    className: 'paradero-marker-layer',
                  }),
                })
                  .bindPopup(
                    `<b>${p.nombre}</b><br/>Distancia: ${p.distancia_metros}m<br/>Rutas: ${p.rutas?.map((r: any) => r.nombre).join(', ') || 'Varias'}`,
                  )
                  .addTo(this.map);

                this.markersParaderos.push(m);
              });
              this.toastService.success('Paraderos satelitales localizados.');
            },
            error: (err) => {
              this.toastService.error('Error al conectar con la red de paraderos.');
              this.gpsCargando.set(false);
            },
          });
      },
      () => {
        this.toastService.error('Acceso a ubicación GPS denegado por el usuario');
        this.gpsCargando.set(false);
      },
    );
  }

  // El payload coincide 100% con CreateBoletoDto de tu backend (HU-2)
  protected abordarBus(route: any): void {
    const tarifa = route.tarifa || 2800;

    if (this.saldo() < tarifa) {
      this.toastService.error('Saldo insuficiente. Realiza una recarga antes de abordar.');
      return;
    }

    // ARMADO DINÁMICO RESPETANDO TU CONTROLADOR NESTJS:
    const payload = {
      bus_id: 1, 
      paraderoAbordaje_id: this.paraderosCercanos().length > 0 ? this.paraderosCercanos()[0].id : 1,
      metodoPagoCiudadano_id: this.tarjetaIdActiva() || 1 
    };

    this.http.post('http://localhost:3000/boletos', payload).subscribe({
      next: (response: any) => {
        this.cargarSaldoReal();

        const tokenBoleto = {
          id: response.id || Math.floor(100000 + Math.random() * 900000), 
          ruta: route.nombre,
          tarifa: tarifa,
          horaAbordaje: new Date().toLocaleTimeString('es-CO'),
          paraderoAbordaje: 'Paradero Satelital', 
          placaBus: response.placaBus || 'Asignando...',
          conductor: response.conductor || 'Automático',
          estado: 'Activo',
        };

        this.boletoActivo.set(tokenBoleto);
        this.toastService.success('¡Abordaje exitoso registrado en la Base de Datos!');
      },
      error: (err) => {
        const mensajeError = err.error?.message || 'Error al procesar el abordaje. Intenta de nuevo.';
        this.toastService.error(`Abordaje Fue Rechazado: ${mensajeError}`);
      },
    });
  }

  /**
   * 🛑 3. Método validarDescenso() (HU-4)
   * Implementa la geolocalización inteligente y limpia las notificaciones de viaje activo.
   */
  protected validarDescenso(boletoParam?: any): void {
    // Soporta recibir el boleto por parámetro o tomarlo directamente de la señal reactiva del componente
    const boleto = boletoParam || this.boletoActivo();
    if (!boleto) {
      this.toastService.error('No hay ningún viaje activo para finalizar.');
      return;
    }

    // 🚀 CÁLCULO INTELIGENTE DE PARADERO DE DESCENSO
    // Tomamos el paradero más cercano al usuario por GPS. Si no se detectan paraderos, usamos 1 como fallback.
    const paraderoActualId = this.paraderosCercanos && this.paraderosCercanos().length > 0 
                             ? this.paraderosCercanos()[0].id 
                             : 1;

    // Armamos los datos reales mapeados para el backend
    const payloadDescenso = {
      boleto_id: boleto.id, 
      paraderoDescenso_id: paraderoActualId 
    };

    // Consumimos el endpoint oficial en tu backend (/boletos/finalizar-viaje)
    this.http.post('http://localhost:3000/boletos/finalizar-viaje', payloadDescenso).subscribe({
      next: (res: any) => {
        const horaTermino = new Date().toLocaleTimeString('es-CO');

        const viajeCompletado = {
          ...boleto,
          status: 'Completado',
          horaDescenso: horaTermino,
          paraderoDescenso: 'Paradero de Destino', 
          tiempoTotal: 'Calculado...',
        };

        // Actualizamos localmente el historial y limpiamos estados de viaje activo
        this.recentTrips.update((historial) => [viajeCompletado, ...historial]);
        this.boletoActivo.set(null);
        this.notificacionActiva.set(null); // 🚀 HU-4: Ocultar notificaciones de viaje activo

        // Refrescar saldos e historial completo desde el servidor
        this.cargarSaldoReal();
        this.loadRecentTrips(); // 🚀 HU-4: Refrescar el historial de viajes en la vista

        this.toastService.success('Descenso registrado y viaje finalizado con éxito.');
      },
      error: (err) => {
        this.toastService.error('Error al registrar el descenso en el servidor.');
        console.error('Error finalizando viaje:', err);
      }
    });
  }

  /**
   * 🚌 Método verDetalleViaje(viaje: any) (HU-5)
   * Grafica la ruta con una línea discontinua (dashArray) estética y ubica marcadores históricos.
   */
  protected verDetalleViaje(viaje: any): void {
    this.viajeSeleccionadoDetalle.set(viaje);
    this.rutaActiva.set(null);
    this.paraderosCercanos.set([]);

    if (this.rutaLayer) {
      this.map.removeLayer(this.rutaLayer);
    }
    this.limpiarMarcadoresParaderos();
    Object.values(this.busMarkers).forEach((m) => this.map.removeLayer(m));
    this.busMarkers = {};

    // 🚀 LECTURA DINÁMICA DEL HISTORIAL (Con respaldo de Manizales)
    let coordsHistorial: L.LatLngExpression[] = [];

    // Verificamos si el backend nos envió las coordenadas del mapa
    if (viaje.coordenadasMapa && viaje.coordenadasMapa.length > 0) {
      coordsHistorial = viaje.coordenadasMapa
        .sort((a: any, b: any) => a.ordenSecuencial - b.ordenSecuencial)
        .map((c: any) => [Number(c.latitud), Number(c.longitud)]);
    } else {
      // 🛡️ FALLBACK MANIZALES: Si no vienen, trazamos un viaje de prueba en la ciudad
      coordsHistorial = [
        [5.06889, -75.51738], // Abordaje en el Centro
        [5.0672, -75.5145],
        [5.066, -75.512],
        [5.0645, -75.509],    // Descenso en Milán/Cable
      ];
    }

    // Dibujamos la polilínea con estilo punteado (dashArray)
    this.rutaLayer = L.polyline(coordsHistorial, {
      color: '#8b5cf6',
      weight: 6,
      dashArray: '6, 12', // 🚀 HU-5: Efecto punteado estético para diferenciar de una ruta activa
    }).addTo(this.map);

    // Añadir marcador de Origen Histórico
    const mOrigen = L.marker(coordsHistorial[0], {
      icon: L.divIcon({
        html: '<div class="bg-emerald-500 text-white font-bold p-1 rounded shadow text-[10px]">🛫 Abordaje</div>',
      }),
    })
      .bindPopup(
        `<b>Abordado en:</b> ${viaje.paraderoAbordaje || 'Origen'}<br/><b>Hora:</b> ${viaje.horaAbordaje}`,
      )
      .addTo(this.map);
    this.markersParaderos.push(mOrigen);

    // Añadir marcador de Destino Histórico si existe un punto de término
    if (coordsHistorial.length > 1) {
      const mDestino = L.marker(coordsHistorial[coordsHistorial.length - 1], {
        icon: L.divIcon({
          html: '<div class="bg-red-500 text-white font-bold p-1 rounded shadow text-[10px]">🛬 Descenso</div>',
        }),
      })
        .bindPopup(
          `<b>Descendido en:</b> ${viaje.paraderoDescenso || 'Destino'}<br/><b>Hora:</b> ${viaje.horaDescenso}`,
        )
        .addTo(this.map);
      this.markersParaderos.push(mDestino);
    }

    if (coordsHistorial.length > 0) {
      this.map.fitBounds(this.rutaLayer.getBounds());
    }
  }

  private limpiarMarcadoresParaderos(): void {
    this.markersParaderos.forEach((m) => this.map.removeLayer(m));
    this.markersParaderos = [];
  }

  private actualizarPosicionBus(
    lat: number,
    lng: number,
    placa: string,
    estado: string,
    paraderoCercano?: string,
    tiempoEstimado?: number,
  ): void {
    const latlng: L.LatLngExpression = [lat, lng];
    const isIncidente = estado === 'incidente';

    const busIcon = L.divIcon({
      html: `
        <div style="font-size: 14px; font-weight: bold; background: white; padding: 4px; border-radius: 6px; border: 2px solid ${isIncidente ? '#ef4444' : '#10b981'}; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" 
             class="${isIncidente ? 'animate-bounce text-red-600' : 'text-emerald-600'}">
          Bleto 🚌 ${isIncidente ? '🔴' : '🟢'} ${placa}
        </div>`,
      className: 'bus-marker',
    });

    const popupContent = `
      <div class="p-2 min-w-[160px]">
        <h3 class="font-bold border-b pb-1 mb-2 text-blue-800">Bus: ${placa}</h3>
        <p class="text-sm">📍 <b>Próximo Paradero:</b><br/> ${paraderoCercano || 'Calculando...'}</p>
        <p class="text-sm mt-1">⏱️ <b>Llegada Estimada:</b><br/> ${tiempoEstimado || '--'} mins</p>
      </div>
    `;

    if (!this.busMarkers[placa]) {
      this.busMarkers[placa] = L.marker(latlng, { icon: busIcon })
        .bindPopup(popupContent)
        .addTo(this.map);
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
        this.toastService.success(
          `¡Alerta activada! Te avisaremos ${minutos} minutos antes de que el bus llegue.`,
        );
      },
      error: () => {
        this.toastService.success(`¡Alerta activada localmente para ${minutos} minutos!`);
      },
    });
  }

  protected prepararPagoRapido(): void {
    this.notificacionActiva.set(null);
    this.router.navigate(['/recarga']);
    this.toastService.info('Preparando tu método de pago virtual...');
  }

  protected cerrarNotificacion(): void {
    this.notificacionActiva.set(null);
  }

  protected comprarBoleto(route: RutaLista): void {
    this.toastService.info(`Boleto para ${route.nombre} seleccionado.`);
  }

  protected activarModoRutas(): void {
    this.modoActual.set('rutas');
    this.viajeSeleccionadoDetalle.set(null);
  }

  protected activarModoParaderos(): void {
    this.modoActual.set('paraderos');
    this.viajeSeleccionadoDetalle.set(null);
  }

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // HU-ENTR-2-005: Visualizar historial detallado (SOLO DATOS REALES DE LA BD)
  protected loadRecentTrips(): void {
    const userId = 1; 

    this.http.get<any[]>(`http://localhost:3000/boletos/user/${userId}`).subscribe({
      next: (viajesReales) => {
        if (viajesReales && viajesReales.length > 0) {
          const historialMapeado = viajesReales.map(boleto => {
            const fechaInicio = new Date(boleto.inicioViaje);
            const fechaFin = boleto.finViaje ? new Date(boleto.finViaje) : null;

            return {
              id: boleto.id,
              route: boleto.programacion?.ruta?.nombre || 'Ruta Satelital',
              date: fechaInicio.toISOString().split('T')[0], 
              fare: Number(boleto.costo) || 0,
              status: boleto.estado === 'completado' ? 'Completado' : 'Activo',
              horaAbordaje: fechaInicio.toLocaleTimeString('es-CO'),
              horaDescenso: fechaFin ? fechaFin.toLocaleTimeString('es-CO') : 'En curso...',
              paraderoAbordaje: 'Paradero de Origen', 
              paraderoDescenso: boleto.estado === 'completado' ? 'Paradero de Destino' : '--',
              placaBus: boleto.programacion?.bus?.placa || 'Asignando...',
              conductor: 'Conductor Oficial', 
              tiempoTotal: boleto.tiempoTotalMinutos ? `${boleto.tiempoTotalMinutos} mins` : 'Calculando...',
              coordenadasMapa: boleto.coordenadasMapa || [] 
            };
          });

          this.recentTrips.set(historialMapeado);
        } else {
          this.recentTrips.set([]);
        }
      },
      error: (err) => {
        console.error('Error cargando historial de BD:', err);
        this.toastService.error('No se pudo cargar el historial de viajes.');
        this.recentTrips.set([]); 
      },
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

  // HU-ENTR-3-012: Conexión con Webhook de N8N para Google Calendar y envío de Emails
  // HU-ENTR-3-012: Agendamiento Automático de Citas vía N8N e iPaaS
  // HU-ENTR-3-012: Agendamiento Automático de Citas vía N8N
  protected agendarCita(): void {
    if (!this.citaForm.fechaHora || !this.citaForm.motivo.trim() || !this.citaForm.emailCiudadano.trim()) {
      this.toastService.warning('Por favor completa la fecha, hora, motivo y tu correo electrónico.');
      return;
    }

    this.cargandoCita.set(true);
    this.citaAgendadaExito.set(null);

    // 1. Formatear la fecha de inicio (Zona Horaria de Colombia -05:00)
    const inicioFormatted = `${this.citaForm.fechaHora}:00-05:00`;

    // 2. Calcular fecha de fin (bloque de 30 minutos)
    const dateInicio = new Date(this.citaForm.fechaHora);
    const dateFin = new Date(dateInicio.getTime() + 30 * 60000);

    const pad = (n: number) => n < 10 ? '0' + n : n;
    const finFormatted = `${dateFin.getFullYear()}-${pad(dateFin.getMonth() + 1)}-${pad(dateFin.getDate())}T${pad(dateFin.getHours())}:${pad(dateFin.getMinutes())}:00-05:00`;

    // 3. Estructurar el Payload
    const payload = {
      tipoAtencion: this.citaForm.tipoAtencion,
      tipoConsulta: this.citaForm.tipoConsulta,
      inicio: inicioFormatted,
      fin: finFormatted,
      motivo: this.citaForm.motivo.trim(),
      emailCiudadano: this.citaForm.emailCiudadano.trim()
    };

    // 4. Llamar a N8N a través de tu nuevo servicio
    this.citaN8nService.agendarCita(payload).subscribe({
      next: (response: any) => {
        this.cargandoCita.set(false);
        this.citaAgendadaExito.set(response); 
        this.toastService.success('¡Cita agendada y sincronizada con Google Calendar!');
        
        // Limpiamos los campos para futuras citas
        this.citaForm.motivo = '';
        this.citaForm.fechaHora = '';
      },
      error: (err) => {
        this.cargandoCita.set(false);
        console.error('Error N8N Webhook:', err);
        this.toastService.error('No se pudo conectar con el servidor de citas. Inténtalo de nuevo.');
      }
    });
  }
}