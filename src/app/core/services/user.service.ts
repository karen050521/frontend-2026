import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { getApiUrl } from '../config/api.config';

/**
 * UserService - Servicio para gestión de usuarios
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = getApiUrl('users');
  
  private readonly usersState = signal<User[]>([]);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  
  readonly users = this.usersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  
  constructor(private http: HttpClient) {}
  
  /**
   * Obtiene todos los usuarios
   */
  getUsers(): Observable<User[]> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    return this.http.get<User[]>(this.apiUrl).pipe(
      tap(users => {
        const validUsers = (users || []).filter(u => u.id);
        this.usersState.set(validUsers);
        this.loadingState.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Obtiene un usuario por su ID
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
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
