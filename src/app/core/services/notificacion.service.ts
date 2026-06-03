import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private readonly http = inject(HttpClient);
  // Usamos apiNestUrl tal cual como lo tienes en el environment
  private readonly apiUrl = `${environment.apiNestUrl}/notificacion`;

  getNotificaciones(personaId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/persona/${personaId}`);
  }

  getUnreadCount(personaId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count/${personaId}`);
  }

  marcarComoLeida(notificacionId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/leer/${notificacionId}`, {});
  }
}