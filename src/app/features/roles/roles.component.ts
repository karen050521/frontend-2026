import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { Role, CreateRoleDto } from '../../core/models/role.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PermissionsModalComponent } from '../../shared/components/permissions-modal/permissions-modal.component';
import { ModalService } from '../../core/services/modal.service';

/**
 * RolesComponent - Componente para gestión de roles
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona la vista de roles
 * - Dependency Injection: Inyecta servicios necesarios
 * - Open/Closed: Extensible mediante servicios
 */
@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, PermissionsModalComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent implements OnInit {
  // Estado de los modales
  protected readonly showCreateModal = signal(false);
  protected readonly showEditModal = signal(false);
  protected readonly showPermissionsModal = signal(false);
  
  // Rol seleccionado para edición o asignación de permisos
  protected selectedRole: Role | null = null;
  protected selectedRoleForPermissions = signal<Role | null>(null);
  
  // Formulario reactivo
  protected roleForm: FormGroup;
  
  constructor(
    protected roleService: RoleService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    // Inicializar el formulario
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]]
    });
  }
  
  ngOnInit(): void {
    this.loadRoles();
  }
  
  /**
   * Carga la lista de roles desde el backend
   */
  private loadRoles(): void {
    this.roleService.getRoles().subscribe({
      error: (error) => {
        console.error('Error al cargar roles:', error);
      }
    });
  }
  
  /**
   * Abre el modal para crear un nuevo rol
   */
  protected openCreateModal(): void {
    this.roleForm.reset();
    this.showCreateModal.set(true);
  }
  
  /**
   * Cierra el modal de creación
   */
  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.roleForm.reset();
  }
  
  /**
   * Abre el modal para editar un rol existente
   */
  protected openEditModal(role: Role): void {
    this.selectedRole = role;
    this.roleForm.patchValue({
      name: role.name,
      description: role.description
    });
    this.showEditModal.set(true);
  }
  
  /**
   * Cierra el modal de edición
   */
  protected closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedRole = null;
    this.roleForm.reset();
  }
  
  /**
   * Maneja el envío del formulario para crear un rol
   */
  protected handleCreateRole(): void {
    if (this.roleForm.invalid) {
      this.markFormGroupTouched(this.roleForm);
      return;
    }
    
    const roleData: CreateRoleDto = {
      name: this.roleForm.value.name.trim(),
      description: this.roleForm.value.description.trim()
    };
    
    this.roleService.createRole(roleData).subscribe({
      next: async () => {
        this.closeCreateModal();
        await this.modalService.openInfo({
          title: '¡Éxito!',
          message: `El rol "${roleData.name}" ha sido creado correctamente.`,
          confirmText: 'Aceptar'
        });
      },
      error: async (error) => {
        console.error('Error al crear rol:', error);
        await this.modalService.openError({
          title: 'Error al crear rol',
          message: 'No se pudo crear el rol. Por favor, intenta nuevamente.',
          confirmText: 'Cerrar'
        });
      }
    });
  }
  
  /**
   * Maneja el envío del formulario para editar un rol
   */
  protected handleEditRole(): void {
    if (this.roleForm.invalid) {
      this.markFormGroupTouched(this.roleForm);
      return;
    }
    
    if (!this.selectedRole?.id) {
      console.error('No hay rol seleccionado para editar');
      return;
    }
    
    const roleData = {
      name: this.roleForm.value.name.trim(),
      description: this.roleForm.value.description.trim()
    };
    
    this.roleService.updateRole(this.selectedRole.id, roleData).subscribe({
      next: async () => {
        this.closeEditModal();
        await this.modalService.openInfo({
          title: '¡Éxito!',
          message: `El rol "${roleData.name}" ha sido actualizado correctamente.`,
          confirmText: 'Aceptar'
        });
      },
      error: async (error) => {
        console.error('Error al actualizar rol:', error);
        await this.modalService.openError({
          title: 'Error al actualizar rol',
          message: 'No se pudo actualizar el rol. Por favor, intenta nuevamente.',
          confirmText: 'Cerrar'
        });
      }
    });
  }
  
  /**
   * Confirma y elimina un rol
   */
  protected async handleDeleteRole(role: Role): Promise<void> {
    const confirmed = await this.modalService.openConfirm({
      title: '¿Eliminar rol?',
      message: `¿Estás segura de eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`,
      type: 'warning',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });
    
    if (confirmed && role.id) {
      this.roleService.deleteRole(role.id).subscribe({
        next: async () => {
          await this.modalService.openInfo({
            title: 'Rol eliminado',
            message: `El rol "${role.name}" ha sido eliminado exitosamente.`
          });
        },
        error: async (error) => {
          console.error('Error al eliminar rol:', error);
          await this.modalService.openError({
            title: 'Error al eliminar',
            message: 'No se pudo eliminar el rol. Por favor, intenta nuevamente.'
          });
        }
      });
    }
  }
  
  /**
   * Reintenta cargar los roles en caso de error
   */
  protected retryLoad(): void {
    this.roleService.clearError();
    this.loadRoles();
  }
  
  /**
   * Marca todos los campos del formulario como touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  /**
   * Abre el modal para asignar permisos a un rol
   */
  protected openPermissionsModal(role: Role): void {
    this.selectedRoleForPermissions.set(role);
    this.showPermissionsModal.set(true);
  }
  
  /**
   * Cierra el modal de asignación de permisos
   */
  protected closePermissionsModal(): void {
    this.showPermissionsModal.set(false);
    this.selectedRoleForPermissions.set(null);
  }
  
  /**
   * Verifica si un campo es inválido y ha sido tocado
   */
  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.roleForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
  
  /**
   * Obtiene el mensaje de error para un campo
   */
  protected getErrorMessage(fieldName: string): string {
    const field = this.roleForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }
    
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `No debe exceder ${maxLength} caracteres`;
    }
    
    return '';
  }
}
