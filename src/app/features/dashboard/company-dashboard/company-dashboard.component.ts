import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

// Importación de todos tus servicios reales
import { BusService } from '../../../core/services/bus.service';
import { ToastService } from '../../../core/services/toast.service';
import { ChatSocketService } from '../../../core/services/chat-socket.service';
import { MonitoreoService } from '../../../core/services/monitoreo.service';
import { ProgramacionService } from '../../../core/services/programacion.service';
import { IncidenteBusService } from '../../../core/services/incidente-bus.service';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './company-dashboard.component.html',
  styleUrl: './company-dashboard.component.css',
})
export class CompanyDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  
  // ==========================================
  // ✨ VARIABLES DE MAPA Y WEBSOCKET (HU-ENTR-3-002)
  // ==========================================
  @ViewChild('mapaSupervisor') mapElement!: ElementRef;
  private map!: L.Map;
  private markersMap = new Map<string, L.Marker>();
  
  // Inyección de servicios modernos
  private chatSocketService = inject(ChatSocketService);
  private monitoreoService = inject(MonitoreoService);
  private programacionService = inject(ProgramacionService);
  private incidenteBusService = inject(IncidenteBusService);
  
  private flotaSub?: Subscription;
  private dashboardSub?: Subscription;

  protected flotaEnVivo = signal<any[]>([]);
  protected pasajerosEnTransito = signal<number>(0);
  protected incidentesCriticos = signal<any[]>([]);
  protected busesOperandoReal = signal<number>(0);
  // ==========================================

  protected buses = signal<any[]>([]);
  protected incidents = signal<any[]>([]);
  protected schedules = signal<any[]>([]);
  protected registrationForm: FormGroup;
  protected scheduleForm: FormGroup;
  protected selectedBusForIncidents = signal<string>('');
  protected isSubmittingBusForm = signal<boolean>(false);
  protected isSubmittingScheduleForm = signal<boolean>(false);

  protected openIncidentsCount = computed(() => {
    return this.incidents().filter((i: any) => i.estado === 'pendiente' || i.estado === 'en_revision' || i.status === 'Abierto').length;
  });

  protected totalBusesCount = computed(() => {
    return this.buses().length;
  });

  protected activeSchedulesCount = computed(() => {
    return this.schedules().length;
  });

  constructor(
    private busService: BusService,
    private toastService: ToastService,
    private fb: FormBuilder,
  ) {
    this.registrationForm = this.fb.group({
      plate: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{3}$/)]],
      model: ['', [Validators.required, Validators.minLength(3)]],
      year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      capacity: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      licensePlate: ['', [Validators.required]],
    });

    this.scheduleForm = this.fb.group({
      rutaId: ['', [Validators.required]],
      busId: ['', [Validators.required]],
      fecha: ['', [Validators.required]],
      horaSalida: ['', [Validators.required]],
      tipoRecurrencia: ['Unico'], 
      margenToleranciaMinutos: [15]
    });
  }

  ngOnInit(): void {
    this.loadBuses();
    this.loadIncidents();
    this.loadSchedules();

    // ==========================================
    // ✨ INICIO DE MONITOREO REAL (HU-ENTR-3-002)
    // ==========================================
    this.dashboardSub = this.monitoreoService.getDashboardGeneralPolling().subscribe({
      next: (resp: any) => {
        const data = resp.data || resp;
        this.pasajerosEnTransito.set(data.pasajerosEnTransito || 0);
        this.busesOperandoReal.set(data.busesOperando || 0);
        
        const incidentes = data.incidentes || [];
        this.incidentesCriticos.set(incidentes.filter((i: any) => i.estado === 'pendiente' || i.estado === 'en_revision'));
      }
    });

    // HU-3-002: el gateway emite 'actualizacionFlotaGlobal' con TODA la flota.
    this.flotaSub = this.chatSocketService.escucharFlotaGlobal().subscribe((flotaArray: any) => {
      const flota = Array.isArray(flotaArray) ? flotaArray : [flotaArray];
      this.flotaEnVivo.set(flota);
      this.actualizarMarcadores(flota);
    });

    // Pequeño margen para asegurar que el socket esté conectado antes de unirse a la sala.
    setTimeout(() => this.chatSocketService.suscribirseAFlota(), 500);
  }

  ngAfterViewInit(): void {
    if (this.mapElement) {
      this.map = L.map(this.mapElement.nativeElement).setView([5.06889, -75.51738], 14);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(this.map);

      setTimeout(() => { this.map.invalidateSize(); }, 400);
    }
  }

  private actualizarMarcadores(flota: any[]): void {
    if (!this.map) return;

    const idsServidor = new Set(flota.map(b => b.busId || b.id || b.placa));
    this.markersMap.forEach((marker, id) => {
      if (!idsServidor.has(id)) {
        marker.remove();
        this.markersMap.delete(id);
      }
    });

    flota.forEach(bus => {
      const lat = bus.latitud || bus.lat || bus.latitude || bus.gps?.lat;
      const lng = bus.longitud || bus.lng || bus.longitude || bus.gps?.lng;
      if (!lat || !lng) return;

      const latlng: L.LatLngExpression = [lat, lng];
      const isIncidente = bus.estado === 'incidente';
      const pasajeros = bus.pasajerosCalculados || 0;
      const capacidad = bus.capacidadMaxima || 999;
      const isOcupacionMaxima = pasajeros >= capacidad;

      let colorClase = 'text-green-600 bg-green-100 border-green-600 shadow-[0_0_15px_rgba(22,163,74,0.6)]';
      let icono = '🚌';

      if (isIncidente) {
        colorClase = 'text-red-600 bg-red-100 border-red-600 animate-pulse';
        icono = '🚨';
      } else if (isOcupacionMaxima) {
        colorClase = 'text-orange-600 bg-orange-100 border-orange-600';
        icono = '⚠️';
      }

      const placaStr = bus.placa || bus.busId || bus.id || 'N/A';

      const customIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center justify-center font-bold border-2 rounded-lg px-2 py-1 ${colorClase}">
            <span class="text-lg">${icono}</span>
            <span class="text-[10px] uppercase">${placaStr}</span>
          </div>`,
        className: '', 
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      });

      const popupHtml = `
        <div style="min-width: 180px; font-family: sans-serif; font-size: 12px;">
          <h4 style="margin: 0 0 5px 0; border-bottom: 1px solid #ccc; padding-bottom: 4px; font-weight: bold;">
            🚌 Placa: ${placaStr}
          </h4>
          <p style="margin: 3px 0;">👥 <b>Pasajeros:</b> ${pasajeros} / ${capacidad}</p>
          <p style="margin: 3px 0;">🚦 <b>Velocidad:</b> ${bus.velocidad || 0} km/h</p>
          ${isOcupacionMaxima ? '<p style="color: #ea580c; font-weight: bold; margin: 4px 0;">⚠️ Ocupación Máxima</p>' : ''}
          ${isIncidente ? '<p style="color: #dc2626; font-weight: bold; margin: 4px 0;">🚨 Incidente Activo</p>' : ''}
        </div>
      `;

      const markerId = bus.busId || bus.id || bus.placa;

      if (!this.markersMap.has(markerId)) {
        const marker = L.marker(latlng, { icon: customIcon }).bindPopup(popupHtml).addTo(this.map);
        this.markersMap.set(markerId, marker);
      } else {
        const marker = this.markersMap.get(markerId)!;
        marker.setLatLng(latlng);
        marker.setIcon(customIcon);
        marker.setPopupContent(popupHtml);
      }
    });
  }

  ngOnDestroy(): void {
    this.flotaSub?.unsubscribe();
    this.dashboardSub?.unsubscribe();
    if (this.map) this.map.remove();
  }

  protected loadBuses(): void {
    // ⚠️ ATENCIÓN: Cambié obtenerTodos() por findAll() (o getBuses()), verifica en bus.service.ts cuál es el correcto.
    (this.busService as any).findAll().subscribe({
      next: (busesDB: any[]) => {
        this.buses.set(busesDB);
      },
      error: (err: any) => {
        console.error('Error cargando los buses de la BD:', err);
        this.toastService.error('Error al cargar la flota de buses');
      }
    });
  }

  protected loadIncidents(): void {
    const empresaId = 1;
    this.incidenteBusService.obtenerAlertasGerente(empresaId).subscribe({
      next: (incidentesDB: any[]) => {
        this.incidents.set(incidentesDB);
      },
      error: (err: any) => console.error('Error cargando incidentes:', err)
    });
  }

  protected loadSchedules(): void {
    this.programacionService.findAll().subscribe({
      next: (programacionesDB: any[]) => {
        this.schedules.set(programacionesDB);
      },
      error: (err: any) => console.error('Error cargando programaciones reales:', err)
    });
  }

  protected registrarBus(): void {
    if (this.registrationForm.invalid) {
      this.toastService.error('Por favor completa todos los campos correctamente');
      return;
    }

    this.isSubmittingBusForm.set(true);

    setTimeout(() => {
      const newBus = {
        id: `B${this.buses().length + 1}`,
        ...this.registrationForm.value,
        status: 'Operativo',
        mileage: 0,
      };

      this.buses.update((buses) => [...buses, newBus]);
      this.registrationForm.reset();
      this.isSubmittingBusForm.set(false);
      this.toastService.success('✅ Bus registrado exitosamente (HU-012)');
    }, 1500);
  }

  protected crearProgramacion(): void {
    if (this.scheduleForm.invalid) {
      this.toastService.error('Por favor completa todos los campos');
      return;
    }

    this.isSubmittingScheduleForm.set(true);

    const dto = {
      ...this.scheduleForm.value,
      busId: Number(this.scheduleForm.value.busId),
      rutaId: Number(this.scheduleForm.value.rutaId)
    };

    this.programacionService.crear(dto).subscribe({
      next: (resp) => {
        const nuevasProgramaciones = Array.isArray(resp) ? resp : [resp];
        this.schedules.update((schedules) => [...schedules, ...nuevasProgramaciones]);
        
        this.scheduleForm.reset({ tipoRecurrencia: 'Unico', margenToleranciaMinutos: 15 });
        this.isSubmittingScheduleForm.set(false);
        this.toastService.success('✅ Programación guardada en BD (HU-011)');
      },
      error: (err: any) => {
        console.error(err);
        this.toastService.error('Error al guardar en la base de datos');
        this.isSubmittingScheduleForm.set(false);
      }
    });
  }

  protected getIncidentsForBus(busId: string): any[] {
    if (!busId) return this.incidents();
    return this.incidents().filter((incident) => incident.busId == busId);
  }

  protected getSeverityColor(severity: string): string {
    if (!severity) return 'bg-gray-100 text-gray-800';
    switch (severity.toLowerCase()) {
      case 'alta': 
      case 'critico': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'media': 
      case 'medio': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'baja': 
      case 'bajo': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  }

  protected getStatusColor(status: string): string {
    if (!status) return 'text-gray-600';
    switch (status.toLowerCase()) {
      case 'operativo': return 'text-green-600 dark:text-green-400';
      case 'mantenimiento': return 'text-orange-600 dark:text-orange-400';
      case 'fuera de servicio': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }
}