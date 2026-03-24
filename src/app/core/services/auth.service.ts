import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiConfig } from '../config/api.config';
import { firstValueFrom } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

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
 * Interfaz para el payload del JWT
 */
interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: any;
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
   * Inicia sesión con email, contraseña y token de reCAPTCHA
   */
  login(email: string, password: string, recaptchaToken: string): Promise<User> {
    return firstValueFrom(
      this.http.post<LoginResponse>(`${apiConfig.baseUrl}/api/public/auth/login`, {
        email,
        password,
        recaptchaToken,
      }),
    ).then((response) => {
      if (response) {
        const user = response.user;
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
   * Obtiene el token JWT del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Valida si el token es válido y no ha expirado
   */
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: JwtPayload = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp > currentTime;
    } catch (error) {
      // Token inválido o malformado
      return false;
    }
  }

/**
 * Obtiene el rol del usuario desde el token JWT
 */
getUserRole(): string {
  const token = this.getToken();
  if (!token) return '';

  try {
    const { role } = jwtDecode<JwtPayload>(token);
    return role || '';
  } catch {
    return '';
  }
}

  /**
   * Verifica si el usuario está autenticado y el token es válido
   */
  isAuthenticatedAndValid(): boolean {
    return this.isAuthenticated() && this.isTokenValid();
  }

  /**
   * Guarda el usuario en localStorage
   */
  private saveUserToStorage(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  /**
   * Carga el usuario desde localStorage si el token es válido
   */
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    const token = this.getToken();

    if (userJson && token && this.isTokenValid()) {
      try {
        const user = JSON.parse(userJson) as User;
        this._currentUser.set(user);
      } catch (error) {
        // Limpiar datos corruptos
        this.logout();
      }
    } else if (userJson || token) {
      // Datos inconsistentes o token inválido, limpiar
      this.logout();
    }
  }

  /**
   * Simula el login automático (para pruebas)
   */
  autoLogin(): void {
    this.login('maria@example.com', 'password123', '');
  }
}
