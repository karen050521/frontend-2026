import { Component, signal, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * SidebarComponent - Menú lateral reactivo al rol persistido
 */

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  // 1. IMPORTANTE: Usamos la señal reactiva del servicio. 
  // Esta señal ya tiene el valor del localStorage ('ciudadano', 'admin', etc.)
  public readonly userRole = this.authService.activeRole;

  // Input para controlar visibilidad
  public readonly isOpen = input<boolean>(false);

  // Output para cerrar el sidebar
  public readonly close = output<void>();

  // Menú de navegación base (puedes dejarlo vacío si todo lo manejas por roles en el HTML)
  protected readonly menuItems = signal<MenuItem[]>([]);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly defaultAvatarUrl = 'assets/default-avatar.svg';

  /**
   * Cierra el sidebar
   */
  protected closeSidebar(): void {
    this.close.emit();
  }

  /**
   * Navega a la vista principal según el rol activo
   */
  protected irAVistaPrincipal(): void {
    const currentRole = this.userRole()?.toLowerCase();

    if (currentRole === 'admin') {
      this.router.navigate(['/roles']);
    } else if (currentRole === 'conductor') {
      this.router.navigate(['/mi-bus']);
    } else {
      this.router.navigate(['/dashboard']);
    }
    this.closeSidebar();
  }

  protected getAvatarUrl(): string {
    const photoUrl = this.currentUser()?.photoUrl;
    return photoUrl && photoUrl.trim().length > 0 ? photoUrl : this.defaultAvatarUrl;
  }

  protected onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes(this.defaultAvatarUrl)) {
      return;
    }
    img.src = this.defaultAvatarUrl;
  }
}