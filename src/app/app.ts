import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';
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
  imports: [RouterOutlet, MainLayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // El servicio de tema se inicializa automáticamente
    console.log('Tema actual:', this.themeService.currentTheme());
  }

  /**
   * Alterna el tema de la aplicación
   */
  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
