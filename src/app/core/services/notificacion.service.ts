import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatSocketService } from './chat-socket.service';  

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly chatSocketService = inject(ChatSocketService);
  private readonly apiUrl = `${environment.apiNestUrl}/notificacion`;

  private refreshNotificationsSource = new Subject<void>();
  refreshNotifications$ = this.refreshNotificationsSource.asObservable();

  private alertaBusSource = new Subject<any>();
  alertaBus$ = this.alertaBusSource.asObservable();

  constructor() {
    this.chatSocketService.escucharAlertaBus().subscribe((alerta: any) => {
      console.log('🚌 ¡Alerta de bus recibida en vivo!', alerta);
      this.alertaBusSource.next(alerta);
      this.triggerRefresh();
    });
  }

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

  marcarAlertaComoLeida(mensajeId: number, personaId: string): void {
    this.http.patch(`${this.apiUrl}/alerta/${mensajeId}/leer?personaId=${personaId}`, {}).subscribe();
  }
}