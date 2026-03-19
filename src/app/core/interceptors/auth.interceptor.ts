import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthInterceptor - Interceptor de autenticación
 *
 * Agrega el token JWT a todas las peticiones HTTP y maneja errores de autenticación.
 * Si el token es inválido o expirado, redirige al login.
 */
@Injectable({
    providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private authService: AuthService,
        private router: Router,
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Obtener el token del localStorage
        const token = localStorage.getItem('authToken');

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
        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    // Token inválido o expirado - limpiar sesión y redirigir
                    this.authService.logout();
                    this.router.navigate(['/login'], {
                        queryParams: { message: 'Sesión expirada o inválida' },
                    });
                } else if (error.status === 403) {
                    // Acceso denegado
                    this.router.navigate(['/403'], {
                        queryParams: { message: 'Acceso denegado' },
                    });
                }

                return throwError(() => error);
            })
        );
    }
}
