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

  // 🔔 Subject original para recargar la lista de la campana
  private refreshNotificationsSource = new Subject<void>();
  refreshNotifications$ = this.refreshNotificationsSource.asObservable();

  // 🚌 ✨ NUEVO: Subject específico para la alerta emergente del bus
  private alertaBusSource = new Subject<any>();
  alertaBus$ = this.alertaBusSource.asObservable();

  constructor() {
    // Escuchamos el socket en todo momento.
    this.chatSocketService.escucharAlertaBus().subscribe((alerta: any) => {
      console.log('🚌 ¡Alerta de bus recibida en vivo!', alerta);
      this.alertaBusSource.next(alerta); // Dispara la tarjeta amarilla en la UI
      this.triggerRefresh(); // Actualiza el contador de notificaciones de la campana
    });
  }

  // Método único para disparar la recarga manual (Sin duplicados)
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