/**
 * Configuración de la API
 * Centraliza las URLs del backend
 */

export const apiConfig = {
  /**
   * URL base de la API del backend
   * Apunta directamente al backend con CORS habilitado
   */
  baseUrl: 'http://localhost:8181',
  
  
  /**
   * Endpoints específicos
   */
  endpoints: {
    roles: '/roles',
    users: '/users',
    auth: '/auth',
    permissions: '/permissions',
    'role-permission': '/role-permission',
    'user-role': '/user-role'
  }
};

/**
 * Obtiene la URL completa para un endpoint
 * @param endpoint - Nombre del endpoint
 * @returns URL completa
 */
export function getApiUrl(endpoint: keyof typeof apiConfig.endpoints): string {
  return `${apiConfig.baseUrl}${apiConfig.endpoints[endpoint]}`;
}
