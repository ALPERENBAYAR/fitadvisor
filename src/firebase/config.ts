import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBTtWHBRD1kEKGtx1eSjNPidg-enHY2N5o',
  authDomain: 'fitadvisor-e329b.firebaseapp.com',
  projectId: 'fitadvisor-e329b',
  storageBucket: 'fitadvisor-e329b.appspot.com',
  messagingSenderId: '138381925426',
  appId: '1:138381925426:web:14524be466b158480c702b',
  measurementId: 'G-SL1NZ6W1TW',
};

const app = initializeApp(firebaseConfig);

// Auth init (simplified for web/native): falls back to plain getAuth to avoid configuration issues
let auth;
try {
  const { getReactNativePersistence, initializeAuth } = require('firebase/auth/react-native');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (_err) {
  auth = getAuth(app);
}

export const firebaseApp = app;
export const firebaseAuth = auth;
export const firebaseDb = getFirestore(app);
export const firebaseStorage = getStorage(app);
