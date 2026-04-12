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
import { apiConfig } from '../config/api.config';
import { AuthService, User } from './auth.service';
import { firstValueFrom } from 'rxjs';

/**
 * Interface para solicitud de login OAuth al backend
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

/**
 * FirebaseAuthService - Integra OAuth de Firebase con el backend
 * Sincroniza automáticamente con AuthService
 */
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
   * Sincroniza con el backend para obtener token de sesión
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

      // Sincronizar con backend
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
   * Login con GitHub OAuth
   * Sincroniza con el backend para obtener token de sesión
   */
  async loginWithGithub(): Promise<User> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const provider = new GithubAuthProvider();
      provider.addScope('user:email');

      const credential = await signInWithPopup(firebaseAuth, provider);
      const user = this.mapFirebaseUserToUser(credential.user, 'github');

      // Sincronizar con backend
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

      // Sincronizar con backend
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
   * Sincroniza OAuth con el backend
   * Envía los datos del usuario OAuth y obtiene token de sesión
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

      console.log('🔐 Enviando OAuth al backend:', {
        provider,
        email: user.email,
        name: user.name,
      });

      // Enviar datos al backend end obtener token de sesión
      const response = await firstValueFrom(
        this.http.post<OAuthLoginResponse>(
          `${apiConfig.baseUrl}/api/public/auth/oauth-login`,
          request,
        ),
      );

      console.log('✅ Backend respondió:', { token: response.token?.substring(0, 20) + '...' });

      if (response && response.token) {
        const sessionUser: User = {
          ...response.user,
          photoUrl: response.user.photoUrl || null,
        };

        // Sincronizar sesión con AuthService para mantener persistencia consistente
        this.authService.completeOAuthSession(response.token, sessionUser);
      } else {
        throw new Error('No se recibió token de sesión del servidor');
      }
    } catch (error: any) {
      console.error('❌ Error sincronizando con backend:', error);

      // Logs adicionales para debugging
      if (error.error) {
        console.error('Backend error details:', error.error);
      }
      if (error.status) {
        console.error('HTTP status:', error.status);
      }
      if (error.message) {
        console.error('Error message:', error.message);
      }

      // Si falla la sincronización con backend, hacer logout de Firebase
      await signOut(firebaseAuth);
      throw new Error(
        `Error al sincronizar con servidor: ${error?.error?.message || error?.message || 'Error desconocido'}`,
      );
    }
  }

  /**
   * Mapea un usuario de Firebase a la interfaz User
   */
  private mapFirebaseUserToUser(
    firebaseUser: FirebaseUser,
    provider: 'google' | 'github' | 'microsoft',
  ): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'Usuario',
      photoUrl: firebaseUser.photoURL || null,
    };
  }

  /**
   * Obtiene un mensaje de error legible
   */
  private getErrorMessage(error: any): string {
    const code = error?.code;

    switch (code) {
      case 'auth/popup-closed-by-user':
        return 'Se cerró la ventana de login. Por favor, intenta de nuevo.';
      case 'auth/popup-blocked':
        return 'La ventana emergente fue bloqueada. Verifica tu navegador.';
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con este correo usando otro método.';
      case 'auth/user-cancelled':
        return 'Cancelaste el login.';
      default:
        return error?.message || 'Error en la autenticación. Intenta de nuevo.';
    }
  }

  /**
   * Realiza logout sincronizado: Firebase + Backend (mediante AuthService)
   */
  async logout(): Promise<void> {
    try {
      // Logout de Firebase
      await signOut(firebaseAuth);

      // Logout del AuthService (limpia localStorage y estado)
      this.authService.logout();
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error));
      throw error;
    }
  }
}
