import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  // Input para controlar visibilidad
  public readonly isOpen = input<boolean>(false);
  
  // Output para cerrar el sidebar
  public readonly close = output<void>();

  // Menú de navegación
  protected readonly menuItems = signal<MenuItem[]>([
    { label: 'Listancia', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', route: '/listancia' },
    { label: 'Roles', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', route: '/roles' },
    { label: 'UserRole', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', route: '/user-role' },
  ]);

  /**
   * Cierra el sidebar
   */
  protected closeSidebar(): void {
    this.close.emit();
  }
}
