import { useEffect, useState } from 'react';
import { QRCodeToDataURLOptions } from 'qrcode';
import QRCode from 'qrcode';
import { PaymentData, TabType } from '../types';
import { generateUpiUrl, qrThemes, downloadStyledQR } from '../utils';
import { useAuth } from '../context/AuthContext';
import { saveUserQRCode } from '../services/userService';
import { Copy, Check, Download, Share2, Palette, Landmark, ShieldCheck, Bookmark, Loader2 } from 'lucide-react';

interface QRResultProps {
  activeTab: TabType;
  formData: PaymentData;
  isValid: boolean;
  onOpenAuth?: () => void;
}

export default function QRResult({ activeTab, formData, isValid, onOpenAuth }: QRResultProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [selectedThemeId, setSelectedThemeId] = useState('emerald');
  const [qrBase64, setQrBase64] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isSavingToAccount, setIsSavingToAccount] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const upiUrl = generateUpiUrl(activeTab, formData);
  const activeTheme = qrThemes.find((t) => t.id === selectedThemeId) || qrThemes[0];

  // Re-generate raw QR code image when parameters change
  useEffect(() => {
    if (!isValid) {
      setQrBase64('');
      return;
    }

    const options: QRCodeToDataURLOptions = {
      margin: 1,
      width: 400,
      color: {
        dark: '#0f172a', // dark charcoal
        light: '#ffffff',
      },
    };

    QRCode.toDataURL(upiUrl, options)
      .then((url) => {
        setQrBase64(url);
      })
      .catch((err) => {
        console.error('Error generating QR base64 preview', err);
      });
  }, [upiUrl, isValid]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(upiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownload = async () => {
    if (!isValid) return;
    setIsDownloading(true);
    try {
      await downloadStyledQR(activeTab, formData, selectedThemeId);
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!isValid) return;
    
    // Fallback: If Web Share API is available, use it. Otherwise, fallback to copying link.
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pay via Exact Pay',
          text: `Scan or click this link to pay ${formData.payeeName || 'via UPI'}:\n\n${upiUrl}`,
          url: window.location.origin,
        });
      } catch (err) {
        // Log unless user aborted
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing link', err);
        }
      }
    } else {
      // Fallback: copy link and show small toast/indicator
      await handleCopyLink();
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleSaveToAccount = async () => {
    if (!isValid) return;
    if (!isAuthenticated || !currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setIsSavingToAccount(true);
    try {
      const title = formData.payeeName ? `${formData.payeeName} Payment` : 'Quick Payment';
      await saveUserQRCode(currentUser.uid, formData, title, activeTab);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed saving to account:', err);
    } finally {
      setIsSavingToAccount(false);
    }
  };

  // Human-readable amount formatting
  const getFormattedAmount = () => {
    if (!formData.amount) return null;
    const num = parseFloat(formData.amount);
    return !isNaN(num)
      ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      : `₹${formData.amount}`;
  };

  const formattedAmount = getFormattedAmount();

  return (
    <div id="qr-result-container" className="sticky top-6 flex flex-col gap-6">
      
      {/* Dynamic Styled QR Card Preview */}
      <div
        id="live-qr-card-preview"
        className={`relative overflow-hidden rounded-3xl p-6 md:p-8 flex flex-col items-center justify-between text-center transition-all duration-500 shadow-2xl ${
          !isValid ? 'opacity-40 select-none pointer-events-none' : ''
        } ${
          activeTheme.id === 'minimal'
            ? 'bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white'
            : `bg-gradient-to-b ${activeTheme.bgGradient} text-white`
        }`}
      >
        {/* Card Header branding */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${activeTheme.id === 'minimal' ? 'bg-emerald-500' : 'bg-white animate-pulse'}`} />
            <span className="font-display font-bold text-base tracking-tight">Exact Pay</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase opacity-75">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure UPI</span>
          </div>
        </div>

        {/* The Scannable QR Frame */}
        <div className="relative w-full max-w-[260px] aspect-square bg-white rounded-2xl p-4 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-[1.02]">
          {/* Physiological Corner Brackets (Red, Blue, Yellow, and website theme Emerald) */}
          <div className="absolute -top-1.5 -left-1.5 w-8 h-8 border-t-[3.5px] border-l-[3.5px] border-red-500 rounded-tl-xl pointer-events-none" />
          <div className="absolute -top-1.5 -right-1.5 w-8 h-8 border-t-[3.5px] border-r-[3.5px] border-blue-500 rounded-tr-xl pointer-events-none" />
          <div className="absolute -bottom-1.5 -left-1.5 w-8 h-8 border-b-[3.5px] border-l-[3.5px] border-amber-500 rounded-bl-xl pointer-events-none" />
          <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 border-b-[3.5px] border-r-[3.5px] border-emerald-500 rounded-br-xl pointer-events-none" />

          {isValid && qrBase64 ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
              <img
                src={qrBase64}
                alt="Live UPI QR Code"
                className="w-full h-full object-contain pointer-events-none select-none relative z-10"
                referrerPolicy="no-referrer"
              />
              
              {/* Interactive Laser Scanning Overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-20">
                {/* Horizontal Sweeping Laser Line with emerald/teal gradient glow */}
                <div className="absolute left-0 right-0 h-[3.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.8),0_0_4px_rgba(16,185,129,1)] animate-scan" />
                
                {/* Ambient pulsating interactive scanner grid overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:10px_10px] opacity-75 pointer-events-none" />
              </div>


            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-200 gap-3 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center animate-pulse">
                <Landmark className="w-7 h-7 text-slate-300 dark:text-slate-700" />
              </div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-600">
                Awaiting valid payment credentials...
              </p>
            </div>
          )}
        </div>

        {/* Customer / Transaction Details */}
        <div className="mt-6 w-full flex flex-col items-center gap-1">
          {isValid ? (
            <>
              <p className="text-lg font-bold tracking-tight line-clamp-1">
                {formData.payeeName.trim() || 'UPI Payment'}
              </p>
              
              <p className="text-xs opacity-80 font-mono line-clamp-1 max-w-xs">
                {activeTab === 'upi' ? (
                  formData.upiId.trim()
                ) : (
                  `A/C: ${formData.accountNo?.trim().slice(-4).padStart(formData.accountNo?.trim().length || 8, '•')}`
                )}
              </p>

              {formattedAmount && (
                <p className="text-3xl font-display font-extrabold mt-3 tracking-tight">
                  {formattedAmount}
                </p>
              )}

              {formData.note && (
                <p className="text-xs italic opacity-75 mt-1 max-w-[240px] line-clamp-1">
                  "{formData.note.trim()}"
                </p>
              )}

              {/* Dynamic Branding bottom banner */}
              <div className="mt-6 text-[10px] font-bold tracking-widest opacity-50 select-none uppercase">
                by Exact Pay
              </div>
            </>
          ) : (
            <div className="py-4 text-xs opacity-60">
              Please enter your UPI ID or Bank Account details to generate your scannable payment badge.
            </div>
          )}
        </div>
      </div>

      {/* Theme Picker - Custom Visual Gradients */}
      {isValid && (
        <div id="theme-selector-container" className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 p-5 rounded-2xl transition-colors">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-4">
            <Palette className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Customize Badge Theme</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {qrThemes.map((theme) => {
              const isSelected = selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  id={`theme-btn-${theme.id}`}
                  onClick={() => setSelectedThemeId(theme.id)}
                  title={theme.name}
                  className={`w-9 h-9 rounded-full cursor-pointer relative flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none ${
                    theme.id === 'minimal'
                      ? 'bg-slate-200 border border-slate-400 dark:bg-slate-800'
                      : `bg-gradient-to-br ${theme.bgGradient}`
                  } ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950 scale-105' : 'opacity-70 hover:opacity-100'}`}
                >
                  {isSelected && (
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.id === 'minimal' ? 'bg-emerald-600' : 'bg-white'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div id="badge-actions-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          id="btn-copy-link"
          onClick={handleCopyLink}
          disabled={!isValid}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm cursor-pointer border ${
            !isValid
              ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed shadow-none'
              : copied
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 animate-scaleUp" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          id="btn-download-qr"
          onClick={handleDownload}
          disabled={!isValid || isDownloading}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm cursor-pointer ${
            !isValid
              ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed shadow-none'
              : isDownloading
              ? 'bg-emerald-600 text-white animate-pulse'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-emerald-500/20 shadow-md'
          }`}
        >
          <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
          <span>{isDownloading ? 'Saving...' : 'Download QR'}</span>
        </button>

        <button
          id="btn-share-badge"
          onClick={handleShare}
          disabled={!isValid}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm cursor-pointer border ${
            !isValid
              ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed shadow-none'
              : shareSuccess
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>{shareSuccess ? 'Copied URL!' : 'Share'}</span>
        </button>
      </div>

      {/* Save to User Account (Protected feature) */}
      {isValid && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleSaveToAccount}
            disabled={isSavingToAccount}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              savedSuccess
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {isSavingToAccount ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to your account...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved to your Exact Pay account!</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isAuthenticated ? 'Save QR to My Account' : 'Sign In to Save This QR'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Raw clickable URI for developers/debug */}
      {isValid && (
        <div id="raw-upi-preview" className="text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto line-clamp-1 font-mono hover:line-clamp-none transition-all duration-300">
            {upiUrl}
          </p>
        </div>
      )}

    </div>
  );
}
