import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiConfig } from '../config/api.config';

interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordService {
  private baseUrl = apiConfig.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Solicita un enlace de recuperación de contraseña
   * @param email Email del usuario
   * @param recaptchaToken Token de Google reCAPTCHA
   * @returns Observable con la respuesta del servidor
   */
  requestPasswordReset(email: string, recaptchaToken: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${this.baseUrl}/api/public/auth/forgot-password`,
      { email, recaptchaToken }
    );
  }

  /**
   * Restablece la contraseña con un token válido
   * @param token Token de recuperación
   * @param newPassword Nueva contraseña
   * @returns Observable con la respuesta del servidor
   */
  resetPassword(token: string, newPassword: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      `${this.baseUrl}/api/public/auth/reset-password`,
      { token, newPassword }
    );
  }
}
