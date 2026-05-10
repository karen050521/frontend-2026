import { Component, OnInit, signal, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { jwtDecode } from 'jwt-decode';

/**
 * SidebarComponent - Menú lateral navegable
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona la navegación lateral
 * - Interface Segregation: API simple con input para controlar visibilidad
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
export class SidebarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Input para controlar visibilidad
  public readonly isOpen = input<boolean>(false);

  // Output para cerrar el sidebar
  public readonly close = output<void>();

  // Menú de navegación
  protected readonly menuItems = signal<MenuItem[]>([
    {
      label: 'Listancia',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      route: '/listancia',
    },
    {
      label: 'Roles',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      route: '/roles',
    },
    {
      label: 'Permisos',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      route: '/permissions',
    },
    {
      label: 'UserRole',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      route: '/user-role',
    },
  ]);
  protected readonly userRole = signal<string>('');
  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly defaultAvatarUrl = 'assets/default-avatar.svg';

  ngOnInit(): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.userRole.set('');
      return;
    }

    try {
      const decoded = jwtDecode<{
        role?: string;
        authorities?: Array<{ authority?: string }>;
        roles?: string[];
      }>(token);
      const role = decoded.role || decoded.authorities?.[0]?.authority || decoded.roles?.[0] || '';
      this.userRole.set(role);
    } catch {
      this.userRole.set('');
    }
  }

  /**
   * Cierra el sidebar
   */
  protected closeSidebar(): void {
    this.close.emit();
  }

  protected cambiarVista(role: string): void {
    const normalizedRole = (role || '').trim().toUpperCase();

    if (!normalizedRole) {
      this.router.navigate(['/home']);
      return;
    }

    const routeMap: Record<string, string> = {
      ADMIN: '/roles',
      ROLE_ADMIN: '/roles',
      USER: '/dashboard',
      CIUDADANO: '/dashboard',
      PASAJERO: '/dashboard',
      OPERADOR: '/registro-bus',
      CONDUCTOR: '/dashboard',
    };

    const targetRoute = routeMap[normalizedRole] || '/home';
    this.router.navigate([targetRoute]);
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
