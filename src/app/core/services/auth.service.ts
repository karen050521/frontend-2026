import { Injectable, signal, computed } from '@angular/core';

/**
 * Interfaz del usuario autenticado
 */
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

/**
 * AuthService - Servicio de autenticación
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona el estado de autenticación
 * - Open/Closed: Extensible para diferentes métodos de autenticación
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Estado del usuario actual
  private readonly _currentUser = signal<User | null>(null);
  
  // Señales públicas de solo lectura
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    // Cargar usuario desde localStorage si existe
    this.loadUserFromStorage();
  }

  /**
   * Simula el inicio de sesión (en producción, esto sería una llamada HTTP)
   */
  login(email: string, password: string): Promise<User> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user: User = {
          id: '1',
          name: 'María González',
          email: email,
          photoUrl: 'https://ui-avatars.com/api/?name=Maria+Gonzalez&background=ec4899&color=fff'
        };
        
        this._currentUser.set(user);
        this.saveUserToStorage(user);
        resolve(user);
      }, 1000);
    });
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem('currentUser');
  }

  /**
   * Guarda el usuario en localStorage
   */
  private saveUserToStorage(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  /**
   * Carga el usuario desde localStorage
   */
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this._currentUser.set(user);
      } catch (error) {
        console.error('Error al cargar usuario desde localStorage', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  /**
   * Simula el login automático (para pruebas)
   */
  autoLogin(): void {
    this.login('maria@example.com', 'password123');
  }
}
