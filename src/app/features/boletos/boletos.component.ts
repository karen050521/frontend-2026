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
  RegistrarAbordajeResponse,
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
  private readonly currentUserStorageKey = 'currentUser';

  protected searchQuery = signal<string>('');
  protected statusFilter = signal<StatusFilter>('TODOS');
  protected sortBy = signal<'recent' | 'oldest'>('recent');
  protected buses = signal<BusOption[]>([]);
  protected paraderos = signal<ParaderoOption[]>([]);
  protected isSubmitting = signal<boolean>(false);

  protected metodosPago = [
    { id: 1, nombre: 'Tarjeta' },
    { id: 2, nombre: 'Efectivo' },
    { id: 3, nombre: 'Billetera digital' },
  ];

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
    }).subscribe({
      next: ({ buses, paraderos }) => {
        this.buses.set(buses);
        this.paraderos.set(paraderos);
      },
      error: () => {
        this.toastService.error('No fue posible cargar buses y paraderos');
      },
    });
  }

  /**
   * ESTE ES EL COMPUTED QUE ARREGLA TU VISTA
   * Mapea los datos del backend al formato que el HTML espera
   */
  readonly filteredBoletos = computed(() => {
    const rawBoletos = this.boletoServiceInst.boletos() || [];
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    console.log('--- COMPUTED: Procesando boletos ---');
    console.log('1. Cantidad original en Signal:', rawBoletos.length);

    // 1. Mapear datos de NestJS -> Formato HTML
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

    console.log('2. Después de mapear propiedades:', mapped);

    // 2. Filtrar por estado
    if (status !== 'TODOS') {
      mapped = mapped.filter((b: any) => b.status === status);
      console.log(`3. Filtrado por estado (${status}):`, mapped.length, 'resultados');
    }

    // 3. Filtrar por búsqueda
    if (query) {
      mapped = mapped.filter((b: any) => 
        b.travelDetails.origin.toLowerCase().includes(query) ||
        b.travelDetails.destination.toLowerCase().includes(query) ||
        b.numeroBoleto?.toLowerCase().includes(query) ||
        b.id?.toString().includes(query)
      );
      console.log(`4. Filtrado por texto (${query}):`, mapped.length, 'resultados');
    }

    // 4. Ordenar
    const finalResult = mapped.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return this.sortBy() === 'recent' ? dateB - dateA : dateA - dateB;
    });

    console.log('5. Resultado final enviado al HTML:', finalResult);
    console.log('------------------------------------');
    
    return finalResult;
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
    console.log('Llamando a getBoletosDelUsuario...');
    this.boletoServiceInst.getBoletosDelUsuario().subscribe({
      next: (res) => {
        console.log('Respuesta cruda del Servidor:', res);
        // Nota: Si el servicio actualiza una Signal interna, el computed se disparará solo.
      },
      error: (err) => {
        console.error('Error en la petición de boletos:', err);
        this.toastService.error('Error al cargar los boletos');
      }
    });
  }

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected onStatusFilterChange(status: string): void {
    this.statusFilter.set(status as StatusFilter);
  }

  protected onSortChange(sort: 'recent' | 'oldest'): void {
    this.sortBy.set(sort);
  }

  protected finishTravel(boleto: Boleto): void {
    if (!boleto.id) return;
    this.boletoServiceInst.updateBoleto(boleto.id, { status: 'COMPLETADO', disembarkTime: new Date() })
      .subscribe({
        next: () => {
          this.toastService.success('Viaje finalizado');
          this.loadBoletos();
        }
      });
  }

  protected cancelBoleto(boleto: Boleto): void {
    if (!boleto.id) return;
    if (confirm('¿Cancelar este boleto?')) {
      this.boletoServiceInst.updateBoleto(boleto.id, { status: 'CANCELADO' })
        .subscribe({
          next: () => {
            this.toastService.success('Boleto cancelado');
            this.loadBoletos();
          }
        });
    }
  }

  protected getStatusClass(status: string | undefined): string {
    const s = (status || 'ACTIVO').toLowerCase();
    return `badge-${s}`;
  }

  protected getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      ACTIVO: 'En viaje',
      COMPLETADO: 'Finalizado',
      CANCELADO: 'Cancelado',
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
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  protected retryLoad(): void {
    this.loadBoletos();
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
    const payload: RegistrarAbordajeDto = {
      bus_id: Number(val.bus_id),
      paradero_id: Number(val.paradero_id),
      metodo_pago_id: Number(val.metodo_pago_id),
    };

    this.boletoServiceInst.registrarAbordaje(payload, token).subscribe({
      next: (res) => {
        this.toastService.success('¡Abordaje exitoso!');
        this.abordajeForm.reset();
        this.loadBoletos();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error');
        this.isSubmitting.set(false);
      }
    });
  }

  protected hasFieldError(fieldName: string): boolean {
    const field = this.abordajeForm.get(fieldName);
    return !!field && field.invalid && (field.touched || field.dirty);
  }

  protected getBusLabel(bus: BusOption): string {
    return bus.nombre || bus.placa || `Bus ${bus.id}`;
  }

  protected getParaderoLabel(paradero: ParaderoOption): string {
    return paradero.nombre || paradero.direccion || `Paradero ${paradero.id}`;
  }
}