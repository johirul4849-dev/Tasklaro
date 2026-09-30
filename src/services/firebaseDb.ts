import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
} from 'firebase/firestore';
import { auth } from './googleAuth';
import { getApps, initializeApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { ActivityMemoryEntry, BotTeammate, UserInstructionProfile } from '../types/bot';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: Connect to provisioned Firestore database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline, local storage fallback active.');
    }
  }
}
testConnection();

/**
 * Saves user's bots collection to Firestore with localStorage synchronization.
 */
export async function saveUserBots(userId: string, bots: BotTeammate[]): Promise<void> {
  const accountKey = userId || auth.currentUser?.email || 'guest';
  localStorage.setItem(`agentflow_bots_${accountKey}`, JSON.stringify(bots));

  if (!userId && !auth.currentUser?.uid) return;
  const uid = userId || auth.currentUser?.uid;
  const path = `users/${uid}/workspace/bots`;

  try {
    const docRef = doc(db, 'users', uid!, 'workspace', 'bots');
    await setDoc(
      docRef,
      {
        bots,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore bots sync fallback to localStorage:', err);
  }
}

/**
 * Loads user's bots from Firestore (or fallback to localStorage).
 */
export async function loadUserBots(userId: string): Promise<BotTeammate[] | null> {
  const accountKey = userId || auth.currentUser?.email || 'guest';
  const local = localStorage.getItem(`agentflow_bots_${accountKey}`);

  if (!userId && !auth.currentUser?.uid) {
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return null;
  }

  const uid = userId || auth.currentUser?.uid;
  const path = `users/${uid}/workspace/bots`;
  try {
    const docRef = doc(db, 'users', uid!, 'workspace', 'bots');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data?.bots) && data.bots.length > 0) {
        localStorage.setItem(`agentflow_bots_${accountKey}`, JSON.stringify(data.bots));
        return data.bots;
      }
    }
  } catch (err) {
    console.warn('Firestore read error, falling back to local storage:', err);
  }

  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return null;
}

/**
 * Saves user's Activity Memory to Firestore.
 */
export async function saveUserMemory(userId: string, memory: ActivityMemoryEntry[]): Promise<void> {
  const accountKey = userId || auth.currentUser?.email || 'guest';
  localStorage.setItem(`agentflow_memory_${accountKey}`, JSON.stringify(memory));

  if (!userId && !auth.currentUser?.uid) return;
  const uid = userId || auth.currentUser?.uid;

  try {
    const docRef = doc(db, 'users', uid!, 'workspace', 'memory');
    await setDoc(
      docRef,
      {
        memory,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore memory sync fallback to localStorage:', err);
  }
}

/**
 * Loads user's Activity Memory from Firestore.
 */
export async function loadUserMemory(userId: string): Promise<ActivityMemoryEntry[] | null> {
  const accountKey = userId || auth.currentUser?.email || 'guest';
  const local = localStorage.getItem(`agentflow_memory_${accountKey}`);

  if (!userId && !auth.currentUser?.uid) {
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return null;
  }

  const uid = userId || auth.currentUser?.uid;
  try {
    const docRef = doc(db, 'users', uid!, 'workspace', 'memory');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data?.memory)) {
        localStorage.setItem(`agentflow_memory_${accountKey}`, JSON.stringify(data.memory));
        return data.memory;
      }
    }
  } catch (err) {
    console.warn('Firestore memory read error, falling back to local storage:', err);
  }

  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return null;
}

/**
 * Saves user's custom instructions and profile to Firestore.
 */
export async function saveUserProfile(userId: string, profile: UserInstructionProfile): Promise<void> {
  const accountKey = userId || auth.currentUser?.email || 'guest';
  localStorage.setItem(`agentflow_profile_${accountKey}`, JSON.stringify(profile));

  if (!userId && !auth.currentUser?.uid) return;
  const uid = userId || auth.currentUser?.uid;

  try {
    const docRef = doc(db, 'users', uid!, 'workspace', 'profile');
    await setDoc(
      docRef,
      {
        profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore profile sync fallback to localStorage:', err);
  }
}

/**
 * Loads user's custom instructions and profile from Firestore.
 */
export async function loadUserProfile(userId: string): Promise<UserInstructionProfile | null> {
  const accountKey = userId || auth.currentUser?.email || 'guest';
  const local = localStorage.getItem(`agentflow_profile_${accountKey}`);

  if (!userId && !auth.currentUser?.uid) {
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return null;
  }

  const uid = userId || auth.currentUser?.uid;
  try {
    const docRef = doc(db, 'users', uid!, 'workspace', 'profile');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data?.profile) {
        localStorage.setItem(`agentflow_profile_${accountKey}`, JSON.stringify(data.profile));
        return data.profile;
      }
    }
  } catch (err) {
    console.warn('Firestore profile read error, falling back to local storage:', err);
  }

  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return null;
}
