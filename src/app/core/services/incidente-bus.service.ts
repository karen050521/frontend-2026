import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment'; // Ajusta la ruta a tu environment

export interface CreateIncidenteBusDto {
  tipo: 'mecanico' | 'accidente' | 'retraso' | 'otro';
  gravedad: 'bajo' | 'medio' | 'alto' | 'critico';
  descripcion: string;
  latitud: number;
  longitud: number;
  base64Fotos?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class IncidenteBusService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiNestUrl}/incidentes-buses`;

  public reportarIncidente(dto: CreateIncidenteBusDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reportar`, dto);
  }

  /**
   * Obtiene alertas para gerente por empresa (incidentes con gravedad 'alto' o 'critico')
   */
  public obtenerAlertasGerente(empresaId: number): Observable<any[]> {
    return this.http
      .get<any>(`${this.apiUrl}/alertas/${empresaId}`)
      .pipe(map((res) => res?.data || []));
  }
}
