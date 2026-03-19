/**
 * Modelo de datos para User
 */
export interface User {
  id?: string;
  email: string;
  username: string;
  password?: string;
  photo?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * DTO para crear un nuevo usuario
 */
export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  photo?: string | null;
}

/**
 * DTO para actualizar un usuario
 */
export interface UpdateUserDto {
  email?: string;
  username?: string;
  photo?: string | null;
}
