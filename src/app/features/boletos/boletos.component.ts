import { Component, OnInit, signal } from '@angular/core';
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

/**
 * BoletosComponent - Vista de boletos/tickets del usuario
 * Muestra lista de boletos registrados para viajes
 */
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

  protected boletoService = signal<BoletoService | null>(null);
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
    this.boletoService.set(boletoServiceInst);

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

  /**
   * Carga datos base para selects del formulario
   */
  private loadFormData(): void {
    forkJoin({
      buses: this.boletoServiceInst.getBuses(),
      paraderos: this.boletoServiceInst.getParaderos(),
    }).subscribe({
      next: ({ buses, paraderos }) => {
        this.buses.set(buses);
        this.paraderos.set(paraderos);
      },
      error: (error) => {
        console.error('❌ Error al cargar buses/paraderos:', error);
        this.buses.set([]);
        this.paraderos.set([]);
        this.toastService.error('No fue posible cargar buses y paraderos');
      },
    });
  }

  /**
   * Obtiene boletos filtrados y ordenados
   */
  protected get filteredBoletos() {
    let boletos = this.boletoServiceInst.boletos();

    // Filtrar por usuario actual: obtener id desde localStorage 'currentUser' o desde token
    const currentUserId = this.getCurrentUserId();
    if (currentUserId) {
      boletos = boletos.filter((b) => this.isBoletoOwnedBy(b, currentUserId));
    }

    // Filtrar por estado
    const status = this.statusFilter();
    if (status !== 'TODOS') {
      boletos = boletos.filter((b) => b.status === status);
    }

    // Filtrar por búsqueda
    const query = this.searchQuery().toLowerCase();
    if (query) {
      boletos = boletos.filter(
        (b) =>
          b.travelDetails?.origin?.toLowerCase().includes(query) ||
          b.travelDetails?.destination?.toLowerCase().includes(query) ||
          b.travelDetails?.driverName?.toLowerCase().includes(query) ||
          b.travelDetails?.vehiclePlate?.toLowerCase().includes(query) ||
          b.id?.toString().includes(query),
      );
    }

    // Ordenar
    return boletos.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return this.sortBy() === 'recent' ? dateB - dateA : dateA - dateB;
    });
  }

  /**
   * Obtiene estadísticas de boletos
   */
  protected get stats() {
    const boletos = this.boletoServiceInst.boletos();
    return {
      total: boletos.length,
      activos: boletos.filter((b) => b.status === 'ACTIVO').length,
      completados: boletos.filter((b) => b.status === 'COMPLETADO').length,
      cancelados: boletos.filter((b) => b.status === 'CANCELADO').length,
    };
  }

  /**
   * Carga la lista de boletos
   */

  private loadBoletos(): void {
    const currentUserId = this.getCurrentUserId();
    const boletosRequest = currentUserId
      ? this.boletoServiceInst.getBoletosByUserId(currentUserId)
      : this.boletoServiceInst.getBoletos();

    boletosRequest.subscribe({
      next: (boletos) => {
        console.log('✅ Boletos cargados:', boletos.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar boletos:', error);
        this.boletoServiceInst.resetBoletosState();
        this.toastService.error('Error al cargar los boletos');
      },
    });
  }

  /**
   * Actualiza la búsqueda
   */
  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  /**
   * Cambia el filtro de estado
   */
  protected onStatusFilterChange(status: string): void {
    this.statusFilter.set(status as StatusFilter);
  }

  /**
   * Cambia el ordenamiento
   */
  protected onSortChange(sort: 'recent' | 'oldest'): void {
    this.sortBy.set(sort);
  }

  /**
   * Finaliza un viaje (marca como completado)
   */
  protected finishTravel(boleto: Boleto): void {
    if (!boleto.id) return;

    this.boletoServiceInst
      .updateBoleto(boleto.id, {
        status: 'COMPLETADO',
        disembarkTime: new Date(),
      })
      .subscribe({
        next: () => {
          this.toastService.success('Viaje finalizado correctamente');
        },
        error: (error) => {
          console.error('Error al finalizar viaje:', error);
          this.toastService.error('Error al finalizar el viaje');
        },
      });
  }

  /**
   * Cancela un boleto
   */
  protected cancelBoleto(boleto: Boleto): void {
    if (!boleto.id) return;

    if (confirm('¿Estás seguro de que deseas cancelar este boleto?')) {
      this.boletoServiceInst
        .updateBoleto(boleto.id, {
          status: 'CANCELADO',
        })
        .subscribe({
          next: () => {
            this.toastService.success('Boleto cancelado correctamente');
          },
          error: (error) => {
            console.error('Error al cancelar boleto:', error);
            this.toastService.error('Error al cancelar el boleto');
          },
        });
    }
  }

  /**
   * Obtiene la clase de estilo para el estado del boleto
   */
  protected getStatusClass(status: string | undefined): string {
    const s = (status || 'DESCONOCIDO').toLowerCase();
    return `badge-${s}`;
  }

  /**
   * Obtiene el texto del estado
   */
  protected getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      ACTIVO: 'En viaje',
      COMPLETADO: 'Finalizado',
      CANCELADO: 'Cancelado',
    };
    const key = (status || 'DESCONOCIDO').toUpperCase();
    return statusMap[key] || status || 'Desconocido';
  }

  /**
   * Obtiene el icono según el estado
   */
  protected getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      ACTIVO: '🚌',
      COMPLETADO: '✓',
      CANCELADO: '✕',
    };
    const key = (status || 'DESCONOCIDO').toUpperCase();
    return iconMap[key] || '○';
  }

  /**
   * Formatea la fecha
   */
  protected formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Reintentar carga de boletos
   */
  protected retryLoad(): void {
    this.loadBoletos();
  }

  /**
   * Obtiene el id del usuario actual desde localStorage o desde el token JWT
   */
  private getCurrentUserId(): number | null {
    // 1) intentar desde currentUser guardado por AuthService
    const raw = localStorage.getItem(this.currentUserStorageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { id?: string | number };
        const parsedId = Number(parsed?.id);
        if (Number.isFinite(parsedId)) return parsedId;
      } catch {
        // ignore
      }
    }

    // 2) fallback: intentar extraer del token (sub, id, userId)
    const token = localStorage.getItem(this.tokenStorageKey);
    if (!token) return null;

    try {
      // use dynamic parse to avoid adding new deps; jwt is JSON-safe base64
      const payload = JSON.parse(atob(token.split('.')[1]));
      const tokenId = Number(payload?.id || payload?.userId || payload?.sub);
      return Number.isFinite(tokenId) ? tokenId : null;
    } catch {
      return null;
    }
  }

  /**
   * Comprueba varias formas de relación entre boleto y usuario
   */
  private isBoletoOwnedBy(boleto: any, userId: number): boolean {
    if (!boleto) return false;
    const candidateIds = [
      boleto.userId,
      boleto.user?.id,
      boleto.usuarioId,
      boleto.user_id,
      boleto.ownerId,
      boleto.clientId,
    ];
    for (const v of candidateIds) {
      if (v === undefined || v === null) continue;
      if (Number(v) === userId) return true;
    }
    // También puede haber un campo 'user' con objeto id dentro
    if (boleto.user && typeof boleto.user === 'string' && Number(boleto.user) === userId) return true;
    return false;
  }

  /**
   * Registra abordaje enviando token Bearer manualmente
   */
  protected submitAbordaje(): void {
    if (this.abordajeForm.invalid) {
      this.abordajeForm.markAllAsTouched();
      return;
    }

    const token = localStorage.getItem(this.tokenStorageKey);
    if (!token) {
      this.toastService.error('No se encontró sesión activa');
      return;
    }

    // 1. Bloqueamos el botón inmediatamente
    this.isSubmitting.set(true);

    const rawValue = this.abordajeForm.value;
    const payload: RegistrarAbordajeDto = {
      bus_id: Number(rawValue.bus_id),
      paradero_id: Number(rawValue.paradero_id),
      metodo_pago_id: Number(rawValue.metodo_pago_id),
    };

    // 2. Usamos el servicio (Verifica si es boletoService o boletoServiceInst)
    this.boletoServiceInst.registrarAbordaje(payload, token).subscribe({
      next: (response: RegistrarAbordajeResponse) => {
        // Manejo inteligente del saldo (soporta snake_case y camelCase)
        const saldoRestante = response?.saldo_restante ?? response?.saldoRestante;
        const saldoTexto = typeof saldoRestante === 'number' 
          ? ` - Saldo: $${saldoRestante.toFixed(2)}` 
          : '';

        this.toastService.success(`¡Abordaje exitoso!${saldoTexto}`);
        
        this.abordajeForm.reset();
        this.loadBoletos(); // Refresca la tabla
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('❌ Error al registrar abordaje:', error);
        // Mostramos el mensaje que viene del backend si existe
        const msg = error.error?.message || 'No se pudo registrar el abordaje';
        this.toastService.error(msg);
        this.isSubmitting.set(false);
      },
    });
  }

  protected hasFieldError(fieldName: 'bus_id' | 'paradero_id' | 'metodo_pago_id'): boolean {
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
