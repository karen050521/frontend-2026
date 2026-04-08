import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { firebaseConfig } from './api.config';

/**
 * Inicializa Firebase
 */
export const firebaseApp = initializeApp(firebaseConfig);

/**
 * Obtiene la instancia de Firebase Auth
 */
export const firebaseAuth = getAuth(firebaseApp);

// Configurar emulador en desarrollo si es necesario
// if (location.hostname === 'localhost') {
//   connectAuthEmulator(firebaseAuth, 'http://localhost:9099', { disableWarnings: true });
// }
