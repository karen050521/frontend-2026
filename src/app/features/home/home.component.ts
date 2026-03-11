import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ModalService } from '../../core/services/modal.service';

/**
 * HomeComponent - Página de inicio
 */

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  // Modal state
  protected readonly showModal = signal(false);
  protected readonly showFormModal = signal(false);
  
  protected readonly features = [
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Seguridad',
      description: 'Sistema robusto con las mejores prácticas de seguridad'
    },
    {
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      title: 'Rápido',
      description: 'Optimizado para rendimiento y experiencia fluida'
    },
    {
      icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
      title: 'Moderno',
      description: 'Diseño elegante y adaptable a tus necesidades'
    }
  ];
  
  constructor(private modalService: ModalService) {}
  
  /**
   * Muestra modal de confirmación básico
   */
  protected showBasicModal(): void {
    this.showModal.set(true);
  }
  
  /**
   * Muestra modal con formulario
   */
  protected showFormModalExample(): void {
    this.showFormModal.set(true);
  }
  
  /**
   * Maneja la confirmación del modal
   */
  protected handleConfirm(): void {
    console.log('Acción confirmada');
    this.showModal.set(false);
  }
  
  /**
   * Maneja la cancelación del modal
   */
  protected handleCancel(): void {
    console.log('Acción cancelada');
    this.showModal.set(false);
  }
  
  /**
   * Muestra modal de información usando el servicio
   */
  protected async showInfoModal(): Promise<void> {
    await this.modalService.openInfo({
      title: '¡Operación exitosa!',
      message: 'Los cambios se han guardado correctamente.',
      confirmText: 'Entendido'
    });
    console.log('Modal de info cerrado');
  }
  
  /**
   * Muestra modal de advertencia usando el servicio
   */
  protected async showWarningModal(): Promise<void> {
    await this.modalService.openWarning({
      title: 'Advertencia importante',
      message: 'Por favor, revisa los datos antes de continuar con la operación.',
      confirmText: 'Aceptar'
    });
  }
  
  /**
   * Muestra modal de error usando el servicio
   */
  protected async showErrorModal(): Promise<void> {
    await this.modalService.openError({
      title: 'Error al procesar',
      message: 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente más tarde.',
      confirmText: 'Cerrar'
    });
  }
  
  /**
   * Muestra modal de confirmación con el servicio
   */
  protected async showConfirmModal(): Promise<void> {
    const confirmed = await this.modalService.openConfirm({
      title: '¿Eliminar elemento?',
      message: 'Esta acción no se puede deshacer. ¿Estás seguro de que deseas continuar?',
      type: 'warning',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });
    
    if (confirmed) {
      console.log('Usuario confirmó la eliminación');
      // Aquí iría la lógica de eliminación
      await this.modalService.openInfo({
        title: 'Eliminado',
        message: 'El elemento ha sido eliminado exitosamente.'
      });
    } else {
      console.log('Usuario canceló la eliminación');
    }
  }
}
