// TEMPLATE - Copy this to environment.prod.ts and fill in production values
// NO COMMIT THIS FILE WITH REAL SECRETS
// This is a template showing the structure expected for production environment

export const environment = {
  production: true,

  // Backend API - Usar tu dominio en producción
  apiBaseUrl: 'https://api.tudominio.com',

  // Google reCAPTCHA v3 - Site Key de producción
  // Obtén esto de: https://www.google.com/recaptcha/admin
  recaptchaSiteKey: 'REEMPLAZA_CON_TU_SITE_KEY_PRODUCCION',

  // Firebase Configuration - Credenciales de producción
  // Obtén esto de: Firebase Console → Project Settings
  firebase: {
    apiKey: 'REEMPLAZA_CON_TU_API_KEY',
    authDomain: 'tu-proyecto.firebaseapp.com',
    projectId: 'tu-proyecto',
    storageBucket: 'tu-proyecto.appspot.com',
    messagingSenderId: 'TU_MESSAGING_SENDER_ID',
    appId: 'TU_APP_ID',
  },

  // OAuth Callback URLs - Para producción
  oauth: {
    firebaseCallbackUrl: 'https://tu-proyecto.firebaseapp.com/__/auth/handler',
    developmentUrl: 'https://tudominio.com',
  },
};
