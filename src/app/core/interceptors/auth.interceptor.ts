import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthInterceptor - Interceptor de autenticación
 *
 * Agrega el token JWT a todas las peticiones HTTP y maneja errores de autenticación.
 * Maneja automáticamente errores 401 (no autorizado) y 403 (acceso denegado).
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 🔹 Rutas públicas que no deben llevar token
  const publicUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/recover-password',
    '/auth/verify-2fa',
  ];

  if (publicUrls.some((url) => req.url.includes(url))) {
    return next(req);
  }

  // Obtener el token
  const token = authService.getToken();

  // 🔴 Validar si el token existe pero está expirado
  if (token && !authService.isTokenValid()) {
    authService.logout();

    router.navigate(['/login'], {
      queryParams: {
        message: 'Sesión expirada. Por favor inicia sesión nuevamente.',
        returnUrl: router.url,
      },
    });

    return throwError(() => new Error('Token expirado'));
  }

  // Clonar la petición y agregar el token si existe
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Manejar la respuesta y errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      handleHttpError(error, authService, router);
      return throwError(() => error);
    }),
  );
};

/**
 * Maneja errores HTTP relacionados con autenticación
 */
function handleHttpError(error: HttpErrorResponse, authService: AuthService, router: Router): void {
  if (error.status === 401) {
    handleUnauthorizedError(authService, router);
  } else if (error.status === 403) {
    handleForbiddenError(router);
  } else if (error.status === 0) {
    console.error('Error de conexión con el servidor');
  }
}

/**
 * Maneja errores 401 - No autorizado
 */
function handleUnauthorizedError(authService: AuthService, router: Router): void {
  authService.logout();

  router.navigate(['/login'], {
    queryParams: {
      message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      returnUrl: router.url,
    },
  });
}

/**
 * Maneja errores 403 - Acceso denegado
 */
function handleForbiddenError(router: Router): void {
  router.navigate(['/403'], {
    queryParams: {
      message: 'No tienes permisos para acceder a este recurso.',
      returnUrl: router.url,
    },
  });
}
