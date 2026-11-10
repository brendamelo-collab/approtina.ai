// Test-only stand-in for src/firebase.ts: a signed-in fake user whose cloud data comes from window.__FIXTURE__
const fakeUser = { uid: 'test-uid', email: 'teste@exemplo.com', displayName: 'Teste' };
export const firebaseConfig = {};
export const app = {};
export const auth: any = { currentUser: fakeUser };
export const db = {};
export const rtdb = {};
export const googleProvider = {};
export const loginWithGoogle = async () => ({ user: fakeUser, error: null });
export const loginWithEmail = async () => ({ user: fakeUser, error: null });
export const registerWithEmail = async () => ({ user: fakeUser, error: null });
export const logoutFirebase = async () => true;
export const onAuthStateChanged = (_a: any, cb: (u: any) => void) => { setTimeout(() => cb(fakeUser), 0); return () => undefined; };
export type FirebaseUser = any;
export const saveUserRealtimeData = async (_uid: string, payload: any) => { (window as any).__SAVED__ = JSON.parse(JSON.stringify(payload)); return true; };
export const loadUserRealtimeData = async () => (window as any).__FIXTURE__ ?? null;
export const subscribeUserRealtimeData = () => () => undefined;
