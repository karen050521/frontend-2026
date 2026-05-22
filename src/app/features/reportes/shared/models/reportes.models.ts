// ─── DTOs de Reportes ────────────────────────────────────────────────────────

export interface IngresosMetodoPagoResponse {
  periodo: string;
  totalesPorMetodo: Record<string, number>;
  evolucionMensual: EvolucionMensualItem[];
}

export interface EvolucionMensualItem {
  mes: string;
  [metodo: string]: number | string;
}

export interface RangoEtarioItem {
  rango: string;
  cantidad: number;
  porcentaje: number;
  variacionVsMesAnterior: number;
}

export interface DemograficoResponse {
  totalPasajeros: number;
  segmentoPredominante: string;
  rangos: RangoEtarioItem[];
}

export type PeriodoMeses = 3 | 6 | 12;

export interface FiltrosDemografico {
  rutaId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface MetricaIngreso {
  metodo: string;
  total: number;
  porcentaje: number;
  variacionMensual: number;
  tendencia: 'up' | 'down' | 'neutral';
}
