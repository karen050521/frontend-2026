import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Paradero, 
  CreateParaderoDto, 
  ParaderosCercanosDto,
  ParaderosCercanosResponse 
} from '../models/ruta.model';

/**
 * @description Servicio para gestionar Paraderos
 * - HU-002: Búsqueda de paraderos cercanos
 * - HU-010: Registro de nuevo paradero
 */
@Injectable({
  providedIn: 'root'
})
export class ParaderoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiNestUrl}/paradero`;

  /**
   * Obtener todos los paraderos
   */
  obtenerParaderos(): Observable<Paradero[]> {
    return this.http.get<any>(`${this.baseUrl}`).pipe(
      map(response => this.procesarParaderos(response))
    );
  }

  /**
   * Obtener un paradero por ID
   */
  obtenerParadero(id: number): Observable<Paradero> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.normalizarParadero(response.datos || response))
    );
  }

  /**
   * HU-002: Obtener paraderos cercanos a una ubicación GPS
   * @param latitud Latitud GPS
   * @param longitud Longitud GPS
   * @param radio Radio en metros (default 500)
   * @param limite Número máximo de paraderos (default 5)
   */
  obtenerParaderosCercanos(
    latitud: number,
    longitud: number,
    radio: number = 500,
    limite: number = 5
  ): Observable<ParaderosCercanosResponse> {
    const params = `?latitud=${latitud}&longitud=${longitud}&radio=${radio}&limite=${limite}`;
    return this.http.get<any>(`${this.baseUrl}/cercanos${params}`).pipe(
      map(response => ({
        paraderos: (response.datos || []).map((p: any) => this.normalizarParadero(p)),
        total: (response.datos || []).length
      }))
    );
  }

  /**
   * HU-002 (Alternativo): Versión con coordinates object
   */
  findNearby(coords: { lat: number; lng: number }): Observable<Paradero[]> {
    return this.http.post<any>(`${this.baseUrl}/cercanos`, coords).pipe(
      map(response => this.procesarParaderos(response))
    );
  }

  /**
   * HU-010: Crear un nuevo paradero
   * @param dto Datos del paradero a crear
   */
  crearParadero(dto: CreateParaderoDto): Observable<Paradero> {
    return this.http.post<any>(`${this.baseUrl}`, dto).pipe(
      map(response => this.normalizarParadero(response.datos || response))
    );
  }

  /**
   * Actualizar un paradero existente
   */
  actualizarParadero(id: number, dto: Partial<CreateParaderoDto>): Observable<Paradero> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      map(response => this.normalizarParadero(response.datos || response))
    );
  }

  /**
   * Eliminar un paradero
   */
  eliminarParadero(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Procesar lista de paraderos desde respuesta API
   */
  private procesarParaderos(response: any): Paradero[] {
    const datos = response.datos ? response.datos : response;
    if (Array.isArray(datos)) {
      return datos.map((p: any) => this.normalizarParadero(p));
    }
    return [];
  }

  /**
   * Normalizar un paradero individual
   */
  private normalizarParadero(paradero: any): Paradero {
    return {
      ...paradero,
      latitud: typeof paradero.latitud === 'string' ? parseFloat(paradero.latitud) : paradero.latitud,
      longitud: typeof paradero.longitud === 'string' ? parseFloat(paradero.longitud) : paradero.longitud,
    };
  }
}
