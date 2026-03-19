import { Component, signal, OnInit } from '@angular/core';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';
import { GlobalModalComponent } from './shared/components/global-modal/global-modal.component';
import { ThemeService } from './core/services/theme.service';

/**
 * App - Componente raíz de la aplicación
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo inicializa la aplicación
 * - Dependency Injection: Inyecta servicios necesarios
 */

@Component({
  selector: 'app-root',
  imports: [MainLayoutComponent, GlobalModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // El servicio de tema se inicializa automáticamente
  }

  /**
   * Alterna el tema de la aplicación
   */
  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
