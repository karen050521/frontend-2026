import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BoletoService } from '../../core/services/boleto.service';
import { Boleto, BusOption, ParaderoOption } from '../../core/models/boleto.model';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms'; // 👈 Agrega esta línea si no la tienes
import * as L from 'leaflet';

type StatusFilter = 'TODOS' | 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';

@Component({
  selector: 'app-boletos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './boletos.component.html',
  styleUrl: './boletos.component.css',
})
export class BoletosComponent implements OnInit {
  private readonly tokenStorageKey = 'authToken';

  // --- SEÑALES DE ESTADO ---
  protected searchQuery = signal<string>('');
  protected statusFilter = signal<StatusFilter>('TODOS');
  protected sortBy = signal<'recent' | 'oldest'>('recent');
  protected buses = signal<BusOption[]>([]);
  protected paraderos = signal<ParaderoOption[]>([]);
  protected paraderosDescensoPorBoleto = signal<Record<number, ParaderoOption[]>>({});
  protected misTarjetas = signal<any[]>([]);
  protected isSubmitting = signal<boolean>(false);
  protected showRecorridoModal = signal<boolean>(false);
  protected loadingRecorrido = signal<boolean>(false);
  protected recorridoDetalle = signal<any>(null);
  private mapRecorrido: L.Map | null = null;

  // --- SEÑALES PARA EL MODAL ---
  protected showCancelModal = signal<boolean>(false);
  protected selectedBoleto = signal<Boleto | null>(null);

  protected abordajeForm: FormGroup;
  protected paraderoDescensoSeleccionado: number | null = null;

  constructor(
    public boletoServiceInst: BoletoService,
    private toastService: ToastService,
    private fb: FormBuilder,
  ) {
    this.abordajeForm = this.fb.group({
      bus_id: [null, Validators.required],
      paraderoAbordaje_id: [null, Validators.required],
      metodoPagoCiudadano_id: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadBoletos();
    this.loadFormData();
  }

  // 🔍 EVALUACIÓN REACTIVA ÚNICA: Mapea tu tarjeta usando 'id' de la tarjeta
  protected get selectedTarjeta() {
    const id = this.abordajeForm.get('metodoPagoCiudadano_id')?.value;
    if (!id) return null;
    return this.misTarjetas().find((t) => t.id == id) || null;
  }

  private loadFormData(): void {
    const token = localStorage.getItem(this.tokenStorageKey) || '';

    if (!token) {
      this.toastService.error('Sesión inválida o expirada. Inicie sesión nuevamente.');
      return;
    }

    forkJoin({
      // 🚌 FILTRADO QUIRÚRGICO: El backend ya calcula 'enRuta' basándose en los turnos 'en_curso'
      buses: this.boletoServiceInst.getBuses().pipe(
        map((allBuses: any[]) => {
          return allBuses.filter((bus) => bus.enRuta === true);
        }),
        catchError(() => of([])),
      ),
      paraderos: this.boletoServiceInst.getParaderos().pipe(catchError(() => of([]))),
      tarjetas: this.boletoServiceInst.getMisTarjetas(token).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ buses, paraderos, tarjetas }) => {
        console.log('🔴 REVISIÓN DE TARJETAS EN EL COMPONENTE:', tarjetas);
        this.buses.set(buses);
        this.paraderos.set(paraderos);
        this.misTarjetas.set(tarjetas);

        if (buses.length === 0 && paraderos.length === 0 && tarjetas.length === 0) {
          this.toastService.error('Error al sincronizar datos del servidor');
        }
      },
      error: () => this.toastService.error('Error crítico al sincronizar datos del servidor'),
    });
  }

  readonly filteredBoletos = computed(() => {
    const rawBoletos = this.boletoServiceInst.boletos() || [];
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    let mapped = rawBoletos.map((b: any) => ({
      ...b,
      status: (b.estado || b.status || 'ACTIVO').toUpperCase(),
      boardingTime: b.inicioViaje || b.createdAt,
      disembarkTime: b.finViaje,
      travelDetails: {
        origin: b.ruta?.origen || 'Origen no definido',
        destination: b.ruta?.destino || 'Destino no definido',
        driverName: b.programacion?.empleado?.nombre || 'Conductor asignado',
        vehiclePlate: b.programacion?.bus?.placa || 'N/A',
        scheduledTime: b.programacion?.horaSalida || b.inicioViaje,
      },
    }));

    if (status !== 'TODOS') {
      mapped = mapped.filter((b: any) => b.status === status);
    }

    if (query) {
      mapped = mapped.filter(
        (b: any) =>
          b.travelDetails.origin.toLowerCase().includes(query) ||
          b.travelDetails.destination.toLowerCase().includes(query) ||
          b.numeroBoleto?.toLowerCase().includes(query),
      );
    }

    return mapped.sort((a: any, b: any) => {
      const dateA = new Date(a.boardingTime || 0).getTime();
      const dateB = new Date(b.boardingTime || 0).getTime();
      return this.sortBy() === 'recent' ? dateB - dateA : dateA - dateB;
    });
  });

