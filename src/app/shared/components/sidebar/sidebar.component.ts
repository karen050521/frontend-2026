import { Component, signal, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Interface para ítems de menú (si decides usarlos dinámicamente)
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

  // Reactividad total: escucha al servicio o al localStorage si el servicio está vacío
  public readonly userRole = computed(() => {
    return this.authService.activeRole() || localStorage.getItem('user_role') || '';
  });

  // FUNCIONES COMPUTED PARA EL HTML CON CONTROL DE ROLES
  public esAdmin = computed(() => {
    const r = this.userRole().toLowerCase();
    return (
      (r.includes('administrador') && !r.includes('empresa')) || r === '69b1f1e630276cc75c84424a'
    );
  });

  public esEmpresa = computed(() => {
    const r = this.userRole().toLowerCase();
    return r.includes('administrador de empresa') || r.includes('company');
  });

  public esConductor = computed(() => {
    const r = this.userRole().toLowerCase();
    return r.includes('conductor');
  });

  public esCiudadano = computed(() => {
    const r = this.userRole().toLowerCase();
    return r.includes('ciudadano');
  });

  public esAnalista = computed(() => {
    const r = this.userRole().toLowerCase();
    return r.includes('analista');
  });

  public esFinanciero = computed(() => {
    const r = this.userRole().toLowerCase();
    return r.includes('financiero');
  });

  public esGerente = computed(() => {
    const r = this.userRole().toLowerCase();
    return r.includes('gerente');
  });
  // Inputs y Outputs
  public readonly isOpen = input<boolean>(false);
  public readonly close = output<void>();

  // Estado y señales de usuario
  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly defaultAvatarUrl = 'assets/default-avatar.svg';

  /**
   * Cierra el sidebar
   */
  public closeSidebar(): void {
    this.close.emit();
  }

  /**
   * Navega a la vista principal según el rol activo
   */
  protected irAVistaPrincipal(): void {
    const currentRole = this.userRole()?.toLowerCase();

    if (currentRole?.includes('admin')) {
      this.router.navigate(['/roles']);
    } else if (currentRole?.includes('conductor')) {
      this.router.navigate(['/registro-bus']);
    } else {
      this.router.navigate(['/dashboard']);
    }
    this.closeSidebar();
  }

  /**
   * Obtiene la URL del avatar o la de por defecto
   */
  public getAvatarUrl(): string {
    const photoUrl = this.currentUser()?.photoUrl;
    return photoUrl && photoUrl.trim().length > 0 ? photoUrl : this.defaultAvatarUrl;
  }

  /**
   * Maneja errores en la carga de la imagen del avatar
   */
  public onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes(this.defaultAvatarUrl)) {
      return;
    }
    img.src = this.defaultAvatarUrl;
  }
}
