// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

export const environment = {
  production: false,

  // Backend API
  apiBaseUrl: 'http://localhost:8181',

  // Google reCAPTCHA v3
  recaptchaSiteKey: '6Lcw15EsAAAAAOA4SWBXU3UVK-5_myjCAxd-6TRk',

  // Firebase Configuration
  firebase: {
    apiKey: 'AIzaSyAxBGYgrfSRodxi9T6KSl72cpU05tlRrN8',
    authDomain: 'angular-frontend-c0bb4.firebaseapp.com',
    projectId: 'angular-frontend-c0bb4',
    storageBucket: 'angular-frontend-c0bb4.firebasestorage.app',
    messagingSenderId: '908212817474',
    appId: '1:908212817474:web:a2cfbd37124254f65f27db',
  },

  // OAuth Callback URLs
  oauth: {
    firebaseCallbackUrl: 'https://angular-frontend-c0bb4.firebaseapp.com/__/auth/handler',
    developmentUrl: 'http://localhost:4200',
  },
};
