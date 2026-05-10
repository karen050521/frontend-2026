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
 * BoletoService - Servicio para gestión de boletos/tickets
 */
@Injectable({
  providedIn: 'root',
})
export class BoletoService {
  private readonly apiUrl = `${environment.apiNestUrl}${environment.apiEndpoints.boletos}`;
  private readonly busesUrl = `${environment.apiNestUrl}/bus`;
  private readonly paraderosUrl = `${environment.apiNestUrl}/paradero`;

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
   * Limpia el estado local de boletos para evitar UI rota ante errores del backend
   */
  resetBoletosState(): void {
    this.boletosState.set([]);
    this.totalCountState.set(0);
    this.loadingState.set(false);
  }

  /**
   * Obtiene lista de buses para formulario
   */
  getBuses(): Observable<BusOption[]> {
    return this.http
      .get<BusOption[] | { data?: BusOption[] }>(this.busesUrl)
      .pipe(map((response) => this.normalizeListResponse<BusOption>(response)));
  }

  /**
   * Obtiene lista de paraderos para formulario
   */
  getParaderos(): Observable<ParaderoOption[]> {
    return this.http
      .get<ParaderoOption[] | { data?: ParaderoOption[] }>(this.paraderosUrl)
      .pipe(map((response) => this.normalizeListResponse<ParaderoOption>(response)));
  }

  /**
   * Registra abordaje enviando Bearer token explícitamente
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
   * Obtiene todos los boletos
   */
  getBoletos(): Observable<Boleto[]> {
    this.loadingState.set(true);
    this.errorState.set(null);

    return this.http.get<Boleto[]>(this.apiUrl).pipe(
      tap((boletos) => {
        const validBoletos = (boletos || []).filter((b) => b.id);
        this.boletosState.set(validBoletos);
        this.totalCountState.set(validBoletos.length);
        this.loadingState.set(false);
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  /**
   * Obtiene un boleto por su ID
   */
  getBoletoById(id: number): Observable<Boleto> {
    return this.http
      .get<Boleto>(`${this.apiUrl}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Crea un nuevo boleto (registra abordaje)
   */
  createBoleto(createBoletoDto: CreateBoletoDto): Observable<Boleto> {
    this.errorState.set(null);

    return this.http.post<Boleto>(this.apiUrl, createBoletoDto).pipe(
      tap((boleto) => {
        const currentBoletos = this.boletosState();
        this.boletosState.set([boleto, ...currentBoletos]);
        this.totalCountState.set(this.boletosState().length);
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  /**
   * Actualiza un boleto (estado o fin de viaje)
   */
  updateBoleto(id: number, updateBoletoDto: UpdateBoletoDto): Observable<Boleto> {
    this.errorState.set(null);

    return this.http.patch<Boleto>(`${this.apiUrl}/${id}`, updateBoletoDto).pipe(
      tap((updatedBoleto) => {
        const boletos = this.boletosState();
        const index = boletos.findIndex((b) => b.id === id);
        if (index !== -1) {
          boletos[index] = updatedBoleto;
          this.boletosState.set([...boletos]);
        }
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  /**
   * Elimina un boleto
   */
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
   * Obtiene boletos activos
   */
  getActiveBoletos(): Boleto[] {
    return this.boletosState().filter((b) => b.status === 'ACTIVO');
  }

  /**
   * Obtiene boletos completados
   */
  getCompletedBoletos(): Boleto[] {
    return this.boletosState().filter((b) => b.status === 'COMPLETADO');
  }

  /**
   * Manejo de errores
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
    }

    this.errorState.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private normalizeListResponse<T>(response: T[] | { data?: T[] } | null | undefined): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  }
}
