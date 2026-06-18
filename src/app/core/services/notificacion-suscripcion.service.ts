import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// HU-ENTR-3-003: CRUD de suscripciones "bus próximo". El back vive en back-logic
// (NestJS :3000); el auth.interceptor adjunta el JWT automáticamente.
export interface CrearSuscripcionDto {
  rutaId: number;
  paraderoId: number;
  minutosAnticipacion: number; // 5 | 10 | 15
}

@Injectable({ providedIn: 'root' })
export class NotificacionSuscripcionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiNestUrl}/notificacion-suscripcion`;

  crear(dto: CrearSuscripcionDto): Observable<any> {
    // La persona sale del JWT en el backend, no se envía en el body.
    return this.http.post<any>(this.apiUrl, dto);
  }

  listarMias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/persona`);
  }

  desactivar(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
