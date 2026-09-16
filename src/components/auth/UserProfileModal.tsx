import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import OtpInput from './OtpInput';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Phone, 
  LogOut, 
  Link as LinkIcon, 
  CheckCircle, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  Edit3, 
  Save,
  Copy,
  Check 
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSavedQRs?: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  onOpenSavedQRs
}: UserProfileModalProps) {
  const { 
    currentUser, 
    userProfile, 
    logout, 
    linkGoogleAccount, 
    sendLinkPhoneOTP, 
    verifyLinkPhoneOTP, 
    updateUserProfileData,
    authActionLoading, 
    error, 
    clearError 
  } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [defaultUpiId, setDefaultUpiId] = useState('');
  const [defaultPayeeName, setDefaultPayeeName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Linking state
  const [showPhoneLinkInput, setShowPhoneLinkInput] = useState(false);
  const [linkPhone, setLinkPhone] = useState('');
  const [linkOtp, setLinkOtp] = useState('');
  const [phoneLinkStep, setPhoneLinkStep] = useState<'phone' | 'otp'>('phone');
  const [domainCopied, setDomainCopied] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setDefaultUpiId(userProfile.defaultUpiId || '');
      setDefaultPayeeName(userProfile.defaultPayeeName || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setShowPhoneLinkInput(false);
      setPhoneLinkStep('phone');
      setLinkPhone('');
      setLinkOtp('');
      clearError();
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  // Check which providers are linked
  const isGoogleLinked = currentUser.providerData.some((p) => p.providerId === 'google.com');
  const isPhoneLinked = currentUser.providerData.some((p) => p.providerId === 'phone');

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    clearError();
    try {
      await updateUserProfileData({
        displayName: displayName.trim(),
        defaultUpiId: defaultUpiId.trim(),
        defaultPayeeName: defaultPayeeName.trim()
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkGoogle = async () => {
    clearError();
    await linkGoogleAccount();
  };

  const handleSendLinkPhoneOtp = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await sendLinkPhoneOTP(linkPhone, 'recaptcha-link-container');
    if (success) {
      setPhoneLinkStep('otp');
    }
  };

  const handleVerifyLinkPhoneOtp = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await verifyLinkPhoneOTP(linkOtp);
    if (success) {
      setShowPhoneLinkInput(false);
      setPhoneLinkStep('phone');
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Invisible reCAPTCHA container for linking phone */}
      <div id="recaptcha-link-container" className="hidden" />

      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 text-slate-800 dark:text-slate-100 z-10 transition-all duration-200 animate-scaleUp max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || 'User profile'} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                {(currentUser.displayName || currentUser.email || currentUser.phoneNumber || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 id="user-profile-modal-title" className="text-xl font-bold font-display text-slate-900 dark:text-white truncate">
              {currentUser.displayName || userProfile?.displayName || 'Exact Pay User'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentUser.email || currentUser.phoneNumber || 'Authenticated User'}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {isGoogleLinked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                  Google Linked
                </span>
              )}
              {isPhoneLinked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                  Phone Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex flex-col gap-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 animate-slideDown">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
              <button onClick={clearError} className="p-0.5 text-red-400 hover:text-red-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* If error is unauthorized domain, offer 1-click copy domain */}
            {error.includes('not authorized in Firebase') && (
              <div className="mt-0.5 pt-2 border-t border-red-200/70 dark:border-red-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-[11px] transition-colors cursor-pointer"
                >
                  {domainCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
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

        {/* Success notification */}
        {saveSuccess && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Profile saved successfully!</span>
          </div>
        )}

        {/* PROFILE SETTINGS & PREFERENCES */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Payment Preferences
            </h3>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Defaults</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Default UPI ID (Auto-fills generator)
                </label>
                <input
                  type="text"
                  value={defaultUpiId}
                  onChange={(e) => setDefaultUpiId(e.target.value)}
                  placeholder="e.g. merchant@okaxis"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Default Payee Name
                </label>
                <input
                  type="text"
                  value={defaultPayeeName}
                  onChange={(e) => setDefaultPayeeName(e.target.value)}
                  placeholder="e.g. Exact Supermarket"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </form>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Default UPI ID:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {userProfile?.defaultUpiId || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Default Payee:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {userProfile?.defaultPayeeName || 'Not set'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ACCOUNT LINKING SECTION (Section 8 of Requirements) */}
        <div className="mb-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span>Connected Sign-in Methods</span>
          </h3>

          <div className="space-y-3">
            {/* Google provider status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Google Account</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser.email || (isGoogleLinked ? 'Connected' : 'Not linked')}
                  </p>
                </div>
              </div>
              {isGoogleLinked ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Linked
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  disabled={authActionLoading !== null}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {authActionLoading === 'link_google' ? 'Linking...' : 'Link Google'}
                </button>
              )}
            </div>

            {/* Phone provider status */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Mobile Number</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {currentUser.phoneNumber || (isPhoneLinked ? 'Connected' : 'Not linked')}
                    </p>
                  </div>
                </div>
                {isPhoneLinked ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Linked
                  </span>
                ) : !showPhoneLinkInput ? (
                  <button
                    type="button"
                    onClick={() => setShowPhoneLinkInput(true)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Link Phone
                  </button>
                ) : null}
              </div>

              {/* Inline Phone linking drawer */}
              {showPhoneLinkInput && !isPhoneLinked && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {phoneLinkStep === 'phone' ? (
                    <form onSubmit={handleSendLinkPhoneOtp} className="space-y-2">
                      <div className="flex gap-2">
                        <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-750 text-xs font-semibold flex items-center">
                          +91
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="Enter mobile number"
                          value={linkPhone}
                          onChange={(e) => setLinkPhone(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowPhoneLinkInput(false)}
                          className="px-3 py-1 text-xs text-slate-500 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={linkPhone.length < 10 || authActionLoading !== null}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {authActionLoading === 'link_phone_send' ? 'Sending...' : 'Send OTP'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyLinkPhoneOtp} className="space-y-2">
                      <p className="text-[11px] text-slate-500">Enter 6-digit OTP sent to +91 {linkPhone}:</p>
                      <OtpInput value={linkOtp} onChange={setLinkOtp} length={6} disabled={authActionLoading !== null} />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setPhoneLinkStep('phone')}
                          className="px-3 py-1 text-xs text-slate-500 cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={linkOtp.length !== 6 || authActionLoading !== null}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {authActionLoading === 'link_phone_verify' ? 'Verifying...' : 'Confirm Link'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links & Actions */}
        {onOpenSavedQRs && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSavedQRs();
              }}
              className="w-full py-3 px-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-between hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
            >
              <span>View My Saved QR Codes & Payment Links</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Logout Button (Section 11) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Signed in to Exact Pay</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
