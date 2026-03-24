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
   * Clave del sitio de Google reCAPTCHA v3
   */
  recaptchaSiteKey: '6Lcw15EsAAAAAOA4SWBXU3UVK-5_myjCAxd-6TRk', // Reemplaza con tu clave del sitio
  
  /**
   * Endpoints específicos
   */
  endpoints: {
    roles: '/api/private/roles',
    users: '/api/private/users',
    auth: '/auth',
    permissions: '/api/private/permissions',
    'role-permission': '/api/private/role-permission',
    'user-role': '/api/private/user-role'
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
