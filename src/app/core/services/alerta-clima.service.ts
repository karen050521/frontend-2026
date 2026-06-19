import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type CanalClima = 'email' | 'telegram';

export interface CreateAlertaClimaDto {
  horaViaje: string; // HH:MM
  ciudad?: string;
  canal: CanalClima;
  telegramChatId?: string;
}

export interface AlertaClima {
  id: string;
  email: string;
  horaViaje: string;
  ciudad: string;
  canal: CanalClima;
  telegramChatId?: string | null;
  estado: 'activa' | 'inactiva';
  ultimaNotificacion?: string | null;
  fechaCreacion: string;
}

@Injectable({ providedIn: 'root' })
export class AlertaClimaService {
  private readonly apiUrl = `${environment.apiNestUrl}/alerta-clima`;

  constructor(private http: HttpClient) {}

  // Activar / actualizar mi alerta de clima (el JWT identifica a la persona).
  guardar(dto: CreateAlertaClimaDto): Observable<AlertaClima> {
    return this.http.post<AlertaClima>(this.apiUrl, dto);
  }

  // Listar mis alertas.
  misAlertas(): Observable<AlertaClima[]> {
    return this.http.get<AlertaClima[]>(`${this.apiUrl}/persona`);
  }

  // Desactivar una alerta.
  desactivar(id: string): Observable<AlertaClima> {
    return this.http.delete<AlertaClima>(`${this.apiUrl}/${id}`);
  }

  // Disparo manual del grafo de clima (E2E/demo, sin esperar al cron).
  probarAhora(): Observable<{ pendientes: number; enviados: number }> {
    return this.http.post<{ pendientes: number; enviados: number }>(
      `${this.apiUrl}/run`,
      {},
    );
  }
}
