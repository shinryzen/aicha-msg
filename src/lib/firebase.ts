import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Main app firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google認証時の情報を最小限にする（emailのみを要求。名前や写真は要求しないが、Google側のプロンプトで表示される場合は管理コンソール設定が必要）
googleProvider.addScope('email'); 
// 任意のドメイン（gen-lang-client-...）を変更するには、Firebase Consoleの Hosting もしくは「認証」->「設定」->「承認済みドメイン」でカスタムドメインを接続し、
// firebaseConfig の authDomain をそのカスタムドメインに向ける必要があります。

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// The testConnection function is removed to avoid unnecessary console noise in restricted iframe environments.
// Firestore handles reconnections automatically.

// We use the same configuration for management to avoid projectId mismatch and "gen-lang-client" domain issues in popups
export const managementConfig = {
  ...firebaseConfig
};

// We initialize a separate app for management if needed, but using the same config
const managementApp = initializeApp(managementConfig, 'management');
export const managementDb = db; // Use default db to share auth state

interface AppConfig {
  isActive: boolean;
  passkey: string;
  systemBehavior: string;
  jingleUrl: string | null;
  assetUrl: string | null;
  appIconUrl: string | null;
  maintenanceMessage?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  welcomeFeatures?: string[];
  landingTitle?: string;
  landingDescription?: string;
  loginWelcomeMessage?: string;
  postLoginWelcomeTitle?: string;
  postLoginWelcomeContent?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

export const subscribeToConfig = (callback: (config: AppConfig) => void) => {
  const path = 'config/main';
  return onSnapshot(doc(managementDb, 'config', 'main'), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as AppConfig);
    } else {
      // Default configuration if none exists
      callback({
        isActive: true,
        passkey: '1234',
        systemBehavior: 'Friendly assistant',
        jingleUrl: null,
        assetUrl: null,
        appIconUrl: null,
        welcomeTitle: 'ようこそ！',
        welcomeSubtitle: 'みんなとつながる新しい交流の世界へ！',
        landingTitle: 'あいちゃ2.0',
        landingDescription: 'Secure Messenger Gateway'
      } as AppConfig);
    }
  }, (error) => {
    // Only log if it's not a temporary offline issue
    if (error.code !== 'unavailable' && !error.message.includes('offline')) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  });
};

export const updateAppConfig = (config: Partial<AppConfig>) => {
  const path = 'config/main';
  return setDoc(doc(managementDb, 'config', 'main'), config, { merge: true })
    .catch(error => {
      throw handleFirestoreError(error, OperationType.WRITE, path);
    });
};
