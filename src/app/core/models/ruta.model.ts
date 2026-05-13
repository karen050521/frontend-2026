/**
 * Modelos de Ruta y Paradero (según backend PROMPT_FRONTEND.md)
 */

export interface Paradero {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  descripcion?: string;
}

export interface RutaParadero {
  id: number;
  ordenSecuencial: number;
  horaLlegadaEstimada: string;
  paradero: Paradero;
}

/**
 * Ruta para listados
 */
export interface RutaLista {
  id: number;
  nombre: string;
  origen: string;
  destino: string;
  tarifa: number;
  duracionEstimada: number;
  estado: 'activa' | 'inactiva';
}

/**
 * Ruta con detalle y paraderos (GET /ruta/:id/paraderos)
 */
export interface RutaDetalle extends RutaLista {
  duracionEstimadoFormato: string;
  rutaParaderos: RutaParadero[];
}

export interface ApiResponse<T> {
  exito: boolean;
  datos: T;
  timestamp?: string;
}
