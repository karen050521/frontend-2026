import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  IngresosMetodoPagoResponse,
  DemograficoResponse,
  PeriodoMeses,
  FiltrosDemografico,
} from '../models/reportes.models';

@Injectable({ providedIn: 'root' })
export class ReportesApiService {
  private readonly base = `${environment.apiNestUrl}/reportes`;

  constructor(private readonly http: HttpClient) {}

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('authToken') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ─── DASHBOARDS ──────────────────────────────────────────────────────────

  getIngresosMetodoPago(meses: PeriodoMeses = 6): Observable<IngresosMetodoPagoResponse> {
    return this.http.get<IngresosMetodoPagoResponse>(
      `${this.base}/ingresos-metodo-pago`,
      { headers: this.headers, params: { meses: String(meses) } },
    );
  }

  getDemografico(filtros: FiltrosDemografico = {}): Observable<DemograficoResponse> {
    let params = new HttpParams();
    if (filtros.rutaId) params = params.set('rutaId', String(filtros.rutaId));
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    return this.http.get<DemograficoResponse>(
      `${this.base}/pasajeros-rango-etario`,
      { headers: this.headers, params },
    );
  }

  // ─── EXPORTACIONES ────────────────────────────────────────────────────────

  exportarIngresosCSV(meses: PeriodoMeses): Observable<Blob> {
    return this.http.get(`${this.base}/exportar-ingresos-csv`, {
      headers: this.headers,
      params: { meses: String(meses) },
      responseType: 'blob',
    });
  }

  exportarIngresosExcel(meses: PeriodoMeses): Observable<Blob> {
    return this.http.get(`${this.base}/exportar-ingresos-excel`, {
      headers: this.headers,
      params: { meses: String(meses) },
      responseType: 'blob',
    });
  }

  exportarDemograficoCSV(filtros: FiltrosDemografico = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filtros.rutaId) params = params.set('rutaId', String(filtros.rutaId));
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    return this.http.get(`${this.base}/exportar-demografico-csv`, {
      headers: this.headers,
      params,
      responseType: 'blob',
    });
  }

  exportarDemograficoExcel(filtros: FiltrosDemografico = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filtros.rutaId) params = params.set('rutaId', String(filtros.rutaId));
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    return this.http.get(`${this.base}/exportar-demografico-excel`, {
      headers: this.headers,
      params,
      responseType: 'blob',
    });
  }

  // ─── UTILS ───────────────────────────────────────────────────────────────

  descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }
}
