import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BoletoService } from '../../core/services/boleto.service';
import { Boleto, BusOption, ParaderoOption } from '../../core/models/boleto.model';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms'; // 👈 Agrega esta línea si no la tienes

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
  protected misTarjetas = signal<any[]>([]); 
  protected isSubmitting = signal<boolean>(false);

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

  // 🔍 EVALUACIÓN REACTIVA ÚNICA: Mapea tu tarjeta usando 'metodo_pago_id' de tu BD
  protected get selectedTarjeta() {
    const id = this.abordajeForm.get('metodoPagoCiudadano_id')?.value;
    if (!id) return null;
    return this.misTarjetas().find(t => t.metodo_pago_id == id) || null;
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
          return allBuses.filter(bus => bus.enRuta === true);
        }),
        catchError(() => of([]))
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

  private loadBoletos(): void {
    this.boletoServiceInst.getBoletosDelUsuario().subscribe();
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
      }
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
      paraderoDescenso_id: Number(this.paraderoDescensoSeleccionado)
    };

    // 🔥 Enviamos el payload a tu endpoint especializado de descenso
    this.boletoServiceInst.finalizarViaje(payload, token).subscribe({
      next: (res) => {
        // 🎯 CUMPLIMIENTO HU: Mensaje corporativo exacto de la historia
        this.toastService.success(res.mensaje || 'Viaje completado - Gracias por usar nuestro servicio');
        
        // Limpiamos la variable para el próximo viaje
        this.paraderoDescensoSeleccionado = null;
        
        // Refrescamos pantallas y estados
        this.loadBoletos();
        this.loadFormData();
      },
      error: (err) => {
        this.toastService.error(err.message || 'Error al procesar el descenso');
      }
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
      }
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
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  }

  protected retryLoad(): void {
    this.loadBoletos();
    this.loadFormData();
  }
}