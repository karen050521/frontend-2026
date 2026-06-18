import { Component, signal, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

  private normalizedRole(): string {
    return this.userRole()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // FUNCIONES COMPUTED PARA EL HTML CON CONTROL DE ROLES REALES
  public esAdmin = computed(() => {
    const r = this.normalizedRole();

    return (
      ((r.includes('administrador') || r.includes('adminsitrador') || r === 'admin') &&
        !r.includes('empresa') &&
        !r.includes('financiero') &&
        !r.includes('marketing') &&
        !r.includes('operaciones')) ||
      r === '69b1f1e630276cc75c84424a'
    );
  });

  public esEmpresa = computed(() => {
    const r = this.normalizedRole();

    return (
      r.includes('administrador de empresa') ||
      r.includes('adminsitrador de empresa') ||
      r.includes('gerente de empresa') ||
      r.includes('company') ||
      r.includes('operaciones') || // HU-3-002: supervisor/gerente de operaciones
      r.includes('supervisor')
    );
  });

  public esConductor = computed(() => {
    const r = this.normalizedRole();
    return r.includes('conductor');
  });

  public esCiudadano = computed(() => {
    const r = this.normalizedRole();
    return r.includes('ciudadano');
  });

  public esAnalista = computed(() => {
    const r = this.normalizedRole();
    return r.includes('analista');
  });

  public esFinanciero = computed(() => {
    const r = this.normalizedRole();
    return r.includes('financiero');
  });

  public esGerente = computed(() => {
    const r = this.normalizedRole();
    // 'gerente de operaciones' es supervisor de flota (esEmpresa), no analista/gerente financiero.
    return r.includes('gerente') && !r.includes('operaciones');
  });

  // Inputs y Outputs
  public readonly isOpen = input<boolean>(false);
  public readonly close = output<void>();

  // Estado y señales de usuario
  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly defaultAvatarUrl = 'assets/default-avatar.svg';

  public closeSidebar(): void {
    this.close.emit();
  }

  protected irAVistaPrincipal(): void {
    const currentRole = this.userRole()?.toLowerCase();

    if (currentRole?.includes('admin') || currentRole?.includes('sitrador')) {
      this.router.navigate(['/roles']);
    } else if (currentRole?.includes('conductor')) {
      this.router.navigate(['/features/turno-conductor']);
    } else {
      this.router.navigate(['/dashboard']);
    }
    this.closeSidebar();
  }

  public getAvatarUrl(): string {
    const photoUrl = this.currentUser()?.photoUrl;
    return photoUrl && photoUrl.trim().length > 0 ? photoUrl : this.defaultAvatarUrl;
  }

  public onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes(this.defaultAvatarUrl)) {
      return;
    }
    img.src = this.defaultAvatarUrl;
  }
}
