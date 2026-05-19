import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  ReporteIngresosResponse,
  ReporteDemograficoResponse,
  FiltrosReporte
} from '../models/reporte.model';

/**
 * @description Servicio para reportes analíticos
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
   * HU-014: Obtener ingresos por método de pago (últimos 30 días por defecto)
   * 
   * SQL Query:
   * SELECT 
   *   mpc.tipo_instrumento,
   *   COUNT(*) as cantidad_transacciones,
   *   SUM(b.costo) as ingresos_total,
   *   ROUND(AVG(b.costo), 2) as promedio
   * FROM metodos_pago_ciudadano mpc
   * LEFT JOIN boleto b ON mpc.id = b.metodo_pago_ciudadano_id
   * WHERE b.estado = 'completado'
   *   AND b.inicio_viaje >= DATE_SUB(NOW(), INTERVAL 30 DAY)
   * GROUP BY mpc.tipo_instrumento
   * ORDER BY ingresos_total DESC;
   */
  obtenerIngresosPorMetodo(filtros?: FiltrosReporte): Observable<ReporteIngresosResponse> {
    const params = this.construirParametros(filtros);
    return this.http.get<any>(`${this.baseUrl}/ingresos-por-metodo${params}`).pipe(
      map(response => this.normalizarReporteIngresos(response))
    );
  }

  /**
   * HU-015: Obtener distribución de ingresos por rango etario (últimos 30 días por defecto)
   * 
   * SQL Query:
   * SELECT 
   *   CONCAT(
   *     FLOOR((YEAR(NOW()) - YEAR(c.fecha_nacimiento)) / 10) * 10,
   *     "-",
   *     FLOOR((YEAR(NOW()) - YEAR(c.fecha_nacimiento)) / 10) * 10 + 9
   *   ) as rango_etario,
   *   COUNT(DISTINCT c.id) as usuarios,
   *   SUM(b.costo) as ingresos,
   *   ROUND(100.0 * SUM(b.costo) / (
   *     SELECT SUM(costo) FROM boleto WHERE estado = 'completado'
   *   ), 2) as porcentaje
   * FROM ciudadano c
   * LEFT JOIN boleto b ON c.id = b.ciudadano_id
   * WHERE b.estado = 'completado'
   *   AND b.inicio_viaje >= DATE_SUB(NOW(), INTERVAL 30 DAY)
   * GROUP BY rango_etario
   * ORDER BY rango_etario ASC;
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
    return {
      periodo: response.periodo || 'Últimos 30 días',
      fechaGeneracion: new Date(),
      ingresos: (response.datos || response.ingresos || []).map((item: any) => ({
        tipoInstrumento: item.tipoInstrumento || item.tipo_instrumento,
        cantidadTransacciones: parseInt(item.cantidadTransacciones || item.cantidad_transacciones || 0),
        ingresosTotal: parseFloat(item.ingresosTotal || item.ingresos_total || 0),
        promedio: parseFloat(item.promedio || 0)
      })),
      totalGeneral: this.calcularTotalIngresos(response.datos || response.ingresos || [])
    };
  }

  /**
   * Normalizar respuesta de reporte demográfico
   */
  private normalizarReporteDemografico(response: any): ReporteDemograficoResponse {
    const distribucion = (response.datos || response.distribucion || []).map((item: any) => ({
      rangoEtario: item.rangoEtario || item.rango_etario,
      usuarios: parseInt(item.usuarios || 0),
      ingresos: parseFloat(item.ingresos || 0),
      porcentaje: parseFloat(item.porcentaje || 0)
    }));

    return {
      periodo: response.periodo || 'Últimos 30 días',
      fechaGeneracion: new Date(),
      distribucion,
      totalIngresos: this.calcularTotalIngresos(distribucion),
      totalUsuarios: distribucion.reduce((sum: number, item: any) => sum + (item.usuarios || 0), 0)
    };
  }

  /**
   * Construir string de parámetros de query
   */
  private construirParametros(filtros?: FiltrosReporte): string {
    if (!filtros) return '';
    
    const params = new URLSearchParams();
    
    if (filtros.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio.toISOString());
    }
    if (filtros.fechaFin) {
      params.append('fechaFin', filtros.fechaFin.toISOString());
    }
    if (filtros.tipoInstrumento) {
      params.append('tipoInstrumento', filtros.tipoInstrumento);
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Calcular total de ingresos
   */
  private calcularTotalIngresos(items: any[]): number {
    return items.reduce((sum: number, item: any) => {
      const ingreso = parseFloat(item.ingresosTotal || item.ingresos || 0);
      return sum + ingreso;
    }, 0);
  }
}
