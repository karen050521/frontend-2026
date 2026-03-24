import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard - Guardián de autenticación y autorización
 *
 * Verifica:
 * - Si el usuario está autenticado
 * - Si el token es válido
 * - Si tiene permisos (roles) para acceder a la ruta
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = this.authService.getToken();
    const isValid = this.authService.isTokenValid();

    // 🔴 1. Validar autenticación y expiración
    if (!token || !isValid) {
      this.authService.logout();

      const message =
        token && !isValid
          ? 'Sesión expirada. Por favor, inicia sesión nuevamente.'
          : 'Debes iniciar sesión para acceder a esta página.';

      this.router.navigate(['/login'], {
        queryParams: { message },
      });

      return false;
    }

    // 🔴 2. Validar roles (múltiples)
    const requiredRoles = route.data['roles'];

    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = this.authService.getUserRole();

      if (!requiredRoles.includes(userRole)) {
        this.router.navigate(['/403'], {
          queryParams: {
            message: 'No tienes permisos para acceder a esta sección.',
          },
        });

        return false;
      }
    }

    // 🟢 Todo correcto
    return true;
  }
}