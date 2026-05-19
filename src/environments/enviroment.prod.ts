export const environment = {
  production: true,

  apiBaseUrl: 'https://api.ejemplo.com',
  apiNestUrl: 'https://api.ejemplo.com',
  apiSpringUrl: 'https://auth.ejemplo.com',

  apiEndpoints: {
    boletos: '/boletos',
    buses: '/bus',
    paraderos: '/paradero',
    rutas: '/ruta',
    auth: '/api/public/auth/login',
    users: '/api/private/users',
    roles: '/api/private/roles',
    permissions: '/api/private/permissions',
  },

  recaptchaSiteKey: '6Lcw15EsAAAAAOA4SWBXU3UVK-5_myjCAxd-6TRk',

  firebase: {
    apiKey: 'AIzaSyAxBGYgrfSRodxi9T6KSl72cpU05tlRrN8',
    authDomain: 'angular-frontend-c0bb4.firebaseapp.com',
    projectId: 'angular-frontend-c0bb4',
    storageBucket: 'angular-frontend-c0bb4.firebasestorage.app',
    messagingSenderId: '908212817474',
    appId: '1:908212817474:web:a2cfbd37124254f65f27db',
  },

  oauth: {
    firebaseCallbackUrl: 'https://angular-frontend-c0bb4.firebaseapp.com/__/auth/handler',
    developmentUrl: 'https://tudominio.com',
  },

  // ePayco Configuration (producción - cambiar testMode a false)
  epayco: {
    pKey: 'ec11e9d3345b23184b5c7f5efb8f3f3b',
    testMode: true,
    baseUrl: 'http://localhost:4200',
  },
};
