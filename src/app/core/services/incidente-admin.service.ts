import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IncidenteHistorialDto {
  id: number;
  fecha: Date;
  tipo: 'mecnico' | 'accidente' | 'retraso' | 'otro';
  estado: 'pendiente' | 'en_revision' | 'resuelto';
  descripcion: string;
  gravedad: 'bajo' | 'medio' | 'alto' | 'critico';
  conductor: string;
  comentarios: Array<{ autor: string; texto: string; fecha: Date }>;
  fotos: string[];
}

export interface EstadisticasBusDto {
  totalIncidentes: number;
  porTipo: Record<string, number>;
  tasaResolucion: string;
}

@Injectable({
  providedIn: 'root'
})
export class IncidenteAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiNestUrl}/admin/incidentes`;

  /**
   * Obtiene todos los incidentes mapeados a un bus con filtros de tipo y estado
   */
  obtenerHistorialPorBus(busId: number, filtros?: { tipo?: string; estado?: string }): Observable<IncidenteHistorialDto[]> {
    let params = new HttpParams();
    if (filtros?.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros?.estado) params = params.set('estado', filtros.estado);

    return this.http.get<IncidenteHistorialDto[]>(`${this.apiUrl}/bus/${busId}`, { params });
  }

  /**
   * Obtiene la telemetría matemática (totales, tipos y tasa de éxito) del bus
   */
  obtenerEstadisticasPorBus(busId: number): Observable<EstadisticasBusDto> {
    return this.http.get<EstadisticasBusDto>(`${this.apiUrl}/bus/${busId}/estadisticas`);
  }

  /**
   * Envía una actualización de estado o añade una bitácora de comentario al incidente
   */
  actualizarSeguimiento(incidenteId: number, payload: { estado?: string; comentario?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${incidenteId}/seguimiento`, payload);
  }
}