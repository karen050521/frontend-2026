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
      origen: ruta.origen || this.extraerOrigen(ruta.nombre),
      destino: ruta.destino || this.extraerDestino(ruta.nombre),
    };
  }

  private normalizarRutaDetalle(ruta: any): RutaDetalle {
    const paraderos = (ruta.rutaParaderos || []).map((rp: any) => this.normalizarRutaParadero(rp));
    const origenDesdeParaderos = paraderos.length > 0 ? paraderos[0].paradero.nombre : '';
    const destinoDesdeParaderos = paraderos.length > 0 ? paraderos[paraderos.length - 1].paradero.nombre : '';
    return {
      ...ruta,
      tarifa: typeof ruta.tarifa === 'string' ? parseFloat(ruta.tarifa) : ruta.tarifa,
      duracionEstimada: ruta.duracionEstimada || 0,
      origen: ruta.origen || origenDesdeParaderos || this.extraerOrigen(ruta.nombre),
      destino: ruta.destino || destinoDesdeParaderos || this.extraerDestino(ruta.nombre),
      duracionEstimadoFormato: ruta.duracionEstimadoFormato || this.formatearDuracion(ruta.duracionEstimada),
      rutaParaderos: paraderos,
    };
  }

  /**
   * Extrae el origen de una ruta a partir de su nombre.
   * Ej: "Ruta Centro - Sur" => "Centro"
   */
  private extraerOrigen(nombre: string): string {
    if (!nombre) return '';
    const match = nombre.match(/Ruta\s+(.+?)\s*[-–—]\s*(.+)/i);
    if (match) return match[1].trim();
    // Si tiene formato "X - Y" sin "Ruta"
    const match2 = nombre.match(/^(.+?)\s*[-–—]\s*(.+)/);
    if (match2) return match2[1].trim();
    return '';
  }

  /**
   * Extrae el destino de una ruta a partir de su nombre.
   * Ej: "Ruta Centro - Sur" => "Sur"
   */
  private extraerDestino(nombre: string): string {
    if (!nombre) return '';
    const match = nombre.match(/Ruta\s+(.+?)\s*[-–—]\s*(.+)/i);
    if (match) return match[2].trim();
    // Si tiene formato "X - Y" sin "Ruta"
    const match2 = nombre.match(/^(.+?)\s*[-–—]\s*(.+)/);
    if (match2) return match2[2].trim();
    return '';
  }

  private normalizarRutaParadero(rp: any): RutaParadero {
    return {
      id: rp.id,
      ordenSecuencial: rp.ordenSecuencial || 0,
      horaLlegadaEstimada: rp.horaLlegadaEstimada,
      paradero: rp.paradero ?? { nombre: 'Desconocido', latitud: 0, longitud: 0 },
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
  obtenerRecorrido(id: number): Observable<RutaRecorrido> {
    return this.http.get<any>(`${this.baseUrl}/${id}/recorrido`).pipe(
     map(response => response.datos ? response.datos : response)
    );
  }
}