  private loadBoletos(): void {
    this.boletoServiceInst.getBoletosDelUsuario().subscribe({
      next: (boletos) => {
        const token = localStorage.getItem(this.tokenStorageKey) || '';
        if (!token) return;

        const boletosActivos = (boletos || []).filter((boleto: any) => {
          const estado = (boleto.estado || boleto.status || '').toString().toUpperCase();
          return estado === 'ACTIVO' && !!boleto.id;
        });

        boletosActivos.forEach((boleto: any) => {
          this.boletoServiceInst.getParaderosDescenso(Number(boleto.id), token).subscribe({
            next: (paraderosDescenso) => {
              this.paraderosDescensoPorBoleto.update((actual) => ({
                ...actual,
                [Number(boleto.id)]: paraderosDescenso || [],
              }));
            },
            error: (err) => {
              console.error(`Error cargando paraderos de descenso para boleto ${boleto.id}:`, err);
            },
          });
        });
      },
    });
  }

  protected getParaderosDescenso(boletoId: number): ParaderoOption[] {
    return this.paraderosDescensoPorBoleto()[boletoId] || [];
  }

  protected hasFieldError(fieldName: string): boolean {
    const field = this.abordajeForm.get(fieldName);
    return !!field && field.invalid && (field.touched || field.dirty);
  }

  protected getBusLabel(bus: BusOption): string {
    return bus.placa ? `🚌 ${bus.placa} - ${bus.nombre || 'Unidad en Ruta'}` : `Bus ${bus.id}`;
  }

  protected getParaderoLabel(paradero: ParaderoOption): string {
    return paradero.nombre || paradero.direccion || `Paradero ${paradero.id}`;
  }

  protected submitAbordaje(): void {
    if (this.abordajeForm.invalid) {
      this.abordajeForm.markAllAsTouched();
      return;
    }
    const token = localStorage.getItem(this.tokenStorageKey);
    if (!token) return;

    this.isSubmitting.set(true);
    const val = this.abordajeForm.value;

    const payload = {
      bus_id: Number(val.bus_id),
      paraderoAbordaje_id: Number(val.paraderoAbordaje_id),
      metodoPagoCiudadano_id: Number(val.metodoPagoCiudadano_id),
    };

    this.boletoServiceInst.registrarAbordaje(payload, token).subscribe({
      next: (res) => {
        this.toastService.success(`¡Abordaje exitoso! Saldo restante: $${res.saldoRestante}`);
        this.abordajeForm.reset();
        this.loadBoletos();
        this.loadFormData();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Error en el abordaje');
        this.isSubmitting.set(false);
      },
    });
  }

  protected finishTravel(boleto: Boleto): void {
    if (!boleto.id) return;

    const token = localStorage.getItem(this.tokenStorageKey);
    if (!token) return;

    // 🚌 Validamos que se haya elegido un paradero del select dinámico
    if (!this.paraderoDescensoSeleccionado) {
      this.toastService.error('Por favor, seleccione el paradero exacto donde desciende del bus.');
      return;
    }

    const payload = {
      boleto_id: Number(boleto.id),
      paraderoDescenso_id: Number(this.paraderoDescensoSeleccionado),
    };

    // 🔥 Enviamos el payload a tu endpoint especializado de descenso
    this.boletoServiceInst.finalizarViaje(payload, token).subscribe({
      next: (res) => {
        // 🎯 CUMPLIMIENTO HU: Mensaje corporativo exacto de la historia
        this.toastService.success(
          res.mensaje || 'Viaje completado - Gracias por usar nuestro servicio',
        );

        // Limpiamos la variable para el próximo viaje
        this.paraderoDescensoSeleccionado = null;

        // Refrescamos pantallas y estados
        this.loadBoletos();
        this.loadFormData();
      },
      error: (err) => {
        this.toastService.error(err.message || 'Error al procesar el descenso');
      },
    });
  }

  protected openCancelModal(boleto: Boleto): void {
    this.selectedBoleto.set(boleto);
    this.showCancelModal.set(true);
  }

