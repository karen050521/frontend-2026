import { Injectable, signal } from '@angular/core';
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { HttpClient } from '@angular/common/http';
import { firebaseAuth } from '../config/firebase.config';
import { environment } from '../../../environments/environment';
import { AuthService, User } from './auth.service';
import { firstValueFrom } from 'rxjs';

/**
 * Interface para solicitud de login OAuth al backend (Spring Boot)
 */
interface OAuthLoginRequest {
  email: string;
  name: string;
  photoUrl?: string;
  provider: 'google' | 'github' | 'microsoft';
}

interface OAuthLoginResponse {
  token: string;
  user: User & { photoUrl?: string | null };
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService {
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  /**
   * Login con Google OAuth
   */
  async loginWithGoogle(): Promise<User> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const credential = await signInWithPopup(firebaseAuth, provider);
      const user = this.mapFirebaseUserToUser(credential.user, 'google');

      // Sincronizar con Spring Boot (Puerto 8181)
      await this.syncOAuthWithBackend(user, 'google');

      return user;
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Sincroniza OAuth con el backend de Spring Boot
   */
  private async syncOAuthWithBackend(
    user: User,
    provider: 'google' | 'github' | 'microsoft',
  ): Promise<void> {
    try {
      const request: OAuthLoginRequest = {
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl || undefined,
        provider,
      };

      // USAMOS EL PUERTO 8181 DESDE EL ENVIRONMENT
      const url = `${environment.apiSpringUrl}/api/public/auth/oauth-login`;

      console.log('🔐 Sincronizando con Spring Boot (8181):', url);

      // Enviar datos a Spring Boot para obtener el JWT
      const response = await firstValueFrom(
        this.http.post<OAuthLoginResponse>(url, request)
      );

      console.log('✅ Spring Boot respondió con éxito');

      if (response && response.token) {
        const sessionUser: User = {
          ...response.user,
          photoUrl: response.user.photoUrl || null,
        };

        // Guardamos el token de Spring para usarlo en NestJS (3000)
        this.authService.completeOAuthSession(response.token, sessionUser);
      } else {
        throw new Error('No se recibió token de sesión del servidor');
      }
    } catch (error: any) {
      console.error('❌ Error sincronizando con Spring Boot:', error);

      // Si falla la sincronización, limpiamos Firebase
      await signOut(firebaseAuth);
      
      const detailedError = error?.error?.message || error?.message || 'Error desconocido';
      throw new Error(`Error en servidor de seguridad (8181): ${detailedError}`);
    }
  }

  /**
   * Login con GitHub OAuth
   */
  async loginWithGithub(): Promise<User> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const provider = new GithubAuthProvider();
      provider.addScope('user:email');

      const credential = await signInWithPopup(firebaseAuth, provider);
      const user = this.mapFirebaseUserToUser(credential.user, 'github');

      await this.syncOAuthWithBackend(user, 'github');

      return user;
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }
/**
   * Login con Microsoft OAuth
   * Sincroniza con el backend para obtener token de sesión
   */
  async loginWithMicrosoft(): Promise<User> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const provider = new OAuthProvider('microsoft.com');
      provider.addScope('mail.read');
      provider.setCustomParameters({
        tenant: 'common',
      });

      const credential = await signInWithPopup(firebaseAuth, provider);
      const user = this.mapFirebaseUserToUser(credential.user, 'microsoft');

      // Sincronizar con backend de Spring (8181)
      await this.syncOAuthWithBackend(user, 'microsoft');

      return user;
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }
  /**
   * Mapea un usuario de Firebase a la interfaz User
   */
  private mapFirebaseUserToUser(
    firebaseUser: FirebaseUser,
    provider: string,
  ): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'Usuario',
      photoUrl: firebaseUser.photoURL || null,
    };
  }

  /**
   * Logout sincronizado
   */
  async logout(): Promise<void> {
    try {
      await signOut(firebaseAuth);
      this.authService.logout();
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error));
      throw error;
    }
  }

  private getErrorMessage(error: any): string {
    const code = error?.code;
    switch (code) {
      case 'auth/popup-closed-by-user': return 'Cerraste la ventana de login.';
      case 'auth/popup-blocked': return 'Ventana bloqueada por el navegador.';
      default: return error?.message || 'Error en autenticación.';
    }
  }
}