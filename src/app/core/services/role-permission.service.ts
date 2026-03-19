import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RolePermission, AssignRolePermissionDto } from '../models/permission.model';
import { getApiUrl } from '../config/api.config';

/**
 * RolePermissionService - Servicio para gestión de asignación de permisos a roles
 */
@Injectable({
  providedIn: 'root'
})
export class RolePermissionService {
  private readonly apiUrl = getApiUrl('role-permission');
  
  // Estado reactivo
  private readonly rolePermissionsState = signal<RolePermission[]>([]);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  
  readonly rolePermissions = this.rolePermissionsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  
  constructor(private http: HttpClient) {}
  
  /**
   * Obtiene todos los role-permissions
   */
  getAllRolePermissions(): Observable<RolePermission[]> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.get<RolePermission[]>(this.apiUrl).pipe(
      tap(rolePermissions => {
        this.rolePermissionsState.set(rolePermissions || []);
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Obtiene los permisos de un rol específico
   * NOTA: Si el backend no tiene este endpoint, retorna un array vacío
   */
  getRolePermissions(roleId: string): Observable<RolePermission[]> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    // Intentar obtener los permisos del rol
    return this.http.get<RolePermission[]>(`${this.apiUrl}/role/${roleId}`).pipe(
      tap(rolePermissions => {
        this.loadingState.set(false);
      }),
      catchError(error => {
        // Si el endpoint no existe, retornar array vacío
        this.loadingState.set(false);
        return new Observable<RolePermission[]>(subscriber => {
          subscriber.next([]);
          subscriber.complete();
        });
      })
    );
  }
  
  /**
   * Obtiene los permisos de un rol específico - Alternativa
   */
  getPermissionsByRole(roleId: string): Observable<RolePermission[]> {
    return this.getRolePermissions(roleId);
  }
  
  /**
   * Asigna un permiso a un rol
   */
  assignPermissionToRole(roleId: string, permissionId: string): Observable<{ message: string }> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/role/${roleId}/permission/${permissionId}`,
      {}
    ).pipe(
      tap(response => {
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Remueve un permiso de un rol
   */
  removePermissionFromRole(rolePermissionId: string): Observable<{ message: string }> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${rolePermissionId}`).pipe(
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
