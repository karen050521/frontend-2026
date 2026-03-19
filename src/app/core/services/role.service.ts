import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Role, CreateRoleDto, UpdateRoleDto } from '../models/role.model';
import { getApiUrl } from '../config/api.config';

/**
 * RoleService - Servicio para gestión de roles
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona operaciones relacionadas con roles
 * - Dependency Inversion: Usa interfaces y abstracciones
 * - Open/Closed: Extensible para nuevas operaciones
 */
@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly apiUrl = getApiUrl('roles');
  
  // Estado reactivo
  private readonly rolesState = signal<Role[]>([]);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  
  /**
   * Signal con la lista de roles
   */
  readonly roles = this.rolesState.asReadonly();
  
  /**
   * Signal que indica si está cargando
   */
  readonly loading = this.loadingState.asReadonly();
  
  /**
   * Signal con el error actual
   */
  readonly error = this.errorState.asReadonly();
  
  constructor(private http: HttpClient) {}
  
  /**
   * Obtiene todos los roles del backend
   */
  getRoles(): Observable<Role[]> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.get<Role[]>(this.apiUrl).pipe(
      tap(roles => {
        this.rolesState.set(roles || []);
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.rolesState.set([]); // Asegurar que sea un array vacío en caso de error
        return this.handleError(error);
      })
    );
  }
  
  /**
   * Obtiene un rol por su ID
   */
  getRoleById(id: string): Observable<Role> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.get<Role>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadingState.set(false)),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Crea un nuevo rol
   */
  createRole(roleData: CreateRoleDto): Observable<Role> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.post<Role>(this.apiUrl, roleData).pipe(
      tap(newRole => {
        // Actualizar la lista local agregando el nuevo rol
        this.rolesState.update(roles => [...roles, newRole]);
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Actualiza un rol existente
   */
  updateRole(id: string, roleData: UpdateRoleDto): Observable<Role> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.put<Role>(`${this.apiUrl}/${id}`, roleData).pipe(
      tap(updatedRole => {
        // Actualizar la lista local
        this.rolesState.update(roles => 
          roles.map(role => role.id === id ? updatedRole : role)
        );
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Elimina un rol
   */
  deleteRole(id: string): Observable<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Actualizar la lista local eliminando el rol
        this.rolesState.update(roles => roles.filter(role => role.id !== id));
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Maneja los errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      
      // Si la respuesta es HTML (como index.html), significa que el proxy no funcionó
      if (typeof error.error === 'string' && error.error.includes('<!doctype')) {
        errorMessage = 'Error de conexión: No se puede conectar con el backend. Verifica que el servidor esté corriendo en http://localhost:8181';
      } else if (error.status === 0) {
        errorMessage = 'Error de red: No se puede conectar con el servidor. Verifica tu conexión y que el backend esté corriendo.';
      } else {
        errorMessage = `Error ${error.status}: ${error.message}`;
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
      }
    }
    
    this.errorState.set(errorMessage);
    this.loadingState.set(false);
    
    return throwError(() => new Error(errorMessage));
  }
  
  /**
   * Limpia el estado de error
   */
  clearError(): void {
    this.errorState.set(null);
  }
}
