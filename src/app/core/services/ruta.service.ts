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
    return this.http.get<ApiResponse<RutaLista[]>>(`${this.baseUrl}${params}`).pipe(
      map(response => response.datos)
    );
  }

  /**
   * Obtener ruta específica
   * GET /ruta/:id
   */
  obtenerRuta(id: number): Observable<RutaLista> {
    return this.http.get<ApiResponse<RutaLista>>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.datos)
    );
  }

  /**
   * Obtener ruta con paraderos ordenados y GPS
   * GET /ruta/:id/paraderos
   * CRÍTICO: Este endpoint devuelve duracionEstimadoFormato y rutaParaderos con latitud/longitud
   */
  obtenerRutaConParaderos(id: number): Observable<RutaDetalle> {
    return this.http.get<ApiResponse<RutaDetalle>>(`${this.baseUrl}/${id}/paraderos`).pipe(
      map(response => response.datos)
    );
  }
}
