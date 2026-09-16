import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import OtpInput from './OtpInput';
import { 
  X, 
  Phone, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  Sparkles,
  Copy,
  Check,
  HelpCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  onSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMessage,
  onSuccess
}: AuthModalProps) {
  const { 
    signInWithGoogle, 
    sendPhoneOTP, 
    verifyPhoneOTP, 
    resendPhoneOTP, 
    authActionLoading, 
    error, 
    clearError,
    isAuthenticated
  } = useAuth();

  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [domainCopied, setDomainCopied] = useState(false);

  // Close modal and call onSuccess when authenticated
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      onClose();
      if (onSuccess) onSuccess();
    }
  }, [isOpen, isAuthenticated, onClose, onSuccess]);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setStep('input');
      setPhoneNumber('');
      setOtpValue('');
      setCountdown(30);
      setCanResend(false);
      setPhoneError('');
      clearError();
    }
  }, [isOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (step === 'otp' && countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mask phone for display
  const maskedPhone = phoneNumber.length >= 10
    ? `+91 ${phoneNumber.slice(0, 2)}*** ***${phoneNumber.slice(-2)}`
    : `+91 ${phoneNumber}`;

  const validatePhone = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (!clean) {
      setPhoneError('Please enter your mobile number.');
      return false;
    }
    if (clean.length !== 10) {
      setPhoneError('Mobile number must be exactly 10 digits.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSendOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validatePhone(phoneNumber)) return;

    clearError();
    const success = await sendPhoneOTP(phoneNumber, 'recaptcha-auth-container');
    if (success) {
      setStep('otp');
      setCountdown(30);
      setCanResend(false);
      setOtpValue('');
    }
  };

  const handleVerifyOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (otpValue.length !== 6) return;

    clearError();
    const success = await verifyPhoneOTP(otpValue);
    if (success) {
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    clearError();
    const success = await resendPhoneOTP('recaptcha-auth-container');
    if (success) {
      setCountdown(30);
      setCanResend(false);
      setOtpValue('');
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    const success = await signInWithGoogle();
    if (success) {
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dimmed Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 text-slate-800 dark:text-slate-100 z-10 transition-all duration-200 animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Invisible reCAPTCHA Anchor */}
        <div id="recaptcha-auth-container" className="hidden" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 mb-3 shadow-sm">
            <svg 
              viewBox="0 0 100 100" 
              className="w-8 h-8 fill-none stroke-current"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 32,16 H 20 A 6,6 0 0,0 14,22 V 34" />
              <path d="M 68,16 H 80 A 6,6 0 0,1 86,22 V 34" />
              <path d="M 14,66 V 78 A 6,6 0 0,0 20,84 H 32" />
              <path d="M 86,66 V 78 A 6,6 0 0,1 80,84 H 68" />
              <rect x="24" y="24" width="14" height="14" rx="3" strokeWidth="5" />
              <rect x="62" y="24" width="14" height="14" rx="3" strokeWidth="5" />
              <rect x="24" y="62" width="14" height="14" rx="3" strokeWidth="5" />
              <circle cx="50" cy="50" r="14" strokeWidth="5" className="stroke-teal-600 dark:stroke-teal-400" />
              <path d="M 44,50 L 48,54 L 56,44" strokeWidth="5" className="stroke-emerald-500" />
            </svg>
          </div>

          <h2 id="auth-modal-title" className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {step === 'input' ? 'Welcome Back 👋' : 'Verify Mobile Number'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {step === 'input' 
              ? (initialMessage || 'Login or create an account to continue')
              : `Enter the 6-digit OTP sent to ${maskedPhone}`
            }
          </p>
        </div>

        {/* Global Error Notice with actionable troubleshooting help */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex flex-col gap-2.5 text-sm text-red-600 dark:text-red-400 animate-slideDown">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">{error}</div>
              <button 
                onClick={clearError} 
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0.5 cursor-pointer"
                title="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If error is unauthorized domain, offer 1-click copy domain */}
            {error.includes('not authorized in Firebase') && (
              <div className="mt-1 pt-2 border-t border-red-200/70 dark:border-red-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded text-[11px] text-red-800 dark:text-red-200">
                  {typeof window !== 'undefined' ? window.location.hostname : ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(window.location.hostname);
                      setDomainCopied(true);
                      setTimeout(() => setDomainCopied(false), 2500);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-[11px] transition-colors cursor-pointer"
                >
                  {domainCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied Domain!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Domain</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: INITIAL LOGIN / SIGNUP VIEW */}
        {step === 'input' && (
          <div className="space-y-4">
            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authActionLoading !== null}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {authActionLoading === 'google' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  {/* Google colored G Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider with "OR" */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider relative">
                OR
              </span>
            </div>

            {/* Mobile Number Form */}
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label 
                  htmlFor="auth-mobile-input" 
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
                >
                  Mobile Number
                </label>
                <div className="relative flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all overflow-hidden">
                  {/* Country Prefix badge */}
                  <div className="flex items-center gap-1.5 px-3.5 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 select-none">
                    <span className="text-base">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  {/* Input field */}
                  <input
                    id="auth-mobile-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(clean);
                      if (phoneError) setPhoneError('');
                    }}
                    className="w-full py-3 px-3.5 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-sm font-medium tracking-wide"
                    autoComplete="tel-national"
                  />
                  {phoneNumber.length === 10 && (
                    <div className="flex items-center pr-3 text-emerald-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">{phoneError}</p>
                )}
              </div>

              {/* Send OTP Button */}
              <button
                type="submit"
                disabled={authActionLoading !== null || phoneNumber.length < 10}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {authActionLoading === 'otp_send' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </form>

            {/* Account state info note */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account? <span className="font-semibold text-emerald-600 dark:text-emerald-400">Login</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                New here? Your account will be created automatically.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: OTP VERIFICATION VIEW */}
        {step === 'otp' && (
          <div className="space-y-4">
            {/* Back to phone change */}
            <button
              type="button"
              onClick={() => {
                setStep('input');
                clearError();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change mobile number</span>
            </button>

            {/* OTP 6-digit input */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <OtpInput 
                value={otpValue} 
                onChange={setOtpValue} 
                length={6} 
                disabled={authActionLoading !== null}
              />

              {/* Verify OTP Button */}
              <button
                type="submit"
                disabled={authActionLoading !== null || otpValue.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {authActionLoading === 'otp_verify' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify OTP</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend OTP area */}
            <div className="text-center pt-2">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={authActionLoading !== null}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 underline underline-offset-4 cursor-pointer disabled:opacity-50"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Resend OTP in <span className="font-semibold text-emerald-600 dark:text-emerald-400">{countdown}s</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Security & Privacy Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted & secure authentication via Firebase</span>
          </p>

          {/* Quick Troubleshooting Accordion */}
          <details className="text-left bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60 cursor-pointer group">
            <summary className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between outline-none select-none">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                Firebase Configuration Guide
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] space-y-2 text-slate-500 dark:text-slate-400">
              <div>
                <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">1. Fix "Unauthorized Domain":</strong>
                <span>Add <code className="bg-slate-200/60 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[10px]">{typeof window !== 'undefined' ? window.location.hostname : 'your-domain'}</code> to Firebase Console → Authentication → Settings → Authorized domains.</span>
              </div>
              <div>
                <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">2. Fix "SMS Region" / Operation Not Allowed:</strong>
                <span>In Firebase Console → Authentication → Settings → <strong>SMS Region Policy</strong>, enable India (+91) or your country, OR add a test phone number under Sign-in method → Phone → Phone numbers for testing (e.g. +91 9876543210 with code 123456).</span>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
