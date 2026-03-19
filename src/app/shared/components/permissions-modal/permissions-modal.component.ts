import { Component, Input, Output, EventEmitter, signal, effect, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../core/models/role.model';
import { Permission, RolePermission } from '../../../core/models/permission.model';
import { PermissionService } from '../../../core/services/permission.service';
import { RolePermissionService } from '../../../core/services/role-permission.service';
import { ModalComponent } from '../modal/modal.component';

interface PermissionGroup {
  endpoint: string;
  permissions: {
    permission: Permission;
    isAssigned: boolean;
  }[];
}

@Component({
  selector: 'app-permissions-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal 
      [isOpen]="isOpen()" 
      [title]="'Asignar Permisos a ' + (selectedRole()?.name || '')"
      [size]="'lg'"
      [showFooter]="false"
      (onClose)="onClose.emit()">
      
      <div class="permissions-modal-content">
        <!-- Loading State -->
        @if (loading()) {
          <div class="loading-container">
            <div class="spinner"></div>
            <p>Cargando permisos...</p>
          </div>
        }
        
        <!-- Error State -->
        @else if (hasLoadError()) {
          <div class="error-container">
            <div class="error-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p class="error-text">Error al cargar los permisos disponibles</p>
            <small>Por favor, intenta nuevamente o contacta al administrador</small>
          </div>
        }
        
        <!-- Permissions Grid -->
        @else if (permissionGroups().length > 0) {
          <div class="permissions-container">
            <!-- Search -->
            <div class="search-container">
              <input 
                type="text" 
                class="search-input"
                placeholder="Buscar endpoint..."
                [(ngModel)]="searchTerm"
                (ngModelChange)="filterPermissions()">
            </div>
            
            <!-- Info Message -->
            <div class="info-message">
              <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Selecciona los permisos que deseas asignar a este rol. Los cambios se guardarán al hacer clic en "Guardar Cambios".</span>
            </div>
            
            <!-- Permission Groups -->
            <div class="permission-groups">
              @for (group of filteredGroups(); track group.endpoint) {
                <div class="endpoint-group">
                  <div class="endpoint-header">
                    <div class="endpoint-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="endpoint-icon-svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                      </svg>
                    </div>
                    <h4 class="endpoint-name">{{ group.endpoint || 'Sin endpoint' }}</h4>
                    <span class="endpoint-count">({{ group.permissions.length }} método{{ group.permissions.length !== 1 ? 's' : '' }})</span>
                  </div>
                  <div class="methods-grid">
                    @for (item of group.permissions; track item.permission.id) {
                      @if (item.permission && item.permission.method) {
                        <div class="method-checkbox">
                          <div class="checkbox-wrapper">
                            <input 
                              type="checkbox" 
                              [id]="item.permission.id"
                              [checked]="item.isAssigned"
                              (change)="togglePermission(item.permission, $event)">
                            <label [for]="item.permission.id">
                              <span class="method-badge" [class]="'badge-' + (item.permission.method || 'get').toLowerCase()">
                                {{ item.permission.method || 'GET' }}
                              </span>
                              <span class="permission-description">
                                {{ item.permission.model || 'Sin descripción' }}
                              </span>
                            </label>
                          </div>
                        </div>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
        
        <!-- Empty State -->
        @else {
          <div class="empty-container">
            <p>No hay permisos disponibles</p>
          </div>
        }
        
        <!-- Actions -->
        <div class="modal-actions">
          <button class="btn-secondary" (click)="onClose.emit()">Cerrar</button>
          <button 
            class="btn-primary" 
            (click)="savePermissions()"
            [disabled]="saving()">
            {{ saving() ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .permissions-modal-content {
      padding: 20px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #ec4899;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
    }
    
    .error-icon {
      width: 60px;
      height: 60px;
      color: #ef4444;
      margin-bottom: 16px;
      
      svg {
        width: 100%;
        height: 100%;
      }
    }
    
    .error-text {
      margin: 0;
      color: #111827;
      font-weight: 600;
      font-size: 15px;
    }
    
    small {
      margin-top: 8px;
      color: #6b7280;
      font-size: 12px;
    }
    
    .search-container {
      margin-bottom: 24px;
    }
    
    .search-input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      
      &:focus {
        outline: none;
        border-color: #ec4899;
        box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
      }
    }
    
    .info-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #1e40af;
    }
    
    .info-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: #3b82f6;
    }
    
    .permission-groups {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-height: 500px;
      overflow-y: auto;
    }
    
    .endpoint-group {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background-color: #f9fafb;
    }
    
    .endpoint-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 2px solid #ec4899;
    }
    
    .endpoint-icon {
      width: 24px;
      height: 24px;
      color: #ec4899;
      flex-shrink: 0;
    }
    
    .endpoint-icon-svg {
      width: 100%;
      height: 100%;
    }
    
    .endpoint-name {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      flex: 1;
      font-family: 'Courier New', monospace;
      background-color: #f3f4f6;
      padding: 4px 8px;
      border-radius: 4px;
      color: #ec4899;
    }
    
    .endpoint-count {
      font-size: 12px;
      color: #6b7280;
      background-color: #e5e7eb;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }
    
    .methods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
    
    .method-checkbox {
      display: flex;
      align-items: center;
    }
    
    .checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: #f3f4f6;
      }
      
      input[type="checkbox"] {
        cursor: pointer;
        width: 18px;
        height: 18px;
        accent-color: #ec4899;
      }
    }
    
    label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      margin: 0;
    }
    
    .method-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      min-width: 40px;
      text-align: center;
      color: white;
      
      &.badge-get {
        background-color: #3b82f6;
      }
      
      &.badge-post {
        background-color: #10b981;
      }
      
      &.badge-put {
        background-color: #f59e0b;
      }
      
      &.badge-delete {
        background-color: #ef4444;
      }
      
      &.badge-patch {
        background-color: #8b5cf6;
      }
    }
    
    .permission-description {
      font-size: 12px;
      color: #666;
    }
    
    .empty-container {
      padding: 40px;
      text-align: center;
      color: #999;
    }
    
    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
    
    .btn-primary {
      background-color: #ec4899;
      color: white;
      
      &:hover:not(:disabled) {
        background-color: #db2777;
      }
    }
    
    .btn-secondary {
      background-color: #e5e7eb;
      color: #111827;
      
      &:hover:not(:disabled) {
        background-color: #d1d5db;
      }
    }
  `]
})
export class PermissionsModalComponent {
  isOpen = input(false);
  selectedRole = input<Role | null>(null);
  @Output() onClose = new EventEmitter<void>();
  
  permissionGroups = signal<PermissionGroup[]>([]);
  filteredGroups = signal<PermissionGroup[]>([]);
  searchTerm = '';
  loading = signal(false);
  saving = signal(false);
  hasLoadError = signal(false);
  
  private assignedPermissions = new Set<string>();
  private originalAssignedPermissions = new Set<string>();
  private rolePermissionMap = new Map<string, string>(); // permissionId -> rolePermissionId
  
  constructor(
    private permissionService: PermissionService,
    private rolePermissionService: RolePermissionService
  ) {
    effect(() => {
      if (this.isOpen() && this.selectedRole()) {
        this.loadPermissions();
      }
    });
  }
  
  private loadPermissions(): void {
    this.loading.set(true);
    this.hasLoadError.set(false);
    
    // Load all permissions and role's current permissions
    this.permissionService.getPermissions().subscribe({
      next: (permissions) => {
        const roleId = this.selectedRole()?.id;
        if (roleId) {
          this.rolePermissionService.getRolePermissions(roleId).subscribe({
            next: (rolePerms) => {
              this.assignedPermissions.clear();
              this.originalAssignedPermissions.clear();
              this.rolePermissionMap.clear();
              
              console.log('RolePermissions respuesta del backend:', rolePerms);
              
              rolePerms.forEach(rp => {
                // El backend retorna: { id, role, permission }
                // Extraer permissionId desde la estructura anidada
                const permissionId = rp.permission?.id || (rp as any).permissionId;
                const rolePermissionId = rp.id;
                
                if (permissionId) {
                  this.assignedPermissions.add(permissionId);
                  this.originalAssignedPermissions.add(permissionId);
                  
                  // Guardar el mapa para eliminar después
                  if (rolePermissionId) {
                    this.rolePermissionMap.set(permissionId, rolePermissionId);
                  }
                  
                  console.log('Permiso asignado encontrado:', { permissionId, rolePermissionId });
                }
              });
              
              console.log('Estado después de cargar:', {
                assigned: Array.from(this.assignedPermissions),
                map: Object.fromEntries(this.rolePermissionMap)
              });
              
              this.groupPermissions(permissions);
              this.loading.set(false);
            },
            error: (error) => {
              console.warn('No se pudieron cargar los permisos actuales del rol. Continuando sin ellos...', error);
              // Continuar sin los permisos actuales
              this.groupPermissions(permissions);
              this.loading.set(false);
            }
          });
        } else {
          this.groupPermissions(permissions);
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Error al cargar permisos disponibles:', error);
        this.hasLoadError.set(true);
        this.loading.set(false);
      }
    });
  }
  
  private groupPermissions(permissions: Permission[]): void {
    const grouped = new Map<string, PermissionGroup>();
    
    // Filtrar permisos válidos (con url y method)
    const validPermissions = permissions.filter(p => p.url && p.method);
    
    validPermissions.forEach(permission => {
      const endpoint = permission.url || 'Sin endpoint';
      
      if (!grouped.has(endpoint)) {
        grouped.set(endpoint, {
          endpoint,
          permissions: []
        });
      }
      
      grouped.get(endpoint)!.permissions.push({
        permission,
        isAssigned: this.assignedPermissions.has(permission.id || '')
      });
    });
    
    const groups = Array.from(grouped.values())
      .sort((a, b) => a.endpoint.localeCompare(b.endpoint));
    
    this.permissionGroups.set(groups);
    this.filteredGroups.set(groups);
  }
  
  filterPermissions(): void {
    const search = this.searchTerm.toLowerCase();
    const filtered = this.permissionGroups()
      .map(group => ({
        ...group,
        permissions: group.permissions.filter(item => {
          if (!item.permission || !item.permission.url) {
            return false;
          }
          const url = (item.permission.url || '').toLowerCase();
          const model = (item.permission.model || '').toLowerCase();
          return url.includes(search) || model.includes(search);
        })
      }))
      .filter(group => group.permissions.length > 0);
    
    this.filteredGroups.set(filtered);
  }
  
  togglePermission(permission: Permission, event: any): void {
    const permId = permission.id || '';
    
    if (event.target.checked) {
      this.assignedPermissions.add(permId);
    } else {
      this.assignedPermissions.delete(permId);
    }
    
    this.updateGroupsUI();
  }
  
  private updateGroupsUI(): void {
    // Update the UI to reflect current state
    const updated = this.permissionGroups().map(group => ({
      ...group,
      permissions: group.permissions.map(item => ({
        ...item,
        isAssigned: this.assignedPermissions.has(item.permission.id || '')
      }))
    }));
    
    this.permissionGroups.set(updated);
    this.filterPermissions();
  }
  
  savePermissions(): void {
    this.saving.set(true);
    const roleId = this.selectedRole()?.id;
    
    if (!roleId) {
      this.saving.set(false);
      return;
    }
    
    // Determine which permissions to add and which to remove
    const permissionsToAdd = Array.from(this.assignedPermissions)
      .filter(id => !this.originalAssignedPermissions.has(id));
    
    const permissionsToRemove = Array.from(this.originalAssignedPermissions)
      .filter(id => !this.assignedPermissions.has(id));
    
    console.log('Guardando cambios de permisos:', {
      toAdd: permissionsToAdd,
      toRemove: permissionsToRemove
    });
    
    // Execute operations
    let completed = 0;
    let errors = 0;
    const total = permissionsToAdd.length + permissionsToRemove.length;
    
    if (total === 0) {
      this.saving.set(false);
      this.onClose.emit();
      return;
    }
    
    const checkCompletion = () => {
      completed++;
      console.log(`Operación completada: ${completed}/${total}`);
      
      if (completed === total) {
        this.saving.set(false);
        
        if (errors === 0) {
          // Éxito - actualizar el estado original y cerrar modal
          this.originalAssignedPermissions = new Set(this.assignedPermissions);
          this.onClose.emit();
        } else {
          // Hubo errores - recargar permisos actuales
          console.error(`${errors} errores occurred while saving permissions`);
          this.loadPermissions();
        }
      }
    };
    
    // Add permissions
    if (permissionsToAdd.length > 0) {
      permissionsToAdd.forEach(permId => {
        this.rolePermissionService.assignPermissionToRole(roleId, permId).subscribe({
          next: (response) => {
            console.log('Permiso asignado exitosamente:', permId, response);
            checkCompletion();
          },
          error: (error) => {
            console.error('Error al asignar permiso:', permId, error);
            errors++;
            checkCompletion();
          }
        });
      });
    }
    
    // Remove permissions
    if (permissionsToRemove.length > 0) {
      permissionsToRemove.forEach(permId => {
        const rolePermissionId = this.rolePermissionMap.get(permId);
        
        if (rolePermissionId) {
          this.rolePermissionService.removePermissionFromRole(rolePermissionId).subscribe({
            next: (response) => {
              console.log('Permiso removido exitosamente:', permId, response);
              checkCompletion();
            },
            error: (error) => {
              console.error('Error al remover permiso:', permId, error);
              errors++;
              checkCompletion();
            }
          });
        } else {
          console.warn('No se encontró rolePermissionId para:', permId);
          checkCompletion();
        }
      });
    }
  }
}
