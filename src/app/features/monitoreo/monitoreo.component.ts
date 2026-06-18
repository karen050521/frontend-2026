import { Component, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MonitoreoService, BusEnRuta } from '../../core/services/monitoreo.service';
import { NotificacionSuscripcionService } from '../../core/services/notificacion-suscripcion.service';
import { ChatSocketService } from '../../core/services/chat-socket.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';
import * as L from 'leaflet';

@Component({
  selector: 'app-monitoreo',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // HU-3-003: suscripción "bus próximo"
  minutosAnticipacion = 10;
  readonly opcionesAnticipacion = [5, 10, 15];
  guardandoSuscripcion = false;
  // Paradero al que ya estás suscrito (para deshabilitar el botón hasta que cambies de paradero)
  paraderoSuscritoId: number | null = null;
  // Última alerta recibida (para mostrar acciones "ver ubicación" / "preparar pago")
  ultimaAlerta: { rutaNombre: string; etaMinutos: number; placa: string; busId: number; paraderoNombre?: string } | null = null;

  private mapa!: L.Map;
  private marcadores = new Map<number, L.Marker>();
  private paraderosLayer = L.layerGroup();
  private pollingSubscription!: Subscription;
  private alertaSubscription?: Subscription;
  private primeraCarga = true;
  // Throttle de toast: no martillar la UI aunque el back emita de más.
  private ultimoToastTs = 0;
  private readonly TOAST_COOLDOWN_MS = 30000;

  // ¿El botón "Avisarme" debe estar deshabilitado? (sin paradero, guardando, o ya suscrito a éste)
  get yaSuscritoAlParadero(): boolean {
    return this.paraderoSeleccionadoId != null && this.paraderoSeleccionadoId === this.paraderoSuscritoId;
  }
  // Rutas/paraderos viven en back-logic (NestJS :3000), no en back-sec (:8181)
  private apiUrl = environment.apiNestUrl;

  private monitoreoService = inject(MonitoreoService);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private suscripcionService = inject(NotificacionSuscripcionService);
  private chatSocket = inject(ChatSocketService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  ngOnInit() {
    this.rutaId = Number(this.route.snapshot.paramMap.get('rutaId'));
    this.cargarParaderos();

    // HU-3-003: unirse a la sala personal y escuchar alertas de bus próximo.
    const personaId = this.authService.currentUser()?.id;
    if (personaId) {
      this.chatSocket.identificarUsuario(personaId);
    }
    this.alertaSubscription = this.chatSocket.escucharAlertaBus().subscribe((alerta) => {
      // El banner se actualiza siempre; el toast se limita (throttle) para no martillar.
      this.ultimaAlerta = alerta;
      const ahora = Date.now();
      if (ahora - this.ultimoToastTs >= this.TOAST_COOLDOWN_MS) {
        this.ultimoToastTs = ahora;
        this.toast.warning(
          `🚌 Bus ${alerta.placa} (${alerta.rutaNombre}) llega en ~${alerta.etaMinutos} min`,
          6000,
        );
      }
    });
  }

  // HU-3-003: crear suscripción para el paradero + anticipación elegidos.
  crearSuscripcion() {
    if (!this.paraderoSeleccionadoId) {
      this.toast.error('Selecciona un paradero primero.');
      return;
    }
    this.guardandoSuscripcion = true;
    this.suscripcionService
      .crear({
        rutaId: this.rutaId,
        paraderoId: this.paraderoSeleccionadoId,
        minutosAnticipacion: this.minutosAnticipacion,
      })
      .subscribe({
        next: () => {
          this.guardandoSuscripcion = false;
          this.paraderoSuscritoId = this.paraderoSeleccionadoId; // deshabilita el botón hasta cambiar de paradero
          this.toast.success(`✅ Te avisaremos cuando el bus esté a ${this.minutosAnticipacion} min.`);
        },
        error: () => {
          this.guardandoSuscripcion = false;
          this.toast.error('No se pudo crear la suscripción.');
        },
      });
  }

  // HU-3-003: centrar el mapa en el bus de la alerta.
  verUbicacionAlerta() {
    const busId = this.ultimaAlerta?.busId;
    if (busId == null) return;
    const marcador = this.marcadores.get(busId);
    if (marcador) {
      this.mapa.setView(marcador.getLatLng(), 16);
      marcador.openPopup();
    } else {
      this.toast.info('El bus aún no aparece en el mapa.');
    }
  }

  // HU-3-003: acción rápida de pago (deep-link a recarga, sin implementar pago).
  prepararPago() {
    this.router.navigate(['/recarga']);
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
    this.paraderosLayer.addTo(this.mapa);
    this.dibujarParaderos(); // si los paraderos ya cargaron antes del mapa
  }

  // HU-3-003 / FIX 5: dibuja los paraderos de la ruta en el mapa (patrón de
  // features/rutas/paraderos-cercanos). Resalta el paradero seleccionado.
  private dibujarParaderos() {
    if (!this.mapa || !this.paraderos.length) return;
    this.paraderosLayer.clearLayers();
    for (const p of this.paraderos) {
      const lat = Number(p.latitud ?? p.latitude);
      const lon = Number(p.longitud ?? p.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
      const seleccionado = this.paraderoSeleccionadoId === p.id;
      const icono = L.divIcon({
        html: `<div class="flex items-center justify-center rounded-full border-2 shadow ${
          seleccionado
            ? 'bg-emerald-600 border-emerald-800 text-white w-7 h-7 text-base'
            : 'bg-white border-blue-500 w-5 h-5 text-xs'
        }">📍</div>`,
        className: '',
        iconSize: seleccionado ? [28, 28] : [20, 20],
        iconAnchor: seleccionado ? [14, 14] : [10, 10],
      });
      L.marker([lat, lon], { icon: icono })
        .bindPopup(`<strong>${p.nombre ?? 'Paradero'}</strong>`)
        .addTo(this.paraderosLayer);
    }
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
        this.dibujarParaderos(); // pintarlos en el mapa (si ya está inicializado)
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
    this.dibujarParaderos(); // mover el resaltado al paradero elegido
  }

  // --- HU-3-001: detección de señal perdida (staleness) ---
  private readonly UMBRAL_SIN_SENAL_MIN = 5;

  /** Minutos desde el último reporte de posición; null si no hay timestamp válido. */
  minutosSinReportar(bus: BusEnRuta): number | null {
    if (!bus.ultimaActualizacion) return null;
    const t = new Date(bus.ultimaActualizacion).getTime();
    if (Number.isNaN(t)) return null;
    return Math.max(0, Math.floor((Date.now() - t) / 60000));
  }

  /** El bus no reporta hace demasiado (o nunca) → no se confía en su posición. */
  estaSinSenal(bus: BusEnRuta): boolean {
    const m = this.minutosSinReportar(bus);
    return m === null || m >= this.UMBRAL_SIN_SENAL_MIN;
  }

  /** Texto de estado para el listado (sin señal tiene prioridad visual). */
  textoEstado(bus: BusEnRuta): string {
    if (this.estaSinSenal(bus)) {
      const m = this.minutosSinReportar(bus);
      return m === null ? '📡 Sin señal' : `📡 Sin señal · ${this.formatearRetraso(m)}`;
    }
    return bus.estado === 'incidente' ? '⚠️ Alerta / Retraso' : '✅ En horario';
  }

  claseEstado(bus: BusEnRuta): string {
    if (this.estaSinSenal(bus)) return 'text-gray-500 dark:text-gray-400';
    return bus.estado === 'incidente' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
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
      const sinSenal = this.estaSinSenal(bus);
      const esIncidente = bus.estado === 'incidente';
      // Prioridad visual: sin señal (gris) > incidente/retraso (rojo) > en horario (verde)
      const colorClase = sinSenal
        ? 'bg-gray-400 border-gray-600 text-white opacity-90'
        : esIncidente
          ? 'bg-red-500 border-red-700 text-white animate-bounce'
          : 'bg-green-600 border-green-800 text-white';

      const icono = L.divIcon({
        html: `
          <div class="flex flex-col items-center justify-center rounded-lg px-2 py-1 border shadow-md font-bold text-xs transition-all duration-300 ${colorClase}">
            <span>${sinSenal ? '📡' : '🚌'} ${bus.placa}</span>
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
    const sinSenal = this.estaSinSenal(bus);
    const minSin = this.minutosSinReportar(bus);
    const esIncidente = bus.estado === 'incidente';
    // Se asegura de desplegar el nombre por defecto de manera limpia ante fallas de red
    const nombreParadero = bus.paraderoMasCercano.nombre || 'En tránsito';
    const distancia = bus.paraderoMasCercano.distanciaMetros || 0;

    const badgeColor = sinSenal ? '#9CA3AF' : esIncidente ? '#EF4444' : '#10B981';
    const badgeText = sinSenal ? 'SIN SEÑAL' : esIncidente ? 'INCIDENTE' : 'OPERANDO';
    const footer = sinSenal
      ? `<span style="color:#6B7280; font-weight: bold;">📡 Sin señal${minSin !== null ? ' hace ' + this.formatearRetraso(minSin) : ''} — posición no confiable</span>`
      : esIncidente
        ? `<span style="color:#DC2626; font-weight: bold;">⚠️ Alerta / Retraso en Operación</span>`
        : '<span style="color:#16A34A; font-weight: medium;">✅ Horario Regulado Activo</span>';

    return `
      <div style="min-width:210px; font-size:13px; font-family: sans-serif; line-height: 1.4;">
        <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
          <strong>🚌 Placa: ${bus.placa}</strong>
          <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; background-color: ${badgeColor}">
            ${badgeText}
          </span>
        </div>
        📍 <b>Próximo paradero:</b> ${nombreParadero}<br>
        📏 <b>Distancia:</b> ${distancia} m<br>
        ⏱️ <b>Arribo estimado:</b> <strong>${bus.tiempoEstimadoLlegada} min</strong><br>
        🚦 <b>Velocidad:</b> ${bus.velocidad} km/h<br>
        <hr style="margin: 6px 0; border: 0; border-top: 1px solid #E5E7EB;">
        ${footer}
      </div>`;
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
    this.mapa?.remove();
  }
}