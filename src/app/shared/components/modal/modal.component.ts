import { Component, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ModalComponent - Componente modal reutilizable
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona la visualización y comportamiento del modal
 * - Open/Closed: Extensible mediante contenido proyectado
 * - Dependency Inversion: Emite eventos en lugar de gestionar lógica de negocio
 * 
 * @example
 * // Como confirmación
 * <app-modal 
 *   [isOpen]="modalOpen()" 
 *   [title]="'Confirmar acción'"
 *   [type]="'confirm'"
 *   (onConfirm)="handleConfirm()"
 *   (onCancel)="handleCancel()">
 *   <p>¿Estás seguro de realizar esta acción?</p>
 * </app-modal>
 * 
 * @example
 * // Como formulario
 * <app-modal 
 *   [isOpen]="modalOpen()" 
 *   [title]="'Crear usuario'"
 *   [showFooter]="false"
 *   (onClose)="handleClose()">
 *   <form (ngSubmit)="handleSubmit()">
 *     <!-- Contenido del formulario -->
 *   </form>
 * </app-modal>
 */

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  // Inputs
  /** Controla la visibilidad del modal */
  isOpen = input<boolean>(false);
  
  /** Título del modal */
  title = input<string>('');
  
  /** Tipo de modal: 'info', 'confirm', 'warning', 'error' */
  type = input<'info' | 'confirm' | 'warning' | 'error'>('info');
  
  /** Texto del botón de confirmación */
  confirmText = input<string>('Confirmar');
  
  /** Texto del botón de cancelación */
  cancelText = input<string>('Cancelar');
  
  /** Mostrar el footer con botones */
  showFooter = input<boolean>(true);
  
  /** Mostrar botón de cerrar (X) */
  showCloseButton = input<boolean>(true);
  
  /** Permitir cerrar al hacer clic fuera del modal */
  closeOnBackdrop = input<boolean>(true);
  
  /** Tamaño del modal: 'sm', 'md', 'lg', 'xl' */
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  
  /** Mostrar botón de cancelar */
  showCancelButton = input<boolean>(true);
  
  // Outputs
  /** Evento emitido al confirmar */
  onConfirm = output<void>();
  
  /** Evento emitido al cancelar */
  onCancel = output<void>();
  
  /** Evento emitido al cerrar el modal */
  onClose = output<void>();
  
  // Estado interno
  protected readonly isAnimating = signal(false);
  
  constructor() {
    // Efecto para manejar animaciones
    effect(() => {
      if (this.isOpen()) {
        this.isAnimating.set(true);
        this.lockBodyScroll();
      } else {
        this.unlockBodyScroll();
      }
    });
  }
  
  /**
   * Maneja el clic en el backdrop
   */
  protected handleBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.close();
    }
  }
  
  /**
   * Cierra el modal
   */
  protected close(): void {
    this.onClose.emit();
  }
  
  /**
   * Maneja la confirmación
   */
  protected confirm(): void {
    this.onConfirm.emit();
  }
  
  /**
   * Maneja la cancelación
   */
  protected cancel(): void {
    this.onCancel.emit();
  }
  
  /**
   * Bloquea el scroll del body
   */
  private lockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Desbloquea el scroll del body
   */
  private unlockBodyScroll(): void {
    document.body.style.overflow = '';
  }
  
  /**
   * Obtiene la clase CSS según el tipo de modal
   */
  protected getTypeClass(): string {
    const typeClasses = {
      info: 'modal-info',
      confirm: 'modal-confirm',
      warning: 'modal-warning',
      error: 'modal-error'
    };
    return typeClasses[this.type()];
  }
  
  /**
   * Obtiene la clase CSS según el tamaño del modal
   */
  protected getSizeClass(): string {
    const sizeClasses = {
      sm: 'modal-sm',
      md: 'modal-md',
      lg: 'modal-lg',
      xl: 'modal-xl'
    };
    return sizeClasses[this.size()];
  }
}
