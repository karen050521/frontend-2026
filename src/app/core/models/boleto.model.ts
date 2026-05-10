/**
 * Modelo de datos para Boleto
 */
export interface Boleto {
  id?: number;
  userId: number;
  travelId: number;
  status: 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';
  boardingTime?: Date;
  disembarkTime?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  travelDetails?: {
    origin?: string;
    destination?: string;
    scheduledTime?: Date;
    driverName?: string;
    vehiclePlate?: string;
  };
}

/**
 * DTO para crear un nuevo boleto (abordaje)
 */
export interface CreateBoletoDto {
  userId: number;
  travelId: number;
}

/**
 * DTO para actualizar un boleto
 */
export interface UpdateBoletoDto {
  status?: 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';
  disembarkTime?: Date | null;
}

/**
 * Opciones de bus para formulario de abordaje
 */
export interface BusOption {
  id: number;
  nombre?: string;
  placa?: string;
}

/**
 * Opciones de paradero para formulario de abordaje
 */
export interface ParaderoOption {
  id: number;
  nombre?: string;
  direccion?: string;
}

/**
 * DTO para registrar abordaje
 */
export interface RegistrarAbordajeDto {
  bus_id: number;
  paradero_id: number;
  metodo_pago_id: number;
}

/**
 * Respuesta esperada al registrar abordaje
 */
export interface RegistrarAbordajeResponse {
  message?: string;
  saldo_restante?: number;
  saldoRestante?: number;
  boleto?: Boleto;
}
