import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { UserRoleService, UserRole } from '../../core/services/user-role.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';
import { Role } from '../../core/models/role.model';
import { AssignRolesModalComponent } from '../../shared/components/assign-roles-modal/assign-roles-modal.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

/**
 * UserRoleComponent - Componente para asignar roles a usuarios
 * Muestra tabla con usuarios en vista limpia con modal para asignar roles
 */
@Component({
  selector: 'app-user-role',
  standalone: true,
  imports: [CommonModule, FormsModule, AssignRolesModalComponent, ToastContainerComponent],
  templateUrl: './user-role.component.html',
  styleUrl: './user-role.component.css'
})
export class UserRoleComponent implements OnInit {
  protected userService = signal<any>(null);
  protected roleService = signal<any>(null);
  
  protected selectedUser = signal<User | null>(null);
  protected selectedRoles = signal<string[]>([]);
  protected userRolesMap = signal<Map<string, UserRole[]>>(new Map());
  protected isSaving = signal<boolean>(false);
  
  private toastService = inject(ToastService);
  private tempIdCounter = 0; // Generador de IDs únicos para roles temporales
  
  constructor(
    public userServiceInst: UserService,
    public roleServiceInst: RoleService,
    private userRoleService: UserRoleService
  ) {
    this.userService.set(userServiceInst);
    this.roleService.set(roleServiceInst);
  }
  
  ngOnInit(): void {
    this.loadUsersAndRoles();
  }
  
