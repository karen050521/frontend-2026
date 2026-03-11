/**
 * Modelo de datos para Role
 */
export interface Role {
  id?: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * DTO para crear un nuevo rol
 */
export interface CreateRoleDto {
  name: string;
  description: string;
}

/**
 * DTO para actualizar un rol existente
 */
export interface UpdateRoleDto {
  name?: string;
  description?: string;
}
