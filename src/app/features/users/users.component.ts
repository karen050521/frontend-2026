import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

/**
 * UsersComponent - Vista de usuarios del sistema
 * Muestra lista de todos los usuarios registrados
 */
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ToastContainerComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  protected userService = signal<UserService | null>(null);
  protected searchQuery = signal<string>('');

  constructor(
    public userServiceInst: UserService,
    private toastService: ToastService
  ) {
    this.userService.set(userServiceInst);
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Obtiene usuarios filtrados
   */
  protected get filteredUsers() {
    const query = this.searchQuery().toLowerCase();
    const users = this.userServiceInst.users();
    
    if (!query) return users;
    
    return users.filter(user => 
      user.email?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    );
  }

  /**
   * Carga la lista de usuarios
   */
  private loadUsers(): void {
    this.userServiceInst.getUsers().subscribe({
      next: (users) => {
        console.log('✅ Usuarios cargados:', users.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios:', error);
        this.toastService.error('Error al cargar usuarios');
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
   * Obtiene la URL del avatar del usuario
   */
  protected getAvatarUrl(user: User): string {
    if (user.photo) {
      return user.photo;
    }
    const name = user.username || user.email?.split('@')[0] || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ec4899`;
  }

  /**
   * Reintentar carga
   */
  protected retryLoad(): void {
    this.loadUsers();
  }
}
