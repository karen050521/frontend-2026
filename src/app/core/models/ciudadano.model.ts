/**
 * @description Modelo de Ciudadano (Usuario de transporte)
 */
export interface Ciudadano {
  numericId?: number; // ID interno DB
  id?: string; // UUID del token JWT
  nombre?: string;
  email?: string;
  cedula?: string;
  telefono?: string;
  fechaNacimiento?: Date;
  direccionId?: number;
  direccion?: Direccion;
  metodosPago?: MetodoPagoCiudadano[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @description Modelo de Dirección
 */
export interface Direccion {
  id?: number;
  calle?: string;
  numero?: string;
  apartamento?: string;
  ciudad?: string;
  codigoPostal?: string;
  latitud?: number;
  longitud?: number;
  direccionCompleta?: string;
}

/**
 * @description Enumeración de tipos de instrumento de pago
 */
export enum TipoInstrumento {
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  RECARGABLE = 'RECARGABLE',
  APP_MOVIL = 'APP_MOVIL',
  EFECTIVO = 'EFECTIVO',
}

/**
 * @description Modelo de Método de Pago por Ciudadano (CRÍTICO para HU-013)
 * ⭐ Cada tarjeta tiene su SALDO INDIVIDUAL
 */
export interface MetodoPagoCiudadano {
  id?: number;
  tipoInstrumento?: TipoInstrumento;
  identificadorInstrumento?: string; // Últimos 4 dígitos
  saldo?: number; // ⭐ SALDO POR TARJETA (INDIVIDUAL)
  fechaRecarga?: Date;
  estado?: 'activo' | 'inactivo';
  ciudadanoId?: number;
  ciudadano?: Ciudadano;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @description DTO para recarga de saldo (HU-013)
 */
export interface RecargaSaldoDto {
  monto: number;
  metodoPagoCiudadanoId: number;
}

/**
 * @description Respuesta de recarga exitosa
 */
export interface RecargaResponse {
  success: boolean;
  nuevoSaldo?: number;
  error?: string;
  transactionId?: string;
}
