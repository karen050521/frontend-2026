import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  Boleto,
  BusOption,
  CreateBoletoDto,
  ParaderoOption,
  RegistrarAbordajeDto,
  RegistrarAbordajeResponse,
  UpdateBoletoDto,
} from '../models/boleto.model';
import { environment } from '../../../environments/environment';

/**
 * BoletoService - Servicio para gestión de boletos y métodos de pago del ciudadano
 */
@Injectable({
  providedIn: 'root',
})
export class BoletoService {
  private readonly apiUrl = `${environment.apiNestUrl}${environment.apiEndpoints.boletos}`;
  private readonly busesUrl = `${environment.apiNestUrl}/bus`;
  private readonly paraderosUrl = `${environment.apiNestUrl}/paradero`;
  // Endpoint para obtener las tarjetas/instrumentos del ciudadano logueado
  private readonly misMetodosUrl = `${environment.apiNestUrl}/metodo-pago-ciudadano/mis-metodos`;

  private readonly boletosState = signal<Boleto[]>([]);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  private readonly totalCountState = signal<number>(0);

  readonly boletos = this.boletosState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly totalCount = this.totalCountState.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * NUEVO: Obtiene las tarjetas (metodos_pago_ciudadano) asociadas al usuario autenticado.
   * Esto permite ver el saldo real antes de abordar.
   */
  getMisTarjetas(): Observable<any[]> {
    return this.http
      .get<any[] | { data?: any[] }>(this.misMetodosUrl)
      .pipe(
        map((response) => this.normalizeListResponse<any>(response)),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Limpia el estado local
   */
  resetBoletosState(): void {
    this.boletosState.set([]);
    this.totalCountState.set(0);
    this.loadingState.set(false);
  }

  /**
   * Obtiene lista de buses
   */
  getBuses(): Observable<BusOption[]> {
    return this.http
      .get<BusOption[] | { data?: BusOption[] }>(this.busesUrl)
      .pipe(map((response) => this.normalizeListResponse<BusOption>(response)));
  }

  /**
   * Obtiene lista de paraderos
   */
  getParaderos(): Observable<ParaderoOption[]> {
    return this.http
      .get<ParaderoOption[] | { data?: ParaderoOption[] }>(this.paraderosUrl)
      .pipe(map((response) => this.normalizeListResponse<ParaderoOption>(response)));
  }

  /**
   * Registra abordaje (María)
   */
  registrarAbordaje(
    payload: RegistrarAbordajeDto,
    token: string,
  ): Observable<RegistrarAbordajeResponse> {
    this.errorState.set(null);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .post<RegistrarAbordajeResponse>(this.apiUrl, payload, { headers })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Obtiene boletos del usuario actual
   */
  getBoletosDelUsuario(): Observable<Boleto[]> {
    this.loadingState.set(true);
    this.errorState.set(null);

    return this.http.get<Boleto[]>(`${this.apiUrl}/mis-boletos`).pipe(
      map((response) => this.normalizeListResponse<Boleto>(response)),
      tap((boletos) => {
        this.syncBoletosState(boletos);
        this.loadingState.set(false);
      }),
      catchError((error) => {
        this.loadingState.set(false);
        return this.handleError(error);
      }),
    );
  }

  getBoletoById(id: number): Observable<Boleto> {
    return this.http
      .get<Boleto>(`${this.apiUrl}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  updateBoleto(id: number, updateBoletoDto: any): Observable<Boleto> {
    this.errorState.set(null);

    return this.http.patch<Boleto>(`${this.apiUrl}/${id}`, updateBoletoDto).pipe(
      tap((updatedBoleto) => {
        const boletos = this.boletosState();
        const index = boletos.findIndex((b) => b.id === id);
        if (index !== -1) {
          const newArray = [...boletos];
          newArray[index] = updatedBoleto;
          this.boletosState.set(newArray);
        }
      }),
      catchError((error) => this.handleError(error))
    );
  }

  deleteBoleto(id: number): Observable<void> {
    this.errorState.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const boletos = this.boletosState();
        const filtered = boletos.filter((b) => b.id !== id);
        this.boletosState.set(filtered);
        this.totalCountState.set(filtered.length);
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  /**
   * Manejo de errores centralizado
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Priorizamos el mensaje que viene del backend (ej: "Saldo insuficiente")
      errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
    }

    this.errorState.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private normalizeListResponse<T>(response: T[] | { data?: T[] } | null | undefined): T[] {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.data)) return response.data;
    return [];
  }

  private syncBoletosState(boletos: Boleto[]): void {
    const validBoletos = (boletos || []).filter((b) => b.id);
    this.boletosState.set(validBoletos);
    this.totalCountState.set(validBoletos.length);
    this.loadingState.set(false);
  }
}