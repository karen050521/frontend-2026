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
  success: boolean | string;
  message: string;
  sessionId?: string;
  expiresAt?: number | string;
  expiresInSeconds?: number;
}

/**
 * Interfaz para respuesta de verify-2fa
 */
export interface Verify2FAResponse {
  success: boolean | string;
  message: string;
  token?: string;
  user?: User;
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
  private readonly verificationStorageKey = 'isLoginVerificationCompleted';
  private readonly sessionIdStorageKey = 'sessionId';
  private readonly twoFactorExpiresAtStorageKey = '2faExpiresAt';
  private readonly twoFactorAttemptsStorageKey = '2faAttemptsRemaining';
  private readonly twoFactorEmailStorageKey = '2faEmail';

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
  login(email: string, password: string, recaptchaToken: string): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(`${apiConfig.baseUrl}/api/public/auth/login`, {
        email,
        password,
        recaptchaToken,
      }),
    ).then((response) => {
      if (response && this.isSuccessResponse(response.success) && response.sessionId) {
        // Limpiar autenticación previa e iniciar sesión pendiente de 2FA
        this.clearAuthenticatedSession();
        localStorage.setItem(this.sessionIdStorageKey, response.sessionId);
        localStorage.setItem(this.twoFactorEmailStorageKey, email);
        this.setTwoFactorExpiresAt(this.resolveTwoFactorExpiresAt(response));
        localStorage.removeItem(this.twoFactorAttemptsStorageKey);
        this.setVerificationCompleted(false);
        return response;
      }

      throw new Error(response?.message || 'No se pudo iniciar el flujo de verificación.');
    });
  }

  /**
   * Verifica el código de autenticación posterior al login
   */
  verifyLoginCode(code: string): Promise<Verify2FAResponse> {
    const sessionId = localStorage.getItem(this.sessionIdStorageKey);
    if (!sessionId) {
      throw new Error('No hay una sesión pendiente para verificar. Inicia sesión nuevamente.');
    }

    return firstValueFrom(
      this.http.post<void>(`${apiConfig.baseUrl}/api/public/auth/verify-2fa`, {
        sessionId,
        code2FA: code,
      }),
    ).then((response: any) => {
      const typedResponse = response as Verify2FAResponse;

      if (!typedResponse || !this.isSuccessResponse(typedResponse.success)) {
        throw new Error(typedResponse?.message || 'No se pudo verificar el código.');
      }

      if (!typedResponse.token) {
        throw new Error('La respuesta de verificación no incluyó token.');
      }

      this.completeAuthenticatedSession(typedResponse.token, typedResponse.user);
      this.setVerificationCompleted(true);
      localStorage.removeItem(this.sessionIdStorageKey);
      localStorage.removeItem(this.twoFactorAttemptsStorageKey);
      localStorage.removeItem(this.twoFactorExpiresAtStorageKey);

      return typedResponse;
    });
  }

  /**
   * Cancela en backend la sesión pendiente de 2FA (best effort)
   */
  async cancelPendingTwoFactorSession(): Promise<void> {
    const sessionId = this.getPendingSessionId();
    if (!sessionId) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.post<void>(`${apiConfig.baseUrl}/api/public/auth/cancel-2fa`, {
          sessionId,
        }),
      );
    } catch {
      // Best effort: no bloquea el flujo local si falla
    }
  }

  /**
   * Indica si existe una sesión pendiente de verificación 2FA
   */
  hasPendingTwoFactorVerification(): boolean {
    return !!localStorage.getItem(this.sessionIdStorageKey);
  }

  /**
   * Obtiene el sessionId pendiente de verificación
   */
  getPendingSessionId(): string | null {
    return localStorage.getItem(this.sessionIdStorageKey);
  }

  /**
   * Cancela el flujo pendiente de verificación 2FA
   */
  clearPendingTwoFactorVerification(): void {
    this.clearTwoFactorState();
    this.setVerificationCompleted(false);
  }

  /**
   * Guarda intentos restantes de 2FA para mostrarlos en UI
   */
  setTwoFactorAttemptsRemaining(attempts: number): void {
    localStorage.setItem(this.twoFactorAttemptsStorageKey, String(attempts));
  }

  /**
   * Guarda fecha de expiración de 2FA en ms epoch
   */
  setTwoFactorExpiresAt(expiresAtMs: number): void {
    localStorage.setItem(this.twoFactorExpiresAtStorageKey, String(expiresAtMs));
  }

  /**
   * Obtiene fecha de expiración de 2FA en ms epoch
   */
  getTwoFactorExpiresAt(): number | null {
    const rawValue = localStorage.getItem(this.twoFactorExpiresAtStorageKey);
    if (!rawValue) {
      return null;
    }

    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }

  /**
   * Obtiene email asociado al flujo pendiente de 2FA
   */
  getPendingTwoFactorEmail(): string | null {
    return localStorage.getItem(this.twoFactorEmailStorageKey);
  }

  /**
   * Limpia estado local de 2FA y sesión temporal
   */
  clearTwoFactorStateAndSession(): void {
    this.clearTwoFactorState();
    this.clearAuthenticatedSession();
    this.setVerificationCompleted(false);
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
    this.clearAuthenticatedSession();
    localStorage.removeItem(this.verificationStorageKey);
    this.clearTwoFactorState();
  }

  /**
   * Indica si la verificación adicional del login está completada
   */
  isVerificationCompleted(): boolean {
    return localStorage.getItem(this.verificationStorageKey) === 'true';
  }

  /**
   * Persiste el estado de verificación adicional del login
   */
  setVerificationCompleted(isCompleted: boolean): void {
    localStorage.setItem(this.verificationStorageKey, String(isCompleted));
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

        // Compatibilidad con sesiones previas al flujo de verificación
        if (localStorage.getItem(this.verificationStorageKey) === null) {
          this.setVerificationCompleted(true);
        }
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

  /**
   * Determina si el backend indicó éxito usando boolean o string
   */
  private isSuccessResponse(success: boolean | string | undefined): boolean {
    return success === true || success === 'true';
  }

  /**
   * Finaliza sesión autenticada persistiendo token y usuario
   */
  private completeAuthenticatedSession(token: string, user?: User): void {
    localStorage.setItem('authToken', token);

    const sessionUser = user || this.buildUserFromToken(token);
    this._currentUser.set(sessionUser);
    this.saveUserToStorage(sessionUser);
  }

  /**
   * Limpia token y usuario autenticado sin tocar sessionId pendiente
   */
  private clearAuthenticatedSession(): void {
    this._currentUser.set(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }

  /**
   * Limpia únicamente llaves locales del flujo 2FA
   */
  private clearTwoFactorState(): void {
    localStorage.removeItem(this.sessionIdStorageKey);
    localStorage.removeItem(this.twoFactorExpiresAtStorageKey);
    localStorage.removeItem(this.twoFactorAttemptsStorageKey);
    localStorage.removeItem(this.twoFactorEmailStorageKey);
  }

  /**
   * Determina expiración 2FA basada en respuesta backend o fallback de 5 minutos
   */
  private resolveTwoFactorExpiresAt(response: LoginResponse): number {
    if (response.expiresAt !== undefined && response.expiresAt !== null) {
      const numericExpiresAt = Number(response.expiresAt);
      if (Number.isFinite(numericExpiresAt)) {
        return numericExpiresAt > 1_000_000_000_000 ? numericExpiresAt : numericExpiresAt * 1000;
      }
    }

    if (response.expiresInSeconds && Number.isFinite(response.expiresInSeconds)) {
      return Date.now() + response.expiresInSeconds * 1000;
    }

    return Date.now() + 5 * 60 * 1000;
  }

  /**
   * Construye un usuario básico a partir del token cuando el backend no lo envía
   */
  private buildUserFromToken(token: string): User {
    const decoded = jwtDecode<JwtPayload>(token) as JwtPayload & {
      id?: string;
      userId?: string;
      name?: string;
      fullName?: string;
      username?: string;
      email?: string;
      photoUrl?: string;
    };

    const email = decoded.email || decoded.sub || '';

    return {
      id: decoded.id || decoded.userId || decoded.sub || email || 'unknown',
      name: decoded.name || decoded.fullName || decoded.username || email || 'Usuario',
      email,
      photoUrl: decoded.photoUrl,
    };
  }
}
