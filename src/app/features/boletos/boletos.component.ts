import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BoletoService } from '../../core/services/boleto.service';
import {
  Boleto,
  BusOption,
  ParaderoOption,
  RegistrarAbordajeDto,
} from '../../core/models/boleto.model';
import { ToastService } from '../../core/services/toast.service';

type StatusFilter = 'TODOS' | 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';

@Component({
  selector: 'app-boletos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  protected misTarjetas = signal<any[]>([]); 
  protected isSubmitting = signal<boolean>(false);

  // --- SEÑALES PARA EL MODAL ---
  protected showCancelModal = signal<boolean>(false);
  protected selectedBoleto = signal<Boleto | null>(null);

  protected abordajeForm: FormGroup;

  constructor(
    public boletoServiceInst: BoletoService,
    private toastService: ToastService,
    private fb: FormBuilder,
  ) {
    this.abordajeForm = this.fb.group({
      bus_id: [null, Validators.required],
      paradero_id: [null, Validators.required],
      metodo_pago_id: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadBoletos();
    this.loadFormData();
  }

  private loadFormData(): void {
    forkJoin({
      buses: this.boletoServiceInst.getBuses(),
      paraderos: this.boletoServiceInst.getParaderos(),
      tarjetas: this.boletoServiceInst.getMisTarjetas(),
    }).subscribe({
      next: ({ buses, paraderos, tarjetas }) => {
        this.buses.set(buses);
        this.paraderos.set(paraderos);
        this.misTarjetas.set(tarjetas);
      },
      error: () => this.toastService.error('Error al sincronizar datos del servidor'),
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
        scheduledTime: b.programacion?.horaSalida || b.inicioViaje
      }
    }));

    if (status !== 'TODOS') {
      mapped = mapped.filter((b: any) => b.status === status);
    }

    if (query) {
      mapped = mapped.filter((b: any) => 
        b.travelDetails.origin.toLowerCase().includes(query) ||
        b.travelDetails.destination.toLowerCase().includes(query) ||
        b.numeroBoleto?.toLowerCase().includes(query)
      );
    }

    return mapped.sort((a: any, b: any) => {
      const dateA = new Date(a.boardingTime || 0).getTime();
      const dateB = new Date(b.boardingTime || 0).getTime();
      return this.sortBy() === 'recent' ? dateB - dateA : dateA - dateB;
    });
  });

  protected get stats() {
    const boletos = this.filteredBoletos();
    return {
      total: boletos.length,
      activos: boletos.filter((b) => b.status === 'ACTIVO').length,
      completados: boletos.filter((b) => b.status === 'COMPLETADO').length,
      cancelados: boletos.filter((b) => b.status === 'CANCELADO').length,
    };
  }

  private loadBoletos(): void {
    this.boletoServiceInst.getBoletosDelUsuario().subscribe();
  }

  // --- VALIDACIÓN DE CAMPOS (REQUERIDO POR EL HTML) ---
  protected hasFieldError(fieldName: string): boolean {
    const field = this.abordajeForm.get(fieldName);
    return !!field && field.invalid && (field.touched || field.dirty);
  }

  // --- LABELS (REQUERIDO POR EL HTML) ---
  protected getBusLabel(bus: BusOption): string {
    return bus.placa ? `${bus.placa} (${bus.nombre || 'Bus'})` : `Bus ${bus.id}`;
  }

  protected getParaderoLabel(paradero: ParaderoOption): string {
    return paradero.nombre || paradero.direccion || `Paradero ${paradero.id}`;
  }

  // --- ACCIONES ---
  protected submitAbordaje(): void {
    if (this.abordajeForm.invalid) {
      this.abordajeForm.markAllAsTouched();
      return;
    }
    const token = localStorage.getItem(this.tokenStorageKey);
    if (!token) return;

    this.isSubmitting.set(true);
    const val = this.abordajeForm.value;
    const payload: RegistrarAbordajeDto = {
      bus_id: Number(val.bus_id),
      paradero_id: Number(val.paradero_id),
      metodo_pago_id: Number(val.metodo_pago_id),
    };

    this.boletoServiceInst.registrarAbordaje(payload, token).subscribe({
      next: (res) => {
        this.toastService.success(`¡Abordaje exitoso! Saldo: $${res.saldoRestante}`);
        this.abordajeForm.reset();
        this.loadBoletos();
        this.loadFormData();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Error en el abordaje');
        this.isSubmitting.set(false);
      }
    });
  }

  protected finishTravel(boleto: Boleto): void {
    if (!boleto.id) return;
    const payload = { estado: 'completado', finViaje: new Date().toISOString() };
    this.boletoServiceInst.updateBoleto(Number(boleto.id), payload).subscribe({
      next: () => { this.toastService.success('Viaje finalizado'); this.loadBoletos(); }
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
        this.closeCancelModal();
      },
      error: () => { this.toastService.error('No se pudo cancelar'); this.closeCancelModal(); }
    });
  }

  // --- HELPERS UI ---
  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onStatusFilterChange(status: string): void {
    this.statusFilter.set(status as StatusFilter);
  }

  protected onSortChange(sort: 'recent' | 'oldest'): void {
    this.sortBy.set(sort);
  }

  protected getStatusClass(status: string | undefined): string {
    return `badge-${(status || 'ACTIVO').toLowerCase()}`;
  }

  protected getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      ACTIVO: 'En viaje', COMPLETADO: 'Finalizado', CANCELADO: 'Cancelado',
    };
    return statusMap[status.toUpperCase()] || status;
  }

  protected getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = { ACTIVO: '🚌', COMPLETADO: '✓', CANCELADO: '✕' };
    return iconMap[status.toUpperCase()] || '○';
  }

  protected formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  protected retryLoad(): void {
    this.loadBoletos();
  }
}