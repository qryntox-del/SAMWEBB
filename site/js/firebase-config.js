export const firebaseConfig = {
  apiKey: "AIzaSyDvPqgQvVZIbmAyGtwxgt879T0ECbslxOk",
  authDomain: "sam-portfolio-71d88.firebaseapp.com",
  projectId: "sam-portfolio-71d88",
  storageBucket: "sam-portfolio-71d88.firebasestorage.app",
  messagingSenderId: "307992544344",
  appId: "1:307992544344:web:0ea2a3ee7cf212c692f62d"
};

export const ownerUid = 'GfgtFRmnbcWy8sQbS1INMSH0TiE3';

export const firebaseConnected = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId &&
  ownerUid
);

