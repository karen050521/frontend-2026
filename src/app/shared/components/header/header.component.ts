import { Component, signal, output, inject, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { AuthService } from '../../../core/services/auth.service';

/**
 * HeaderComponent - Componente de encabezado reutilizable
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona la barra de navegación superior
 * - Dependency Inversion: Emite eventos en lugar de gestionar lógica de negocio
 */

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  // Servicios
  private readonly authService = inject(AuthService);
  
  // Estado del menú móvil
  protected readonly isMobileMenuOpen = signal(false);
  
  // Estado del menú de usuario
  protected readonly isUserMenuOpen = signal(false);
  
  // Exponer señales del servicio de auth
  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  
  // Eventos para comunicación con el padre
  public readonly menuToggle = output<void>();
  public readonly themeToggle = output<void>();
  public readonly search = output<string>();

  /**
   * Alterna el estado del menú móvil
   */
  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  /**
   * Emite evento para alternar el tema
   */
  protected onThemeToggle(): void {
    this.themeToggle.emit();
  }

  /**
   * Emite evento para alternar el menú lateral
   */
  protected onMenuToggle(): void {
    this.menuToggle.emit();
  }

  /**
   * Maneja eventos de búsqueda
   */
  protected onSearch(query: string): void {
    this.search.emit(query);
  }

  /**
   * Alterna el menú de usuario
   */
  protected toggleUserMenu(): void {
    this.isUserMenuOpen.update(value => !value);
  }

  /**
   * Cierra el menú de usuario
   */
  protected closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  /**
   * Cierra los menús al hacer clic fuera
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.relative');
    
    if (!clickedInside && this.isUserMenuOpen()) {
      this.closeUserMenu();
    }
  }

  /**
   * Maneja el inicio de sesión
   */
  protected onLogin(): void {
    // Por ahora, login automático (en producción, abriría un modal de login)
    this.authService.autoLogin();
    this.closeUserMenu();
  }

  /**
   * Maneja el cierre de sesión
   */
  protected onLogout(): void {
    this.authService.logout();
    this.closeUserMenu();
  }
}
