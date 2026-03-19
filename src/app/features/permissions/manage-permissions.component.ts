import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PermissionService } from '../../core/services/permission.service';
import { Permission, CreatePermissionDto } from '../../core/models/permission.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';

/**
 * ManagePermissionsComponent - Componente para crear y gestionar permisos
 */
@Component({
  selector: 'app-manage-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './manage-permissions.component.html',
  styleUrl: './manage-permissions.component.css'
})
export class ManagePermissionsComponent implements OnInit {
  protected readonly showCreateModal = signal(false);
  protected readonly showEditModal = signal(false);
  protected readonly permissionForm: FormGroup;
  protected selectedPermission: Permission | null = null;
  
  private readonly httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  protected readonly methods = this.httpMethods;
  
  constructor(
    protected permissionService: PermissionService,
    private fb: FormBuilder
  ) {
    this.permissionForm = this.fb.group({
      url: ['', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(255),
        Validators.pattern(/^\/[\w\-\/]*$/)
      ]],
      method: ['GET', Validators.required],
      model: ['', [Validators.maxLength(255)]]
    });
  }
  
  ngOnInit(): void {
    this.loadPermissions();
  }
  
  /**
   * Carga la lista de permisos
   */
  private loadPermissions(): void {
    this.permissionService.getPermissions().subscribe({
      error: (error) => {
        console.error('Error al cargar permisos:', error);
      }
    });
  }
  
  /**
   * Abre el modal para crear un nuevo permiso
   */
  protected openCreateModal(): void {
    this.permissionForm.reset({ method: 'GET' });
    this.showCreateModal.set(true);
  }
  
  /**
   * Cierra el modal de creación
   */
  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.permissionForm.reset();
  }
  
  /**
   * Abre el modal para editar un permiso existente
   */
  protected openEditModal(permission: Permission): void {
    this.selectedPermission = permission;
    this.permissionForm.patchValue({
      url: permission.url,
      method: permission.method,
      model: permission.model
    });
    this.showEditModal.set(true);
  }
  
  /**
   * Cierra el modal de edición
   */
  protected closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedPermission = null;
    this.permissionForm.reset();
  }
  
  /**
   * Maneja la creación de un nuevo permiso
   */
  protected handleCreatePermission(): void {
    if (this.permissionForm.invalid) {
      this.markFormGroupTouched(this.permissionForm);
      return;
    }
    
    const permissionData: CreatePermissionDto = this.permissionForm.value;
    
    this.permissionService.createPermission(permissionData).subscribe({
      next: (newPermission) => {
        console.log('Permiso creado:', newPermission);
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error al crear permiso:', error);
      }
    });
  }
  
  /**
   * Maneja la actualización de un permiso
   */
  protected handleUpdatePermission(): void {
    if (this.permissionForm.invalid || !this.selectedPermission?.id) {
      this.markFormGroupTouched(this.permissionForm);
      return;
    }
    
    this.permissionService.updatePermission(
      this.selectedPermission.id,
      this.permissionForm.value
    ).subscribe({
      next: (updatedPermission) => {
        console.log('Permiso actualizado:', updatedPermission);
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error al actualizar permiso:', error);
      }
    });
  }
  
  /**
   * Maneja la eliminación de un permiso
   */
  protected handleDeletePermission(permission: Permission): void {
    if (!permission.id) return;
    
    const confirmed = confirm(
      `¿Está seguro de que desea eliminar el permiso para ${permission.url} (${permission.method})?`
    );
    
    if (confirmed) {
      this.permissionService.deletePermission(permission.id).subscribe({
        next: () => {
          console.log('Permiso eliminado');
        },
        error: (error) => {
          console.error('Error al eliminar permiso:', error);
        }
      });
    }
  }
  
  /**
   * Valida si un campo tiene errores y ha sido tocado
   */
  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.permissionForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
  
  /**
   * Obtiene el mensaje de error para un campo
   */
  protected getErrorMessage(fieldName: string): string {
    const field = this.permissionForm.get(fieldName);
    
    if (!field?.errors) return '';
    
    if (field.errors['required']) return `${fieldName} es requerido`;
    if (field.errors['minlength']) return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `${fieldName} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['pattern']) return `${fieldName} tiene un formato inválido`;
    
    return 'Campo inválido';
  }
  
  /**
   * Marca todos los campos como tocados para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
