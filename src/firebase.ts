import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';

// Firebase Web Configuration provided by user for app-rotinaai
export const firebaseConfig = {
  apiKey: "AIzaSyCLMC4UquqfqVgP3eHrV3wI9zWqfpSVh0I",
  // Keep the default auth domain: it is the redirect URI registered in the Google OAuth client
  authDomain: "app-rotinaai.firebaseapp.com",
  databaseURL: "https://app-rotinaai-default-rtdb.firebaseio.com",
  projectId: "app-rotinaai",
  storageBucket: "app-rotinaai.firebasestorage.app",
  messagingSenderId: "659541135196",
  appId: "1:659541135196:web:05efdf61c2d47f6786fb99",
  measurementId: "G-SQ0BGVGXXR"
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Authentication Services
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const isStandalonePWA = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);

// Completes a Google sign-in that was started with signInWithRedirect
getRedirectResult(auth).catch((error) => {
  console.warn('Google redirect auth error:', error);
});

export const loginWithGoogle = async () => {
  try {
    // Popups are unreliable inside an installed PWA (especially iOS): use redirect there
    if (isStandalonePWA()) {
      await signInWithRedirect(auth, googleProvider);
      return { user: null, error: null };
    }
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.warn('Google popup auth error:', error);
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/operation-not-supported-in-environment' ||
      error.code === 'auth/web-storage-unsupported'
    ) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return { user: null, error: null };
      } catch (redirectError: any) {
        console.warn('Google redirect auth error:', redirectError);
      }
    }
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      return { user: null, error: 'Login com o Google cancelado.' };
    }
    let msg = error.message || 'Erro ao fazer login com o Google';
    if (error.code === 'auth/unauthorized-domain') {
      msg = 'Domínio não autorizado no Console do Firebase (Authentication > Settings > Authorized domains). Use Login com E-mail e Senha abaixo.';
    } else if (error.code === 'auth/popup-blocked') {
      msg = 'O navegador bloqueou o pop-up de login do Google. Use Login com E-mail e Senha abaixo.';
    }
    return { user: null, error: msg };
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return { user: result.user, error: null };
  } catch (error: any) {
    let msg = error.message || 'Erro ao autenticar com e-mail e senha';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      msg = 'E-mail ou senha incorretos, ou usuário não cadastrado. Clique em "Criar nova conta" abaixo.';
    }
    return { user: null, error: msg };
  }
};

export const registerWithEmail = async (email: string, pass: string, name?: string) => {
  try {
    // The app reads this right after sign-up to greet the user by name
    if (name?.trim()) localStorage.setItem('rotina_ai_pending_display_name', name.trim());
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (name?.trim()) {
      await updateProfile(result.user, { displayName: name.trim() }).catch(() => undefined);
    }
    return { user: result.user, error: null };
  } catch (error: any) {
    let msg = error.message || 'Erro ao criar conta no Firebase';
    if (error.code === 'auth/email-already-in-use') {
      msg = 'Este e-mail já está cadastrado. Faça login com sua senha.';
    } else if (error.code === 'auth/weak-password') {
      msg = 'A senha deve ter pelo menos 6 caracteres.';
    }
    return { user: null, error: msg };
  }
};

export const logoutFirebase = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export { onAuthStateChanged };
export type { FirebaseUser };

// Realtime Database User Data Sync (Secured by rules: $uid === auth.uid)
export const saveUserRealtimeData = async (uid: string, payload: any) => {
  try {
    const userRef = ref(rtdb, `users/${uid}`);
    // Realtime Database rejects `undefined` values; a JSON round-trip strips them
    const clean = JSON.parse(JSON.stringify(payload ?? {}));
    await set(userRef, {
      ...clean,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn('Realtime DB write error (verifique regras do Realtime DB no Firebase):', err);
    return false;
  }
};

export const loadUserRealtimeData = async (uid: string) => {
  try {
    const snapshot = await get(ref(rtdb, `users/${uid}`));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (err) {
    console.warn('Realtime DB read error (verifique regras do Realtime DB no Firebase):', err);
    return undefined; // undefined = read failed (do not overwrite cloud data)
  }
};

export const subscribeUserRealtimeData = (uid: string, callback: (data: any) => void) => {
  const userRef = ref(rtdb, `users/${uid}`);
  return onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  }, (err) => {
    console.warn('Realtime DB subscription error:', err);
  });
};
