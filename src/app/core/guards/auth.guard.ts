import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard - Guardián de autenticación
 *
 * Verifica que el usuario esté autenticado antes de acceder a rutas protegidas.
 * Si no está autenticado, redirige al login con mensaje de sesión expirada.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    const isAuthenticated = this.authService.isAuthenticated();

    if (!isAuthenticated) {
      // Redirigir al login con mensaje de sesión expirada
      this.router.navigate(['/login'], {
        queryParams: { message: 'Sesión expirada o inválida' },
      });
      return false;
    }

    return true;
  }
}
