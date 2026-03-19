import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getApiUrl } from '../config/api.config';

export interface UserRef {
  id?: string;
  email?: string;
  username?: string;
  photo?: string | null;
}

export interface RoleRef {
  id?: string;
  name?: string;
}

export interface UserRole {
  id?: string;
  user?: UserRef;
  role?: RoleRef;
  userId?: string;
  roleId?: string;
  createdAt?: Date;
}

/**
 * UserRoleService - Servicio para gestión de asignación de roles a usuarios
 */
@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private readonly apiUrl = getApiUrl('user-role');
  
  private readonly userRolesState = signal<UserRole[]>([]);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  
  readonly userRoles = this.userRolesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  
  constructor(private http: HttpClient) {}
  
  /**
   * Obtiene los roles de un usuario específico
   */
  getUserRoles(userId: string): Observable<UserRole[]> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.get<UserRole[]>(`${this.apiUrl}/user/${userId}`).pipe(
      tap(userRoles => {
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.loadingState.set(false);
        return new Observable<UserRole[]>(subscriber => {
          subscriber.next([]);
          subscriber.complete();
        });
      })
    );
  }
  
  /**
   * Asigna un rol a un usuario
   */
  assignRoleToUser(userId: string, roleId: string): Observable<{ message: string }> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    const endpoint = `${this.apiUrl}/user/${userId}/role/${roleId}`;
    const payload = {};
    
    return this.http.post<{ message: string }>(endpoint, payload).pipe(
      tap(response => {
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Remueve un rol de un usuario
   */
  removeRoleFromUser(userRoleId: string): Observable<{ message: string }> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    const endpoint = `${this.apiUrl}/${userRoleId}`;
    
    return this.http.delete<{ message: string }>(endpoint).pipe(
      tap(response => {
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Maneja los errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error en el servidor';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || errorMessage;
    }
    
    this.errorState.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
