import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoletoService } from '../../core/services/boleto.service';
import { Boleto } from '../../core/models/boleto.model';
import { ToastService } from '../../core/services/toast.service';

type StatusFilter = 'TODOS' | 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';

/**
 * BoletosComponent - Vista de boletos/tickets del usuario
 * Muestra lista de boletos registrados para viajes
 */
@Component({
  selector: 'app-boletos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boletos.component.html',
  styleUrl: './boletos.component.css'
})
export class BoletosComponent implements OnInit {
  protected boletoService = signal<BoletoService | null>(null);
  protected searchQuery = signal<string>('');
  protected statusFilter = signal<StatusFilter>('TODOS');
  protected sortBy = signal<'recent' | 'oldest'>('recent');

  constructor(
    public boletoServiceInst: BoletoService,
    private toastService: ToastService
  ) {
    this.boletoService.set(boletoServiceInst);
  }

  ngOnInit(): void {
    this.loadBoletos();
  }

  /**
   * Obtiene boletos filtrados y ordenados
   */
  protected get filteredBoletos() {
    let boletos = this.boletoServiceInst.boletos();
    
    // Filtrar por estado
    const status = this.statusFilter();
    if (status !== 'TODOS') {
      boletos = boletos.filter(b => b.status === status);
    }
    
    // Filtrar por búsqueda
    const query = this.searchQuery().toLowerCase();
    if (query) {
      boletos = boletos.filter(b => 
        b.travelDetails?.origin?.toLowerCase().includes(query) ||
        b.travelDetails?.destination?.toLowerCase().includes(query) ||
        b.travelDetails?.driverName?.toLowerCase().includes(query) ||
        b.travelDetails?.vehiclePlate?.toLowerCase().includes(query) ||
        b.id?.toString().includes(query)
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
      activos: boletos.filter(b => b.status === 'ACTIVO').length,
      completados: boletos.filter(b => b.status === 'COMPLETADO').length,
      cancelados: boletos.filter(b => b.status === 'CANCELADO').length
    };
  }

  /**
   * Carga la lista de boletos
   */
  private loadBoletos(): void {
    this.boletoServiceInst.getBoletos().subscribe({
      next: (boletos) => {
        console.log('✅ Boletos cargados:', boletos.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar boletos:', error);
        this.toastService.error('Error al cargar los boletos');
      }
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
    
    this.boletoServiceInst.updateBoleto(boleto.id, {
      status: 'COMPLETADO',
      disembarkTime: new Date()
    }).subscribe({
      next: () => {
        this.toastService.success('Viaje finalizado correctamente');
      },
      error: (error) => {
        console.error('Error al finalizar viaje:', error);
        this.toastService.error('Error al finalizar el viaje');
      }
    });
  }

  /**
   * Cancela un boleto
   */
  protected cancelBoleto(boleto: Boleto): void {
    if (!boleto.id) return;
    
    if (confirm('¿Estás seguro de que deseas cancelar este boleto?')) {
      this.boletoServiceInst.updateBoleto(boleto.id, {
        status: 'CANCELADO'
      }).subscribe({
        next: () => {
          this.toastService.success('Boleto cancelado correctamente');
        },
        error: (error) => {
          console.error('Error al cancelar boleto:', error);
          this.toastService.error('Error al cancelar el boleto');
        }
      });
    }
  }

  /**
   * Obtiene la clase de estilo para el estado del boleto
   */
  protected getStatusClass(status: string): string {
    return `badge-${status.toLowerCase()}`;
  }

  /**
   * Obtiene el texto del estado
   */
  protected getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'ACTIVO': 'En viaje',
      'COMPLETADO': 'Finalizado',
      'CANCELADO': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtiene el icono según el estado
   */
  protected getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      'ACTIVO': '🚌',
      'COMPLETADO': '✓',
      'CANCELADO': '✕'
    };
    return iconMap[status] || '○';
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
      minute: '2-digit'
    });
  }

  /**
   * Reintentar carga de boletos
   */
  protected retryLoad(): void {
    this.loadBoletos();
  }
}
