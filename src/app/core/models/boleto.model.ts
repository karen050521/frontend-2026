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
