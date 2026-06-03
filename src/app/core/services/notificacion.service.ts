import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs'; // 👈 Importamos Subject
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiNestUrl}/notificacion`;

  // 🔔 Este Subject notificará a la campana que debe recargarse
  private refreshNotificationsSource = new Subject<void>();
  refreshNotifications$ = this.refreshNotificationsSource.asObservable();

  // Método para disparar la recarga
  triggerRefresh() {
    this.refreshNotificationsSource.next();
  }

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