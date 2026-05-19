/**
 * @description Respuesta genérica de la API
 */
export interface ApiResponse<T> {
  datos?: T;
  mensaje?: string;
  exito?: boolean;
}

/**
 * @description Representa una Ruta en formato de lista
 */
export interface RutaLista {
  id: number;
  nombre: string;
  descripcion?: string;
  origen?: string;
  destino?: string;
  tarifa: number;
  duracionEstimada: number;
  estado?: string;
}

/**
 * @description Representa un Paradero dentro de una Ruta con información de secuencia
 */
export interface RutaParadero {
  id?: number;
  ordenSecuencial: number;
  horaLlegadaEstimada?: string;
  paradero: Paradero;
}

/**
 * @description Representa una Ruta con detalles completos incluidos paraderos
 */
export interface RutaDetalle extends RutaLista {
  duracionEstimadoFormato: string;
  rutaParaderos: RutaParadero[];
}

/**
 * @description DTO para asignar paraderos a una ruta
 */
export interface AssignParaderosDto {
  paraderosIds?: number[];
  secuencia?: number[];
}

/**
 * @description Representa la entidad base de un Paradero Físico/Geográfico.
 */
export interface Paradero {
  id?: number;
  nombre: string;
  latitud: number;
  longitud: number;
  descripcion?: string;
  tipo?: string; // "Parada", "Terminal"
  codigo?: string;
  nodId?: number;
  
  // 📍 Propiedades adicionales dinámicas (Calculadas por el Backend para la HU-ENTR-2-002)
  distancia_metros?: number;
  duracion_minutos?: number;
  rutas?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @description DTO para crear un nuevo Paradero (HU-010)
 */
export interface CreateParaderoDto {
  nombre: string;
  latitud: number;
  longitud: number;
  descripcion?: string;
  tipo?: string;
  codigo?: string;
  nodoId?: number;
}

/**
 * @description DTO para búsqueda de paraderos cercanos (HU-002)
 */
export interface ParaderosCercanosDto {
  latitud: number;
  longitud: number;
  radio?: number; // metros, default 500
  limite?: number; // default 5
}

/**
 * @description Respuesta de paraderos cercanos
 */
export interface ParaderosCercanosResponse {
  paraderos: Paradero[];
  total: number;
}