import { Injectable, signal, computed } from '@angular/core';

/**
 * Configuración del modal
 */
export interface ModalConfig {
  title?: string;
  type?: 'info' | 'confirm' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  showFooter?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCancelButton?: boolean;
}

/**
 * Estado del modal
 */
interface ModalState {
  isOpen: boolean;
  config: ModalConfig;
  content?: string;
}

/**
 * ModalService - Servicio para gestionar modales de forma programática
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona el estado y comportamiento de modales
 * - Open/Closed: Extensible mediante configuración
 * - Dependency Inversion: Usa signals para la comunicación reactiva
 * 
 * @example
 * constructor(private modalService: ModalService) {}
 * 
 * showConfirmation() {
 *   this.modalService.openConfirm({
 *     title: '¿Confirmar eliminación?',
 *     message: 'Esta acción no se puede deshacer'
 *   }).then(confirmed => {
 *     if (confirmed) {
 *       // Realizar acción
 *     }
 *   });
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  // Estado del modal
  private readonly modalState = signal<ModalState>({
    isOpen: false,
    config: {}
  });
  
  // Promise resolver para manejar respuestas
  private resolver?: (value: boolean) => void;
  
  /**
   * Signal que indica si el modal está abierto
   */
  readonly isOpen = computed(() => this.modalState().isOpen);
  
  /**
   * Signal con la configuración actual del modal
   */
  readonly config = computed(() => this.modalState().config);
  
  /**
   * Signal con el contenido actual del modal
   */
  readonly content = computed(() => this.modalState().content);
  
  /**
   * Abre un modal de confirmación
   * 
   * @param options - Configuración del modal de confirmación
   * @returns Promise que se resuelve con true si se confirma, false si se cancela
   * 
   * @example
   * const confirmed = await this.modalService.openConfirm({
   *   title: '¿Eliminar usuario?',
   *   message: 'Esta acción no se puede deshacer',
   *   type: 'warning'
   * });
   */
  async openConfirm(options: {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'confirm' | 'warning' | 'error';
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolver = resolve;
      
      this.modalState.set({
        isOpen: true,
        content: options.message,
        config: {
          title: options.title || '¿Confirmar acción?',
          type: options.type || 'confirm',
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          size: options.size || 'sm',
          showFooter: true,
          showCloseButton: true,
          closeOnBackdrop: true,
          showCancelButton: true
        }
      });
    });
  }
  
  /**
   * Abre un modal de información
   * 
   * @param options - Configuración del modal de información
   * @returns Promise que se resuelve cuando se cierra el modal
   * 
   * @example
   * await this.modalService.openInfo({
   *   title: 'Operación exitosa',
   *   message: 'Los cambios se han guardado correctamente'
   * });
   */
  async openInfo(options: {
    title?: string;
    message?: string;
    confirmText?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }): Promise<void> {
    return new Promise((resolve) => {
      this.resolver = () => {
        resolve();
        return true;
      };
      
      this.modalState.set({
        isOpen: true,
        content: options.message,
        config: {
          title: options.title || 'Información',
          type: 'info',
          confirmText: options.confirmText || 'Aceptar',
          size: options.size || 'sm',
          showFooter: true,
          showCloseButton: true,
          closeOnBackdrop: true,
          showCancelButton: false
        }
      });
    });
  }
  
  /**
   * Abre un modal de advertencia
   * 
   * @param options - Configuración del modal de advertencia
   * @returns Promise que se resuelve cuando se cierra el modal
   */
  async openWarning(options: {
    title?: string;
    message?: string;
    confirmText?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }): Promise<void> {
    return new Promise((resolve) => {
      this.resolver = () => {
        resolve();
        return true;
      };
      
      this.modalState.set({
        isOpen: true,
        content: options.message,
        config: {
          title: options.title || 'Advertencia',
          type: 'warning',
          confirmText: options.confirmText || 'Entendido',
          size: options.size || 'sm',
          showFooter: true,
          showCloseButton: true,
          closeOnBackdrop: true,
          showCancelButton: false
        }
      });
    });
  }
  
  /**
   * Abre un modal de error
   * 
   * @param options - Configuración del modal de error
   * @returns Promise que se resuelve cuando se cierra el modal
   */
  async openError(options: {
    title?: string;
    message?: string;
    confirmText?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }): Promise<void> {
    return new Promise((resolve) => {
      this.resolver = () => {
        resolve();
        return true;
      };
      
      this.modalState.set({
        isOpen: true,
        content: options.message,
        config: {
          title: options.title || 'Error',
          type: 'error',
          confirmText: options.confirmText || 'Aceptar',
          size: options.size || 'sm',
          showFooter: true,
          showCloseButton: true,
          closeOnBackdrop: true,
          showCancelButton: false
        }
      });
    });
  }
  
  /**
   * Abre un modal personalizado
   * 
   * @param config - Configuración completa del modal
   */
  open(config: ModalConfig): void {
    this.modalState.set({
      isOpen: true,
      config
    });
  }
  
  /**
   * Cierra el modal actual
   */
  close(): void {
    this.modalState.set({
      isOpen: false,
      config: {}
    });
    
    if (this.resolver) {
      this.resolver(false);
      this.resolver = undefined;
    }
  }
  
  /**
   * Confirma el modal actual
   */
  confirm(): void {
    this.modalState.set({
      isOpen: false,
      config: {}
    });
    
    if (this.resolver) {
      this.resolver(true);
      this.resolver = undefined;
    }
  }
  
  /**
   * Cancela el modal actual
   */
  cancel(): void {
    this.close();
  }
}
