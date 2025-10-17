import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { logger } from '../utils/logger';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error('Firebase configuration incomplete. Missing environment variables:', missingEnvVars);
  throw new Error(`Missing required Firebase environment variables: ${missingEnvVars.join(', ')}`);
}

logger.debug('Firebase configuration loaded', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasDatabaseUrl: !!firebaseConfig.databaseURL
});

let app;
try {
  app = initializeApp(firebaseConfig);
  logger.debug('Firebase app initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Firebase app:', error);
  throw error;
}

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDB = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// Utility function to check if Firebase is ready
export const isFirebaseReady = () => {
  return !!app && !!auth && !!firestore && !!realtimeDB;
};

// Wait for Firebase to be fully initialized
export const waitForFirebase = async (timeout = 5000) => {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkFirebase = () => {
      if (isFirebaseReady()) {
        logger.debug('Firebase is ready');
        resolve();
      } else if (Date.now() - startTime > timeout) {
        logger.error('Firebase initialization timeout');
        reject(new Error('Firebase initialization timeout'));
      } else {
        setTimeout(checkFirebase, 100);
      }
    };

    checkFirebase();
  });
};
