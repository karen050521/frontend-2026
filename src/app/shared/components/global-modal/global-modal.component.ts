import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../core/services/modal.service';
import { ModalComponent } from '../modal/modal.component';

/**
 * GlobalModalComponent - Modal global conectado al ModalService
 * 
 * Este componente se conecta al ModalService y muestra modales
 * de forma programática desde cualquier parte de la aplicación.
 */
@Component({
  selector: 'app-global-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal 
      [isOpen]="isModalOpen()"
      [title]="modalTitle()"
      [type]="modalType()"
      [confirmText]="modalConfirmText()"
      [cancelText]="modalCancelText()"
      [showFooter]="modalShowFooter()"
      [showCloseButton]="modalShowCloseButton()"
      [closeOnBackdrop]="modalCloseOnBackdrop()"
      [size]="modalSize()"
      [showCancelButton]="modalShowCancelButton()"
      (onConfirm)="handleConfirm()"
      (onCancel)="handleCancel()"
      (onClose)="handleClose()">
      
      <!-- Contenido del mensaje -->
      @if (modalContent()) {
        <p class="text-gray-700 dark:text-gray-300">
          {{ modalContent() }}
        </p>
      }
    </app-modal>
  `
})
export class GlobalModalComponent {
  protected readonly modalService = inject(ModalService);

  // Computed signals para extraer valores del estado del modal
  protected readonly isModalOpen = this.modalService.isOpen;
  protected readonly modalTitle = computed(() => this.modalService.config().title || '');
  protected readonly modalType = computed(() => this.modalService.config().type || 'info');
  protected readonly modalConfirmText = computed(() => this.modalService.config().confirmText || 'Confirmar');
  protected readonly modalCancelText = computed(() => this.modalService.config().cancelText || 'Cancelar');
  protected readonly modalShowFooter = computed(() => this.modalService.config().showFooter !== false);
  protected readonly modalShowCloseButton = computed(() => this.modalService.config().showCloseButton !== false);
  protected readonly modalCloseOnBackdrop = computed(() => this.modalService.config().closeOnBackdrop !== false);
  protected readonly modalSize = computed(() => this.modalService.config().size || 'sm');
  protected readonly modalShowCancelButton = computed(() => this.modalService.config().showCancelButton !== false);
  protected readonly modalContent = this.modalService.content;

  protected handleConfirm(): void {
    this.modalService.confirm();
  }

  protected handleCancel(): void {
    this.modalService.cancel();
  }

  protected handleClose(): void {
    this.modalService.close();
  }
}
