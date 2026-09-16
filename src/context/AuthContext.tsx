import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useRef, 
  ReactNode 
} from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  linkWithPopup,
  linkWithPhoneNumber
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { UserProfile } from '../types';
import { syncUserProfile, updateUserProfile } from '../services/userService';

export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  authActionLoading: string | null;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<boolean>;
  sendPhoneOTP: (rawPhoneNumber: string, recaptchaContainerId: string) => Promise<boolean>;
  verifyPhoneOTP: (otp: string) => Promise<boolean>;
  resendPhoneOTP: (recaptchaContainerId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  linkGoogleAccount: () => Promise<boolean>;
  sendLinkPhoneOTP: (rawPhoneNumber: string, recaptchaContainerId: string) => Promise<boolean>;
  verifyLinkPhoneOTP: (otp: string) => Promise<boolean>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  pendingPhoneNumber: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function mapAuthError(error: any): string {
  if (!error) return 'An error occurred. Please try again.';
  const code = error.code || '';
  const message = error.message || '';

  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return `Domain "${currentDomain}" is not authorized in Firebase. Add "${currentDomain}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
  }
  if (
    code === 'auth/operation-not-allowed' || 
    message.includes('operation-not-allowed') ||
    message.includes('SMS unable to be sent until this region enabled')
  ) {
    if (message.includes('region enabled') || message.includes('SMS')) {
      return 'SMS is not enabled for this country/region in your Firebase project. Go to Firebase Console -> Authentication -> Settings -> SMS Region Policy to enable India (+91), or use test phone numbers in Firebase Console.';
    }
    return 'This sign-in method is not enabled in Firebase Console. Please enable Google and Phone providers under Authentication -> Sign-in method.';
  }
  if (code === 'auth/invalid-phone-number') {
    return 'Please enter a valid 10-digit mobile number.';
  }
  if (code === 'auth/missing-phone-number') {
    return 'Mobile number is required.';
  }
  if (code === 'auth/quota-exceeded') {
    return 'SMS quota exceeded for now. Please sign in with Google or try again later.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }
  if (code === 'auth/code-expired' || code === 'auth/session-expired') {
    return 'This OTP has expired. Please request a new code.';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'The OTP is incorrect. Please check the code and try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Unable to connect. Please check your internet connection and try again.';
  }
  if (code === 'auth/credential-already-in-use') {
    return 'This phone number or Google account is already linked to another profile.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email using a different sign-in method.';
  }
  if (code === 'auth/requires-recent-login') {
    return 'For security, please log out and log in again before linking accounts.';
  }
  if (message.includes('reCAPTCHA')) {
    return 'reCAPTCHA verification failed. Please try again.';
  }
  return message && message.length < 100 ? message : 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authActionLoading, setAuthActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Phone OTP tracking
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string>('');
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const linkConfirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const clearError = () => setError(null);

  // Clean up any existing recaptcha instance
  const clearRecaptcha = () => {
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } catch (e) {
      console.warn('Error clearing recaptcha:', e);
      recaptchaVerifierRef.current = null;
    }
  };

  // Setup / get RecaptchaVerifier
  const getRecaptchaVerifier = (containerId: string): RecaptchaVerifier => {
    clearRecaptcha();
    
    // Ensure target container exists
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`reCAPTCHA container #${containerId} not found in DOM`);
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setError('reCAPTCHA expired. Please try sending OTP again.');
      }
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
        } catch (err) {
          console.warn('Profile sync fallback:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearRecaptcha();
    };
  }, []);

  /**
   * Google Sign-In
   */
  const signInWithGoogle = async (): Promise<boolean> => {
    setError(null);
    setAuthActionLoading('google');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(result.user, 'google');
      setUserProfile(profile);
      return true;
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(mapAuthError(err));
      return false;
    } finally {
      setAuthActionLoading(null);
    }
  };

  /**
   * Send Phone OTP
   */
  const sendPhoneOTP = async (rawPhone: string, containerId: string): Promise<boolean> => {
    setError(null);
    setAuthActionLoading('otp_send');

    // Format phone to E.164 (+91 for India if not specified)
    let formatted = rawPhone.replace(/[^\d+]/g, '');
    if (!formatted.startsWith('+')) {
      if (formatted.length === 10) {
        formatted = `+91${formatted}`;
      } else {
        setError('Please enter a valid 10-digit mobile number.');
        setAuthActionLoading(null);
        return false;
      }
    }

    try {
      const verifier = getRecaptchaVerifier(containerId);
      const confirmationResult = await signInWithPhoneNumber(auth, formatted, verifier);
      confirmationResultRef.current = confirmationResult;
      setPendingPhoneNumber(formatted);
      return true;
    } catch (err: any) {
      console.error('Send Phone OTP Error:', err);
      clearRecaptcha();
      setError(mapAuthError(err));
      return false;
    } finally {
      setAuthActionLoading(null);
    }
  };

  /**
   * Verify Phone OTP
   */
  const verifyPhoneOTP = async (otp: string): Promise<boolean> => {
    if (!confirmationResultRef.current) {
      setError('No active OTP session. Please request a new OTP.');
      return false;
    }

    setError(null);
    setAuthActionLoading('otp_verify');

    try {
      const result = await confirmationResultRef.current.confirm(otp.trim());
      const profile = await syncUserProfile(result.user, 'phone');
      setUserProfile(profile);
      confirmationResultRef.current = null;
      setPendingPhoneNumber('');
      clearRecaptcha();
      return true;
    } catch (err: any) {
      console.error('Verify Phone OTP Error:', err);
      setError(mapAuthError(err));
      return false;
    } finally {
      setAuthActionLoading(null);
    }
  };

  /**
   * Resend Phone OTP
   */
  const resendPhoneOTP = async (containerId: string): Promise<boolean> => {
    if (!pendingPhoneNumber) {
      setError('Please re-enter your mobile number.');
      return false;
    }
    return sendPhoneOTP(pendingPhoneNumber, containerId);
  };

  /**
   * Link Google Account to an existing logged-in Phone user
   */
  const linkGoogleAccount = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setError(null);
    setAuthActionLoading('link_google');
    try {
      const result = await linkWithPopup(auth.currentUser, googleProvider);
      const profile = await syncUserProfile(result.user);
      setUserProfile(profile);
      return true;
    } catch (err: any) {
      console.error('Link Google Account Error:', err);
      setError(mapAuthError(err));
      return false;
    } finally {
      setAuthActionLoading(null);
    }
  };

  /**
   * Send OTP to link phone number to existing Google user
   */
  const sendLinkPhoneOTP = async (rawPhone: string, containerId: string): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setError(null);
    setAuthActionLoading('link_phone_send');

    let formatted = rawPhone.replace(/[^\d+]/g, '');
    if (!formatted.startsWith('+')) {
      if (formatted.length === 10) formatted = `+91${formatted}`;
      else {
        setError('Please enter a valid 10-digit mobile number.');
        setAuthActionLoading(null);
        return false;
      }
    }

    try {
      const verifier = getRecaptchaVerifier(containerId);
      const confirmationResult = await linkWithPhoneNumber(auth.currentUser, formatted, verifier);
      linkConfirmationResultRef.current = confirmationResult;
      setPendingPhoneNumber(formatted);
      return true;
    } catch (err: any) {
      console.error('Send Link Phone OTP Error:', err);
      clearRecaptcha();
      setError(mapAuthError(err));
      return false;
    } finally {
      setAuthActionLoading(null);
    }
  };

  /**
   * Verify link Phone OTP
   */
  const verifyLinkPhoneOTP = async (otp: string): Promise<boolean> => {
    if (!linkConfirmationResultRef.current) {
      setError('No active linking session. Please try again.');
      return false;
    }
    setError(null);
    setAuthActionLoading('link_phone_verify');
    try {
      const result = await linkConfirmationResultRef.current.confirm(otp.trim());
      const profile = await syncUserProfile(result.user);
      setUserProfile(profile);
      linkConfirmationResultRef.current = null;
      setPendingPhoneNumber('');
      clearRecaptcha();
      return true;
    } catch (err: any) {
      console.error('Verify Link Phone OTP Error:', err);
      setError(mapAuthError(err));
      return false;
    } finally {
      setAuthActionLoading(null);
    }
  };

  /**
   * Logout user and clear local session state
   */
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      clearRecaptcha();
    } catch (err: any) {
      console.error('Logout error:', err);
      setError('Failed to log out. Please try again.');
    }
  };

  /**
   * Update Profile Data (e.g. displayName, defaultUpiId, defaultPayeeName)
   */
  const updateUserProfileData = async (data: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) return;
    try {
      await updateUserProfile(currentUser.uid, data);
      setUserProfile((prev) => prev ? { ...prev, ...data } : null);
    } catch (err: any) {
      console.error('Update Profile Data Error:', err);
      setError(mapAuthError(err));
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    isAuthenticated: !!currentUser,
    loading,
    authActionLoading,
    error,
    clearError,
    signInWithGoogle,
    sendPhoneOTP,
    verifyPhoneOTP,
    resendPhoneOTP,
    logout,
    linkGoogleAccount,
    sendLinkPhoneOTP,
    verifyLinkPhoneOTP,
    updateUserProfileData,
    pendingPhoneNumber
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
