/**
 * Configuración de la API
 * Importa valores desde environments para no exponer secrets
 */

import { environment } from '../../../environments/environment';

export const apiConfig = {
  /**
   * URL base de la API del backend
   * Se importa desde environments
   */
  baseUrl: environment.apiNestUrl,

  /**
   * Clave del sitio de Google reCAPTCHA v3
   * Se importa desde environments
   */
  recaptchaSiteKey: environment.recaptchaSiteKey,

  /**
   * Endpoints específicos
   * Preferir `environment.apiEndpoints` cuando esté disponible
   */
  endpoints: (function () {
    const defaultEndpoints = {
      roles: '/api/private/roles',
      users: '/api/private/users',
      auth: '/auth',
      permissions: '/api/private/permissions',
      'role-permission': '/api/private/role-permission',
      'user-role': '/api/private/user-role',
      boletos: '/boletos',
      buses: '/buses',
      paraderos: '/paraderos',
    } as const;

    // Merge/override with environment provided endpoints if present
    if (environment && (environment as any).apiEndpoints) {
      return {
        ...defaultEndpoints,
        ...(environment as any).apiEndpoints,
      } as typeof defaultEndpoints;
    }

    return defaultEndpoints;
  })(),
};

/**
 * Configuración de Firebase
 * Se importa desde environments
 */
export const firebaseConfig = environment.firebase;

/**
 * Configuración de OAuth Providers
 * URLs de callback para cada proveedor
 */
export const oauthConfig = {
  // URL base de la aplicación
  developmentUrl: environment.oauth.developmentUrl,

  // URL de Firebase para callbacks
  firebaseCallbackUrl: environment.oauth.firebaseCallbackUrl,

  // Configuración por proveedor
  providers: {
    google: {
      name: 'Google',
      callbackUrl: environment.oauth.firebaseCallbackUrl,
    },
    github: {
      name: 'GitHub',
      callbackUrl: environment.oauth.firebaseCallbackUrl,
      appName: 'Angular Frontend',
      homepageUrl: environment.oauth.developmentUrl,
      applicationDescription: 'Angular Frontend with Role-Based Access Control',
    },
    microsoft: {
      name: 'Microsoft',
      callbackUrl: environment.oauth.firebaseCallbackUrl,
    },
  },
};

/**
 * Obtiene la URL completa para un endpoint
 * @param endpoint - Nombre del endpoint
 * @returns URL completa
 */
export function getApiUrl(endpoint: keyof typeof apiConfig.endpoints): string {
  return `${apiConfig.baseUrl}${apiConfig.endpoints[endpoint]}`;
}
