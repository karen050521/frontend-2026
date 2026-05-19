import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RutaLista, RutaDetalle, ApiResponse, AssignParaderosDto, RutaParadero, RutaRecorrido } from '../models/ruta.model';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiNestUrl}/ruta`;

  obtenerRutas(nombre?: string): Observable<RutaLista[]> {
    const params = nombre ? `?nombre=${nombre}` : '';
    return this.http.get<any>(`${this.baseUrl}${params}`).pipe(
      map(response => this.procesarRutas(response))
    );
  }

  obtenerRuta(id: number): Observable<RutaLista> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.procesarRuta(response))
    );
  }

  obtenerRutaConParaderos(id: number): Observable<RutaDetalle> {
    return this.http.get<any>(`${this.baseUrl}/${id}/paraderos`).pipe(
      map(response => this.procesarRutaDetalle(response))
    );
  }

  private procesarRutas(response: any): RutaLista[] {
    const datos = response.datos ? response.datos : response;
    if (Array.isArray(datos)) {
      return datos.map(ruta => this.normalizarRuta(ruta));
    }
    return [];
  }

  private procesarRuta(response: any): RutaLista {
    const dato = response.datos ? response.datos : response;
    return this.normalizarRuta(dato);
  }

  private procesarRutaDetalle(response: any): RutaDetalle {
    const dato = response.datos ? response.datos : response;
    return this.normalizarRutaDetalle(dato);
  }

  private normalizarRuta(ruta: any): RutaLista {
    return {
      ...ruta,
      tarifa: typeof ruta.tarifa === 'string' ? parseFloat(ruta.tarifa) : ruta.tarifa,
      duracionEstimada: ruta.duracionEstimada || 0,
      origen: ruta.origen || '',
      destino: ruta.destino || '',
    };
  }

  private normalizarRutaDetalle(ruta: any): RutaDetalle {
    return {
      ...ruta,
      tarifa: typeof ruta.tarifa === 'string' ? parseFloat(ruta.tarifa) : ruta.tarifa,
      duracionEstimada: ruta.duracionEstimada || 0,
      origen: ruta.origen || '',
      destino: ruta.destino || '',
      duracionEstimadoFormato: ruta.duracionEstimadoFormato || this.formatearDuracion(ruta.duracionEstimada),
      rutaParaderos: (ruta.rutaParaderos || []).map((rp: any) => this.normalizarRutaParadero(rp)),
    };
  }

  private normalizarRutaParadero(rp: any): RutaParadero {
    return {
      id: rp.id,
      ordenSecuencial: rp.ordenSecuencial || 0,
      horaLlegadaEstimada: rp.horaLlegadaEstimada,
      paradero: rp.paradero || rp,
    };
  }

  private formatearDuracion(minutos: number): string {
    if (!minutos) return '0m';
    if (minutos < 60) return minutos + 'm';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? horas + 'h ' + mins + 'm' : horas + 'h';
  }

  /**
   * Asignar paraderos secuenciales a una ruta (Crear Relación Many-to-Many)
   * POST /ruta/:id/paraderos
   */
  asignarParaderosARuta(rutaId: number, dto: AssignParaderosDto): Observable<ApiResponse<RutaDetalle>> {
    return this.http.post<ApiResponse<RutaDetalle>>(`${this.baseUrl}/${rutaId}/paraderos`, dto);
  }

  /**
   * Crear una ruta nueva con o sin paraderos (Completa)
   * POST /ruta
   */
  crearRutaCompleta(dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, dto);
  }
  // Añade este método en la clase RutaService
  obtenerRecorrido(id: number): Observable<RutaRecorrido> {
    return this.http.get<any>(`${this.baseUrl}/${id}/recorrido`).pipe(
      map(response => response.datos ? response.datos : response)
    );
  }
}