/**
 * Modelo de datos para Permission
 * NOTA: Usa 'url' y 'model' para compatibilidad con el backend (microservicio_seguridad)
 */
export interface Permission {
  id?: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  model?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * DTO para crear un nuevo permiso
 * NOTA: Usa 'url' y 'model' para compatibilidad con el backend
 */
export interface CreatePermissionDto {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  model?: string;
}

/**
 * DTO para actualizar un permiso
 * NOTA: Usa 'url' y 'model' para compatibilidad con el backend
 */
export interface UpdatePermissionDto {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  model?: string;
}

/**
 * Modelo para la relación Role-Permission
 * NOTA: El backend retorna { id, role, permission } pero puede tener también roleId/permissionId
 */
export interface RolePermission {
  id?: string;
  roleId?: string;
  permissionId?: string;
  role?: any;
  permission?: Permission;
  createdAt?: Date;
}

/**
 * DTO para asignar un permiso a un rol
 */
export interface AssignRolePermissionDto {
  roleId: string;
  permissionId: string;
}

/**
 * Modelo para mostrar permisos disponibles agrupados por endpoint
 */
export interface PermissionEndpoint {
  endpoint: string;
  methods: {
    GET?: Permission;
    POST?: Permission;
    PUT?: Permission;
    DELETE?: Permission;
    PATCH?: Permission;
  };
}
