import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  MetodoPagoCiudadano, 
  RecargaSaldoDto, 
  RecargaResponse 
} from '../models/ciudadano.model';

/**
 * @description Servicio para gestionar Métodos de Pago por Ciudadano
 * ⭐⭐ CRÍTICO para HU-013: Recarga con ePayco
 * 
 * IMPORTANTE: Cada MetodoPagoCiudadano tiene su SALDO INDIVIDUAL
 */
@Injectable({
  providedIn: 'root'
})
export class MetodoPagoCiudadanoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiNestUrl}/metodo-pago-ciudadano`;

  /**
   * Obtener todos los métodos de pago del ciudadano actual
   */
  obtenerMetodosPago(): Observable<MetodoPagoCiudadano[]> {
    return this.http.get<any>(`${this.baseUrl}`).pipe(
      map(response => this.procesarMetodosPago(response))
    );
  }

  /**
   * Obtener un método de pago específico
   */
  obtenerMetodoPago(id: number): Observable<MetodoPagoCiudadano> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.normalizarMetodoPago(response.datos || response))
    );
  }

  /**
   * HU-013: Realizar recarga de saldo mediante ePayco
   * 
   * Flujo:
   * 1. Validar monto > 0
   * 2. Enviar a backend
   * 3. Backend llama ePayco API
   * 4. Si APPROVED: UPDATE saldo = saldo + monto
   * 5. Retornar { success, nuevoSaldo }
   */
  recargarSaldo(metodoPagoId: number, monto: number): Observable<RecargaResponse> {
    const dto: RecargaSaldoDto = { monto, metodoPagoCiudadanoId: metodoPagoId };
    return this.http.post<any>(`${this.baseUrl}/${metodoPagoId}/recargar`, dto).pipe(
      map(response => ({
        success: response.success || response.exito || false,
        nuevoSaldo: response.nuevoSaldo || response.saldo,
        error: response.error || response.mensaje,
        transactionId: response.transactionId || response.transactionId
      }))
    );
  }

  /**
   * Crear un nuevo método de pago
   */
  crearMetodoPago(dto: Partial<MetodoPagoCiudadano>): Observable<MetodoPagoCiudadano> {
    return this.http.post<any>(`${this.baseUrl}`, dto).pipe(
      map(response => this.normalizarMetodoPago(response.datos || response))
    );
  }

  /**
   * Actualizar un método de pago
   */
  actualizarMetodoPago(id: number, dto: Partial<MetodoPagoCiudadano>): Observable<MetodoPagoCiudadano> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      map(response => this.normalizarMetodoPago(response.datos || response))
    );
  }

  /**
   * Desactivar un método de pago
   */
  desactivarMetodoPago(id: number): Observable<MetodoPagoCiudadano> {
    return this.actualizarMetodoPago(id, { estado: 'inactivo' });
  }

  /**
   * Activar un método de pago
   */
  activarMetodoPago(id: number): Observable<MetodoPagoCiudadano> {
    return this.actualizarMetodoPago(id, { estado: 'activo' });
  }

  /**
   * Eliminar un método de pago
   */
  eliminarMetodoPago(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Procesar lista de métodos de pago
   */
  private procesarMetodosPago(response: any): MetodoPagoCiudadano[] {
    const datos = response.datos ? response.datos : response;
    if (Array.isArray(datos)) {
      return datos.map((m: any) => this.normalizarMetodoPago(m));
    }
    return [];
  }

  /**
   * Normalizar un método de pago individual
   */
  private normalizarMetodoPago(metodoPago: any): MetodoPagoCiudadano {
    return {
      ...metodoPago,
      saldo: typeof metodoPago.saldo === 'string' ? parseFloat(metodoPago.saldo) : metodoPago.saldo,
      fechaRecarga: metodoPago.fechaRecarga ? new Date(metodoPago.fechaRecarga) : undefined,
    };
  }
}
