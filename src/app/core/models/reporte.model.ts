/**
 * @description Modelo para reportes analíticos
 */

/**
 * @description HU-014: Respuesta de ingresos por método de pago
 */
export interface IngresoPorMetodo {
  tipoInstrumento: string;
  cantidadTransacciones: number;
  ingresosTotal: number;
  promedio: number;
}

/**
 * @description Respuesta completa de reporte de ingresos
 */
export interface ReporteIngresosResponse {
  periodo: string; // "Últimos 30 días"
  fechaGeneracion: Date;
  ingresos: IngresoPorMetodo[];
  totalGeneral: number;
}

/**
 * @description HU-015: Respuesta de distribución por rango etario
 */
export interface DistribucionEtaria {
  rangoEtario: string; // "18-25", "26-35", etc.
  usuarios: number;
  ingresos: number;
  porcentaje: number;
}

/**
 * @description Respuesta completa de reporte demográfico
 */
export interface ReporteDemograficoResponse {
  periodo: string;
  fechaGeneracion: Date;
  distribucion: DistribucionEtaria[];
  totalIngresos: number;
  totalUsuarios: number;
}

/**
 * @description Filtros para reportes
 */
export interface FiltrosReporte {
  fechaInicio?: Date;
  fechaFin?: Date;
  tipoInstrumento?: string;
}
