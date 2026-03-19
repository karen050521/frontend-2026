import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { 
  Permission, 
  CreatePermissionDto, 
  UpdatePermissionDto,
  RolePermission,
  AssignRolePermissionDto
} from '../models/permission.model';
import { getApiUrl } from '../config/api.config';

/**
 * PermissionService - Servicio para gestión de permisos
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly apiUrl = getApiUrl('permissions');
  
  // Estado reactivo
  private readonly permissionsState = signal<Permission[]>([]);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  
  readonly permissions = this.permissionsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  
  constructor(private http: HttpClient) {}
  
  /**
   * Obtiene todos los permisos
   */
  getPermissions(): Observable<Permission[]> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.get<Permission[]>(this.apiUrl).pipe(
      tap(permissions => {
        // Validar y filtrar permisos válidos
        const validPermissions = (permissions || [])
          .filter(p => p && p.url && p.method)
          .filter(p => p.url.trim() !== '');
        
        this.permissionsState.set(validPermissions);
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Obtiene un permiso por su ID
   */
  getPermissionById(id: string): Observable<Permission> {
    return this.http.get<Permission>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Crea un nuevo permiso
   */
  createPermission(permissionData: CreatePermissionDto): Observable<Permission> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.post<Permission>(this.apiUrl, permissionData).pipe(
      tap(newPermission => {
        this.permissionsState.update(permissions => [...permissions, newPermission]);
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Actualiza un permiso existente
   */
  updatePermission(id: string, permissionData: UpdatePermissionDto): Observable<Permission> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.put<Permission>(`${this.apiUrl}/${id}`, permissionData).pipe(
      tap(updatedPermission => {
        this.permissionsState.update(permissions =>
          permissions.map(p => p.id === id ? updatedPermission : p)
        );
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Elimina un permiso
   */
  deletePermission(id: string): Observable<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.permissionsState.update(permissions =>
          permissions.filter(p => p.id !== id)
        );
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
