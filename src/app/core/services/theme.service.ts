import { Injectable, signal, effect } from '@angular/core';

/**
 * ThemeService - Servicio para gestionar el tema de la aplicación (claro/oscuro)
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona el tema de la aplicación
 * - Open/Closed: Extensible para agregar más temas sin modificar código existente
 * - Interface Segregation: API simple y específica
 */

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'app-theme';
  private readonly _currentTheme = signal<Theme>(this.getInitialTheme());

  // Señal de solo lectura para componentes
  public readonly currentTheme = this._currentTheme.asReadonly();

  constructor() {
    // Effect para aplicar el tema cuando cambia
    effect(() => {
      const theme = this._currentTheme();
      this.applyTheme(theme);
      this.saveTheme(theme);
    });
  }

  /**
   * Obtiene el tema inicial desde localStorage o preferencias del sistema
   */
  private getInitialTheme(): Theme {
    // Primero intentar obtener del localStorage
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    // Si no existe, usar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Aplica el tema al documento
   */
  private applyTheme(theme: Theme): void {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  /**
   * Guarda el tema en localStorage
   */
  private saveTheme(theme: Theme): void {
    localStorage.setItem(this.THEME_STORAGE_KEY, theme);
  }

  /**
   * Cambia al tema especificado
   */
  public setTheme(theme: Theme): void {
    this._currentTheme.set(theme);
  }

  /**
   * Alterna entre tema claro y oscuro
   */
  public toggleTheme(): void {
    const newTheme = this._currentTheme() === 'light' ? 'dark' : 'light';
    this._currentTheme.set(newTheme);
  }

  /**
   * Verifica si el tema actual es oscuro
   */
  public isDarkTheme(): boolean {
    return this._currentTheme() === 'dark';
  }
}
