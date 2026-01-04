let firestore = null;
let addDoc = null;
let collection = null;
let serverTimestamp = null;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyBTtWHBRD1kEKGtx1eSjNPidg-enHY2N5o',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'fitadvisor-e329b.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'fitadvisor-e329b',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'fitadvisor-e329b.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '138381925426',
  appId: process.env.FIREBASE_APP_ID || '1:138381925426:web:14524be466b158480c702b',
};

const initFirebase = () => {
  if (firestore) return true;
  try {
    const { initializeApp } = require('firebase/app');
    const firestorePkg = require('firebase/firestore');
    addDoc = firestorePkg.addDoc;
    collection = firestorePkg.collection;
    serverTimestamp = firestorePkg.serverTimestamp;
    const { getFirestore } = firestorePkg;
    const app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    return true;
  } catch (error) {
    return false;
  }
};

const storeMlSample = async ({ steps, avgHr }) => {
  if (!Number.isFinite(steps) || !Number.isFinite(avgHr)) return;
  if (!initFirebase()) return;
  try {
    await addDoc(collection(firestore, 'mlSamples'), {
      steps,
      avgHr,
      createdAt: serverTimestamp(),
      source: 'backend',
    });
  } catch {
    // ignore firebase write errors
  }
};

module.exports = {
  storeMlSample,
};
