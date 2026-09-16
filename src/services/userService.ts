import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { UserProfile, SavedQRCode, PaymentData, TabType } from '../types';

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
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw error;
}

/**
 * Sync user profile to Firestore on login / signup
 */
export async function syncUserProfile(user: User, providerHint?: 'google' | 'phone'): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  
  // Determine primary provider
  let providerType: 'google' | 'phone' | 'multiple' = providerHint || 'google';
  if (user.providerData && user.providerData.length > 1) {
    providerType = 'multiple';
  } else if (user.providerData && user.providerData.length === 1) {
    const pId = user.providerData[0].providerId;
    if (pId === 'phone') providerType = 'phone';
    else if (pId === 'google.com') providerType = 'google';
  }

  try {
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const existingData = docSnap.data() as UserProfile;
      const updates: Partial<UserProfile> = {
        updatedAt: serverTimestamp()
      };

      if (!existingData.displayName && user.displayName) {
        updates.displayName = user.displayName;
      }
      if (!existingData.email && user.email) {
        updates.email = user.email;
      }
      if (!existingData.phoneNumber && user.phoneNumber) {
        updates.phoneNumber = user.phoneNumber;
      }
      if (!existingData.photoURL && user.photoURL) {
        updates.photoURL = user.photoURL;
      }
      if (user.providerData && user.providerData.length > 1) {
        updates.provider = 'multiple';
      }

      await updateDoc(userRef, updates);
      return {
        ...existingData,
        ...updates
      };
    } else {
      // Create new user profile document
      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || (user.phoneNumber ? `User ${user.phoneNumber.slice(-4)}` : 'Exact Pay User'),
        email: user.email || null,
        phoneNumber: user.phoneNumber || null,
        photoURL: user.photoURL || null,
        provider: providerType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    // If Firestore database is not yet provisioned or enabled, return optimistic profile from Auth
    console.warn('Firestore profile sync note (database may be pending rules/provisioning):', error);
    return {
      uid: user.uid,
      displayName: user.displayName || (user.phoneNumber ? `User ${user.phoneNumber.slice(-4)}` : 'Exact Pay User'),
      email: user.email || null,
      phoneNumber: user.phoneNumber || null,
      photoURL: user.photoURL || null,
      provider: providerType
    };
  }
}

/**
 * Update custom user settings like default UPI ID, payee name, or display name
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

/**
 * Save generated QR code to user's saved QRs collection in Firestore
 */
export async function saveUserQRCode(
  uid: string, 
  paymentData: PaymentData, 
  title: string, 
  type: TabType
): Promise<SavedQRCode> {
  const qrsCollection = collection(db, 'users', uid, 'saved_qrs');
  const qrId = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(qrsCollection, qrId);

  const qrRecord: SavedQRCode = {
    id: qrId,
    userId: uid,
    title: title || (paymentData.payeeName ? `${paymentData.payeeName} Payment` : 'Quick Payment'),
    paymentData,
    type,
    createdAt: Date.now()
  };

  try {
    await setDoc(docRef, {
      ...qrRecord,
      timestamp: serverTimestamp()
    });
    return qrRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}/saved_qrs/${qrId}`);
    return qrRecord;
  }
}

/**
 * Fetch all saved QR codes for the current user
 */
export async function fetchUserQRCodes(uid: string): Promise<SavedQRCode[]> {
  const qrsCollection = collection(db, 'users', uid, 'saved_qrs');
  try {
    const q = query(qrsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results: SavedQRCode[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      results.push({
        id: d.id,
        userId: uid,
        title: data.title || 'Saved Payment',
        paymentData: data.paymentData,
        type: data.type || 'upi',
        createdAt: data.createdAt || Date.now()
      });
    });
    return results;
  } catch (error) {
    console.warn('Note: Could not fetch from Firestore saved_qrs (check rules/offline):', error);
    // Fallback to local storage for seamless offline experience if firestore throws
    try {
      const local = localStorage.getItem(`exactpay_saved_qrs_${uid}`);
      if (local) return JSON.parse(local);
    } catch {
      // ignore
    }
    return [];
  }
}

/**
 * Delete a saved QR code
 */
export async function deleteUserQRCode(uid: string, qrId: string): Promise<void> {
  const docRef = doc(db, 'users', uid, 'saved_qrs', qrId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/saved_qrs/${qrId}`);
  }
}