  protected closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.selectedBoleto.set(null);
  }

  protected confirmCancel(): void {
    const boleto = this.selectedBoleto();
    if (!boleto || !boleto.id) return;
    this.boletoServiceInst.updateBoleto(Number(boleto.id), { estado: 'cancelado' }).subscribe({
      next: () => {
        this.toastService.success('Boleto cancelado correctamente');
        this.loadBoletos();
        this.loadFormData();
        this.closeCancelModal();
      },
      error: () => {
        this.toastService.error('No se pudo cancelar el boleto');
        this.closeCancelModal();
      },
    });
  }

  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onStatusFilterChange(status: string): void {
    this.statusFilter.set(status as StatusFilter);
  }

  protected onSortChange(sort: 'recent' | 'oldest'): void {
    this.sortBy.set(sort);
  }

  protected formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected retryLoad(): void {
    this.loadBoletos();
    this.loadFormData();
  }
  protected verRecorrido(boleto: any): void {
    const token = localStorage.getItem(this.tokenStorageKey);
    if (!token || !boleto.id) return;

    this.showRecorridoModal.set(true);
    this.loadingRecorrido.set(true);

    this.boletoServiceInst.obtenerRecorridoViaje(boleto.id, token).subscribe({
      next: (data) => {
        this.recorridoDetalle.set(data);
        this.loadingRecorrido.set(false);
        // Esperamos un tick para que Angular renderice el contenedor del mapa
        setTimeout(() => this.dibujarMapaRecorrido(data), 300);
      },
      error: (err) => {
        this.loadingRecorrido.set(false);
        this.toastService.error('No se pudo cargar el recorrido de este viaje.');
        this.cerrarRecorridoModal();
      },
    });
  }

  protected cerrarRecorridoModal(): void {
    this.showRecorridoModal.set(false);
    this.recorridoDetalle.set(null);
    if (this.mapRecorrido) {
      this.mapRecorrido.remove();
      this.mapRecorrido = null;
    }
  }

  private dibujarMapaRecorrido(data: any): void {
    // Si ya existía un mapa, lo destruimos
    if (this.mapRecorrido) {
      this.mapRecorrido.remove();
    }

    const mapContainer = document.getElementById('mapa-recorrido-container');
    if (!mapContainer) return;

    this.mapRecorrido = L.map(mapContainer).setView([5.0689, -75.5173], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.mapRecorrido);

    // Forzar redibujado de Leaflet para dimensiones dinámicas del modal
    this.mapRecorrido.invalidateSize();

    // 1. Dibujamos la línea de la ruta completa (El trayecto del bus)
    const coordenadasRuta: L.LatLngTuple[] = (data.ruta?.coordenadasMapa || []).map(
      (c: any) => [+c.latitud, +c.longitud] as L.LatLngTuple,
    );

    if (coordenadasRuta.length > 0) {
      L.polyline(coordenadasRuta, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
      }).addTo(this.mapRecorrido);
    }

    // 2. Dibujamos los puntos exactos donde el usuario validó (Abordaje / Descenso)
    const allPoints: L.LatLngTuple[] = [...coordenadasRuta];

    (data.validaciones || []).forEach((v: any) => {
      if (!v.paradero?.latitud || !v.paradero?.longitud) return;

      const lat = +v.paradero.latitud;
      const lng = +v.paradero.longitud;
      allPoints.push([lat, lng]);

      const isAbordaje = v.tipo === 'abordaje';
      const color = isAbordaje ? '#10b981' : '#ef4444'; // Verde para subir, Rojo para bajar

      const markerHtml = `
        <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);">
          <svg style="width: 14px; height: 14px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isAbordaje ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}"></path></svg>
        </div>`;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const horaFormateada = new Date(v.horaExacta).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      L.marker([lat, lng], { icon: customIcon })
        .bindPopup(
          `
          <div class="text-sm">
            <strong style="color: ${color}">${v.tipo.toUpperCase()}</strong><br>
            <b>Paradero:</b> ${v.paradero.nombre}<br>
            <b>Hora exacta:</b> ${horaFormateada}
          </div>
        `,
        )
        .addTo(this.mapRecorrido!);
    });

    // 3. Ajustamos el zoom del mapa para contener todas las coordenadas de la ruta y validaciones
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      this.mapRecorrido.fitBounds(bounds, { padding: [40, 40] });
    } else {
      this.mapRecorrido.setView([5.0689, -75.5173], 13);
    }
  }
}
