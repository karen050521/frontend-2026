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
 * Configuración de Firebase  
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAxBGYgrfSRodxi9T6KSl72cpU05tlRrN8",
  authDomain: "angular-frontend-c0bb4.firebaseapp.com",
  projectId: "angular-frontend-c0bb4",
  storageBucket: "angular-frontend-c0bb4.firebasestorage.app",
  messagingSenderId: "908212817474",
  appId: "1:908212817474:web:a2cfbd37124254f65f27db"
};

/**
 * Configuración de OAuth Providers
 * URLs de callback para cada proveedor
 */
export const oauthConfig = {
  // URL base de la aplicación en desarrollo local
  developmentUrl: 'http://localhost:4200',
  
  // URL de Firebase (producción y development)
  // **ESTA ES LA URL QUE USAS EN GITHUB, GOOGLE Y MICROSOFT**
  firebaseCallbackUrl: `https://${firebaseConfig.authDomain}/__/auth/handler`,
  
  // Configuración por proveedor
  providers: {
    google: {
      name: 'Google',
      // En Google Console, usa esta URL de callback:
      callbackUrl: `https://${firebaseConfig.authDomain}/__/auth/handler`
    },
    github: {
      name: 'GitHub',
      // En GitHub OAuth App, usa esta URL de callback:
      callbackUrl: `https://${firebaseConfig.authDomain}/__/auth/handler`,
      // Datos para el formulario de GitHub:
      appName: 'Angular Frontend',
      homepageUrl: 'http://localhost:4200',
      applicationDescription: 'Angular Frontend with Role-Based Access Control'
    },
    microsoft: {
      name: 'Microsoft',
      // En Microsoft Azure App Registrations, usa esta URL de callback:
      callbackUrl: `https://${firebaseConfig.authDomain}/__/auth/handler`
    }
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
