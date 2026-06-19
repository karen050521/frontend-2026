import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AlertaPayload {
  contenido: string;
  alcanceTipo: 'TODOS' | 'RUTA' | 'ZONA';
  alcanceId?: string;
  esUrgente?: boolean;
  programadoPara?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertaService {
  private readonly apiUrl = `${environment.apiNestUrl}/mensajes/alerta-masiva`;

  constructor(private http: HttpClient) {}

  /**
   * 📊 Obtener el contador dinámico de destinatarios antes de enviar
   */
  getContadorDestinatarios(alcanceTipo: string, alcanceId?: string): Observable<{ total: number }> {
    let params = new HttpParams().set('alcanceTipo', alcanceTipo);
    if (alcanceId) {
      params = params.set('alcanceId', alcanceId);
    }
    return this.http.get<{ total: number }>(`${this.apiUrl}/contador`, { params });
  }

  /**
   * 🚀 Enviar o programar la alerta masiva
   */
  enviarAlertaMasiva(adminId: string, payload: AlertaPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/enviar?adminId=${adminId}`, payload);
  }

  /**
   * 📈 Obtener estadísticas de entrega y lectura del mensaje post-envío
   */
  getEstadisticasAlerta(mensajeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${mensajeId}/estadisticas`);
  }

 /**
   * 🚌 Obtener el listado de rutas disponibles desde el backend (Corregido a /ruta)
   */
  obtenerRutasDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiNestUrl}/ruta`);
  }

  /**
   * 🗺️ Obtener el listado de zonas geográficas disponibles desde el backend (Corregido a /zona)
   */
obtenerZonasDisponibles(): Observable<any[]> {
    // Cambiamos la URL vieja por la ruta real del controlador de rutas
    return this.http.get<any[]>(`${environment.apiNestUrl}/ruta/zonas/disponibles`);
  }

getTodasAlertas(): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apiNestUrl}/mensajes/alertas-masivas`);
  }
  
}