  /**
   * Carga usuarios y roles
   */
  private loadUsersAndRoles(): void {
    console.log('👥 Loading users and roles...');
    this.userServiceInst.getUsers().subscribe({
      next: (users) => {
        console.log('✅ Users loaded:', users.length);
        users.forEach(user => {
          if (user.id) {
            this.userRoleService.getUserRoles(user.id).subscribe({
              next: (userRoles: UserRole[]) => {
                console.log(`🎯 Loaded ${userRoles.length} roles for user ${user.email}`);
                this.userRolesMap.update(map => {
                  const newMap = new Map(map);
                  newMap.set(user.id || '', userRoles);
                  return newMap;
                });
              },
              error: (error) => {
                // Error silencioso, el caché local funciona
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('❌ Error loading users:', error);
        this.toastService.error('Error al cargar usuarios');
      }
    });
    
    this.roleServiceInst.getRoles().subscribe({
      next: (roles) => {
        console.log('✅ Roles loaded:', roles.length);
        // Roles cargados correctamente
      },
      error: (error) => {
        console.error('❌ Error loading roles:', error);
        this.toastService.error('Error al cargar roles');
      }
    });
  }

  /**
   * Abre el modal para asignar roles a un usuario
   */
  openRolesModal(user: User): void {
    console.log('🔓 Opening roles modal for:', user.email);
    this.selectedUser.set(user);
    this.isSaving.set(true);
    
    if (user.id) {
      this.userRoleService.getUserRoles(user.id).subscribe({
        next: (backendUserRoles: UserRole[]) => {
          console.log(`📋 Backend roles loaded: ${backendUserRoles.length} roles`);
          this.userRolesMap.update(map => {
            const newMap = new Map(map);
            newMap.set(user.id || '', backendUserRoles);
            return newMap;
          });
          
          const roleIds = backendUserRoles
            .map(ur => ur.role?.id || (ur as any).roleId)
            .filter((id): id is string => !!id);
          console.log('🎯 Selected role IDs:', roleIds);
          this.selectedRoles.set(roleIds);
          this.isSaving.set(false);
        },
        error: (error) => {
          console.error('⚠️ Error loading roles, using cache:', error);
          const currentRoles = this.userRolesMap().get(user.id || '') || [];
          const roleIds = currentRoles
            .map(ur => ur.role?.id || (ur as any).roleId)
            .filter((id): id is string => !!id);
          this.selectedRoles.set(roleIds);
          this.isSaving.set(false);
        }
      });
    } else {
      this.selectedRoles.set([]);
      this.isSaving.set(false);
    }
  }

  /**
   * Cierra el modal de roles
   */
  closeRolesModal(): void {
    this.selectedUser.set(null);
    this.selectedRoles.set([]);
  }

  /**
   * Guarda los cambios de roles desde el modal
   */
  saveRolesFromModal(selectedRoleIds: string[]): void {
    console.log('💾 Saving roles from modal:', selectedRoleIds);
    const user = this.selectedUser();
    if (!user?.id) return;

    const userId = user.id;
    this.isSaving.set(true);

    const currentUserRoles = this.userRolesMap().get(userId) || [];
    const currentRoleIds = new Set(
      currentUserRoles
        .map(ur => ur.role?.id || (ur as any).roleId)
        .filter((id): id is string => !!id)
    );

    const selectedSet = new Set(selectedRoleIds);

    const rolesToAdd = selectedRoleIds.filter(id => !currentRoleIds.has(id));
    const rolesToRemove = Array.from(currentRoleIds).filter(id => !selectedSet.has(id));

    console.log('➕ Roles to add:', rolesToAdd);
    console.log('➖ Roles to remove:', rolesToRemove);

    let operations = 0;
    const totalOperations = rolesToAdd.length + rolesToRemove.length;

    if (totalOperations === 0) {
      console.log('ℹ️ No changes detected');
      this.isSaving.set(false);
      this.closeRolesModal();
      return;
    }

    const checkCompletion = () => {
      operations++;
      console.log(`⏳ Operation ${operations}/${totalOperations} completed`);
      if (operations === totalOperations) {
        console.log('✅ All operations completed');
        this.isSaving.set(false);
        this.updateLocalRoles(userId, user, rolesToAdd, rolesToRemove);
        this.toastService.success(`Roles guardados para ${user.email}`);
        this.closeRolesModal();
      }
    };

    rolesToAdd.forEach(roleId => {
      console.log(`🔄 Assigning role ${roleId}...`);
      this.userRoleService.assignRoleToUser(userId, roleId).subscribe({
        next: () => {
          console.log(`✅ Role ${roleId} assigned successfully`);
          checkCompletion();
        },
        error: (error) => {
          console.error(`❌ Error assigning role ${roleId}:`, error);
          this.toastService.error('Error al asignar el rol');
          checkCompletion();
        }
      });
    });

    rolesToRemove.forEach(roleId => {
      const userRole = currentUserRoles.find(
        ur => (ur.role?.id || (ur as any).roleId) === roleId
      );

      if (userRole?.id) {
        console.log(`🔄 Removing role ${roleId}...`);
        this.userRoleService.removeRoleFromUser(userRole.id).subscribe({
          next: () => {
            console.log(`✅ Role ${roleId} removed successfully`);
            checkCompletion();
          },
          error: (error) => {
            console.error(`❌ Error removing role ${roleId}:`, error);
            this.toastService.error('Error al remover el rol');
            checkCompletion();
          }
        });
      } else {
        console.log(`⚠️ UserRole not found for role ${roleId}`);
        checkCompletion();
      }
    });
  }

  /**
   * Actualiza el mapa de roles local después de guardar
   */
  private updateLocalRoles(
    userId: string,
    user: User,
    rolesToAdd: string[],
    rolesToRemove: string[]
  ): void {
    // Agregar nuevos roles
    rolesToAdd.forEach(roleId => {
      const role = this.roleServiceInst.roles().find(r => r.id === roleId);
      if (role) {
        this.userRolesMap.update(map => {
          const newMap = new Map(map);
          const userRoles = newMap.get(userId) || [];
          this.tempIdCounter++;
          userRoles.push({
            id: `temp_${Date.now()}_${this.tempIdCounter}`,
            user: { id: userId, email: user.email },
            role: { id: role.id, name: role.name }
          });
          newMap.set(userId, userRoles);
          return newMap;
        });
      }
    });

    // Remover roles
    rolesToRemove.forEach(roleId => {
      this.userRolesMap.update(map => {
        const newMap = new Map(map);
        const userRoles = newMap.get(userId) || [];
        const filtered = userRoles.filter(
          ur => (ur.role?.id || (ur as any).roleId) !== roleId
        );
        newMap.set(userId, filtered);
        return newMap;
      });
    });
  }

  /**
   * Remueve un rol directamente desde la tabla
   */
  removeRoleDirectly(userId: string, userRoleId: string): void {
    console.log('🗑️ Removing role directly:', { userId, userRoleId });
    this.isSaving.set(true);

    this.userRoleService.removeRoleFromUser(userRoleId).subscribe({
      next: () => {
        console.log('✅ Role removed successfully');
        this.userRolesMap.update(map => {
          const newMap = new Map(map);
          const userRoles = newMap.get(userId) || [];
          const filtered = userRoles.filter(ur => ur.id !== userRoleId);
          newMap.set(userId, filtered);
          return newMap;
        });

        this.toastService.success('Rol removido');
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('❌ Error removing role:', error);
        this.toastService.error('Error al remover el rol');
        this.isSaving.set(false);
      }
    });
  }

  /**
   * Obtiene cantidad de roles asignados a un usuario
   */
  getRolesCount(userId: string): number {
    const userRoles = this.userRolesMap().get(userId) || [];
    return userRoles.length;
  }

  /**
   * Obtiene la URL de la foto del usuario o un placeholder
   */
  getUserPhotoUrl(user: User): string {
    if (user.photo) {
      return user.photo;
    }
    const name = user.email?.split('@')[0] || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5`;
  }
}

