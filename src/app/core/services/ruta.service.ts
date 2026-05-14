import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RutaLista, RutaDetalle, ApiResponse } from '../models/ruta.model';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiNestUrl}/ruta`;

  /**
   * Obtener todas las rutas o filtrar por nombre
   * GET /ruta
   * GET /ruta?nombre=X
   */
  obtenerRutas(nombre?: string): Observable<RutaLista[]> {
    const params = nombre ? `?nombre=${nombre}` : '';
    return this.http.get<any>(`${this.baseUrl}${params}`).pipe(
      map(response => this.procesarRutas(response))
    );
  }

  /**
   * Obtener ruta específica
   * GET /ruta/:id
   */
  obtenerRuta(id: number): Observable<RutaLista> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.procesarRuta(response))
    );
  }

  /**
   * Obtener ruta con paraderos ordenados y GPS
   * GET /ruta/:id/paraderos
   * CRÍTICO: Este endpoint devuelve duracionEstimadoFormato y rutaParaderos con latitud/longitud
   */
  obtenerRutaConParaderos(id: number): Observable<RutaDetalle> {
    return this.http.get<any>(`${this.baseUrl}/${id}/paraderos`).pipe(
      map(response => this.procesarRutaDetalle(response))
    );
  }

  /**
   * Procesa la respuesta de rutas, manejando ambos formatos de respuesta
   */
  private procesarRutas(response: any): RutaLista[] {
    const datos = response.datos ? response.datos : response;
    if (Array.isArray(datos)) {
      return datos.map(ruta => this.normalizarRuta(ruta));
    }
    return [];
  }

  /**
   * Procesa una ruta individual
   */
  private procesarRuta(response: any): RutaLista {
    const dato = response.datos ? response.datos : response;
    return this.normalizarRuta(dato);
  }

  /**
   * Procesa una ruta con detalle
   */
  private procesarRutaDetalle(response: any): RutaDetalle {
    const dato = response.datos ? response.datos : response;
    return this.normalizarRutaDetalle(dato);
  }

  /**
   * Normaliza una ruta para asegurar tipos correctos
   */
  private normalizarRuta(ruta: any): RutaLista {
    return {
      ...ruta,
      tarifa: typeof ruta.tarifa === 'string' ? parseFloat(ruta.tarifa) : ruta.tarifa,
      duracionEstimada: ruta.duracionEstimada || 0,
    };
  }

  /**
   * Normaliza una ruta con detalle
   */
  private normalizarRutaDetalle(ruta: any): RutaDetalle {
    return {
      ...ruta,
      tarifa: typeof ruta.tarifa === 'string' ? parseFloat(ruta.tarifa) : ruta.tarifa,
      duracionEstimada: ruta.duracionEstimada || 0,
      duracionEstimadoFormato: ruta.duracionEstimadoFormato || this.formatearDuracion(ruta.duracionEstimada),
      rutaParaderos: ruta.rutaParaderos || [],
    };
  }

  /**
   * Formatea la duración en formato legible
   */
  private formatearDuracion(minutos: number): string {
    if (!minutos) return '0m';
    if (minutos < 60) return minutos + 'm';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? horas + 'h ' + mins + 'm' : horas + 'h';
  }
}
