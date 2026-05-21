import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ReporteIngresosResponse,
  ReporteDemograficoResponse,
  FiltrosReporte
} from '../models/reporte.model';

/**
 * Servicio para reportes analíticos
 * - HU-014: Reporte de ingresos por método de pago
 * - HU-015: Distribución porcentual por rango etario
 */
@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiNestUrl}/reportes`;

  /**
   * HU-014: Obtener ingresos por método de pago
   */
  obtenerIngresosPorMetodo(filtros?: FiltrosReporte): Observable<ReporteIngresosResponse> {
    const params = this.construirParametros(filtros);
    return this.http.get<any>(`${this.baseUrl}/ingresos-por-metodo${params}`).pipe(
      map(response => this.normalizarReporteIngresos(response))
    );
  }

  /**
   * HU-015: Obtener distribución etaria
   */
  obtenerDistribucionEtaria(filtros?: FiltrosReporte): Observable<ReporteDemograficoResponse> {
    const params = this.construirParametros(filtros);
    return this.http.get<any>(`${this.baseUrl}/distribucion-etaria${params}`).pipe(
      map(response => this.normalizarReporteDemografico(response))
    );
  }

  /**
   * Exportar reporte de ingresos en CSV
   */
  exportarIngresosCSV(filtros?: FiltrosReporte): Observable<Blob> {
    const params = this.construirParametros(filtros);
    return this.http.get(`${this.baseUrl}/ingresos-por-metodo/export/csv${params}`, {
      responseType: 'blob'
    });
  }

  /**
   * Exportar reporte demográfico en CSV
   */
  exportarDemograficoCSV(filtros?: FiltrosReporte): Observable<Blob> {
    const params = this.construirParametros(filtros);
    return this.http.get(`${this.baseUrl}/distribucion-etaria/export/csv${params}`, {
      responseType: 'blob'
    });
  }

  /**
   * Normalizar respuesta de reporte de ingresos
   */
  private normalizarReporteIngresos(response: any): ReporteIngresosResponse {
    const datos = response?.datos || response?.ingresos || [];
    const ingresos = (datos || []).map((item: any) => ({
      tipoInstrumento: item.tipoInstrumento || item.tipo_instrumento || item.metodo || 'Desconocido',
      cantidadTransacciones: parseInt(item.cantidadTransacciones || item.cantidad_transacciones || 0, 10),
      ingresosTotal: parseFloat(item.ingresosTotal || item.ingresos_total || item.total || 0),
      promedio: parseFloat(item.promedio || 0)
    }));

    return {
      periodo: response?.periodo || 'Últimos 30 días',
      fechaGeneracion: new Date(),
      ingresos,
      totalGeneral: this.calcularTotalIngresos(ingresos)
    } as ReporteIngresosResponse;
  }

  /**
   * Normalizar respuesta de reporte demográfico
   */
  private normalizarReporteDemografico(response: any): ReporteDemograficoResponse {
    const datos = response?.datos || response?.distribucion || [];
    const distribucion = (datos || []).map((item: any) => ({
      rangoEtario: item.rangoEtario || item.rango_etario || item.rango || 'Desconocido',
      usuarios: parseInt(item.usuarios || item.cantidadPasajeros || 0, 10),
      ingresos: parseFloat(item.ingresos || 0),
      porcentaje: parseFloat(item.porcentaje || 0)
    }));

    return {
      periodo: response?.periodo || 'Últimos 30 días',
      fechaGeneracion: new Date(),
      distribucion,
      totalIngresos: this.calcularTotalIngresos(distribucion),
      totalUsuarios: distribucion.reduce((sum: number, it: any) => sum + (it.usuarios || 0), 0)
    } as ReporteDemograficoResponse;
  }

  /**
   * Construir string de parámetros de query
   */
  private construirParametros(filtros?: FiltrosReporte): string {
    if (!filtros) return '';

    const params: string[] = [];

    if (filtros.fechaInicio) {
      params.push(`fechaInicio=${encodeURIComponent(filtros.fechaInicio.toISOString())}`);
    }
    if (filtros.fechaFin) {
      params.push(`fechaFin=${encodeURIComponent(filtros.fechaFin.toISOString())}`);
    }
    if (filtros.tipoInstrumento) {
      params.push(`tipoInstrumento=${encodeURIComponent(filtros.tipoInstrumento)}`);
    }

    return params.length ? `?${params.join('&')}` : '';
  }

  /**
   * Calcular total de ingresos
   */
  private calcularTotalIngresos(items: any[]): number {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum: number, item: any) => {
      const ingreso = parseFloat(
  (item.ingresosTotal ?? item.ingresos ?? item.ingresos_total) || 0
);
      return sum + (isNaN(ingreso) ? 0 : ingreso);
    }, 0);
  }
}