import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * MainLayoutComponent - Layout principal de la aplicación
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Gestiona la estructura del layout
 * - Dependency Inversion: Depende de abstracciones (componentes) no de implementaciones
 */

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    HeaderComponent, 
    SidebarComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  readonly isSidebarOpen = signal(false);

  constructor(private themeService: ThemeService) {}

  /**
   * Alterna la visibilidad del sidebar
   */
  toggleSidebar(): void {
    this.isSidebarOpen.update(value => !value);
  }

  /**
   * Alterna el tema de la aplicación
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Maneja eventos de búsqueda
   */
  handleSearch(query: string): void {
    // Aquí puedes implementar la lógica de búsqueda
  }
}
