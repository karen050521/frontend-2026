import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  Boleto,
  BusOption,
  ParaderoOption,
  RegistrarAbordajeResponse,
} from '../models/boleto.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BoletoService {
  private readonly apiUrl = `${environment.apiNestUrl}${environment.apiEndpoints.boletos}`;
  private readonly busesUrl = `${environment.apiNestUrl}/bus`;
  private readonly paraderosUrl = `${environment.apiNestUrl}/paradero`;
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

getMisTarjetas(token: string): Observable<any[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // 🎯 CAMBIO AQUÍ: Cambiamos 'this.misMetodosUrl' para pegarle al controlador de boletos
    // Si tu servicio usa 'this.apiUrl', déjalo así. Si usa otra variable base, cámbiala por esa.
    return this.http.get<any[] | { data?: any[] }>(`${this.apiUrl}/mis-tarjetas`, { headers }).pipe(
      map((response) => this.normalizeListResponse<any>(response)),
      catchError((error) => this.handleError(error)),
    );
  }

  resetBoletosState(): void {
    this.boletosState.set([]);
    this.totalCountState.set(0);
    this.loadingState.set(false);
  }

  getBuses(): Observable<BusOption[]> {
    return this.http
      .get<BusOption[] | { data?: BusOption[] }>(this.busesUrl)
      .pipe(map((response) => this.normalizeListResponse<BusOption>(response)));
  }

  getParaderos(): Observable<ParaderoOption[]> {
    return this.http
      .get<ParaderoOption[] | { data?: ParaderoOption[] }>(this.paraderosUrl)
      .pipe(map((response) => this.normalizeListResponse<ParaderoOption>(response)));
  }

/**
   * ✅ REGISTRAR ABORDAJE (Elegante y Dinámico)
   */
  registrarAbordaje(
    payload: { bus_id?: number; paraderoAbordaje_id?: number; metodoPagoCiudadano_id?: number },
    token: string,
  ): Observable<RegistrarAbordajeResponse> {
    this.errorState.set(null);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // 🌟 Cambiado de localhost a la variable limpia del servicio
    return this.http
      .post<RegistrarAbordajeResponse>(this.apiUrl, payload, { headers })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * 🚌 FINALIZAR VIAJE / DESCENSO (Elegante y Dinámico)
   */
  finalizarViaje(
    payload: { boleto_id: number; paraderoDescenso_id: number },
    token: string,
  ): Observable<any> {
    this.errorState.set(null);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // 🌟 Concatenamos limpiamente usando la ruta base de boletos
    return this.http
      .post<any>(`${this.apiUrl}/finalizar-viaje`, payload, { headers })
      .pipe(
        tap(() => {
          this.getBoletosDelUsuario().subscribe();
        }),
        catchError((error) => this.handleError(error))
      );
  }
  
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
      catchError((error) => this.handleError(error)),
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

  obtenerRecorridoViaje(boletoId: number, token: string) {
    return this.http.get<any>(`${this.apiUrl}/boletos/${boletoId}/recorrido`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

}
