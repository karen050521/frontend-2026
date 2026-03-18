import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiConfig } from '../config/api.config';

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
 * Interfaz para respuesta de login
 */
export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * AuthService - Servicio de autenticación
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona el estado de autenticación
 * - Open/Closed: Extensible para diferentes métodos de autenticación
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Estado del usuario actual
  private readonly _currentUser = signal<User | null>(null);

  // Señales públicas de solo lectura
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor(private http: HttpClient) {
    // Cargar usuario desde localStorage si existe
    this.loadUserFromStorage();
  }

  /**
   * Inicia sesión con email y contraseña
   */
  login(email: string, password: string): Promise<User> {
    return this.http
      .post<LoginResponse>(`${apiConfig.baseUrl}/api/public/auth/login`, {
        email,
        password,
      })
      .toPromise()
      .then((response) => {
        if (response) {
          const user = response.user;
          // Guardar token en localStorage
          localStorage.setItem('authToken', response.token);
          this._currentUser.set(user);
          this.saveUserToStorage(user);
          return user;
        }
        throw new Error('Respuesta inválida del servidor');
      });
  }

  /**
   * Registra un nuevo usuario
   */
  register(name: string, email: string, password: string): Promise<User> {
    return this.http
      .post<User>(`${apiConfig.baseUrl}/api/public/auth/register`, {
        name,
        email,
        password,
      })
      .toPromise()
      .then((user) => {
        if (!user) throw new Error('Respuesta inválida del servidor');
        return user as User;
      });
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
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
