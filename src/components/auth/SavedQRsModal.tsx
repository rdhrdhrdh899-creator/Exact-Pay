import { useState, useEffect, MouseEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchUserQRCodes, deleteUserQRCode } from '../../services/userService';
import { SavedQRCode, PaymentData, TabType } from '../../types';
import { 
  X, 
  Trash2, 
  ExternalLink, 
  QrCode, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  PlusCircle, 
  Check 
} from 'lucide-react';

interface SavedQRsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadIntoForm: (data: PaymentData, type: TabType) => void;
  onOpenAuth: () => void;
}

export default function SavedQRsModal({
  isOpen,
  onClose,
  onLoadIntoForm,
  onOpenAuth
}: SavedQRsModalProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [qrs, setQrs] = useState<SavedQRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadQRs();
    }
  }, [isOpen, currentUser]);

  const loadQRs = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const items = await fetchUserQRCodes(currentUser.uid);
      setQrs(items);
    } catch (err) {
      console.error('Failed to load saved QRs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      await deleteUserQRCode(currentUser.uid, id);
      setQrs((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete QR:', err);
    }
  };

  const handleApply = (item: SavedQRCode) => {
    onLoadIntoForm(item.paymentData, item.type);
    setAppliedId(item.id);
    setTimeout(() => {
      setAppliedId(null);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 text-slate-800 dark:text-slate-100 z-10 transition-all duration-200 animate-scaleUp max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Saved Payment QRs & Links
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access and restore your saved payment configurations
            </p>
          </div>
        </div>

        {/* Unauthenticated view */}
        {!isAuthenticated ? (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Sign In to View Your Saved QRs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
              Create an account or sign in to save your frequently used UPI payment links and bank transfer QRs.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
            >
              Sign In with Google or Mobile
            </button>
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-xs">Loading your saved payment configurations...</p>
          </div>
        ) : qrs.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <PlusCircle className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Saved QRs Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 mb-5">
              Fill in your payment details in the generator and click "Save to Account" to save them here for 1-click access!
            </p>
            <button
              onClick={onClose}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Go to Generator
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {qrs.map((item) => {
              const isUpi = item.type === 'upi';
              const identifier = isUpi ? item.paymentData.upiId : item.paymentData.accountNo;
              const dateString = new Date(item.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={item.id}
                  onClick={() => handleApply(item)}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 hover:border-emerald-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isUpi 
                          ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' 
                          : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono truncate max-w-[180px] sm:max-w-[240px]">{identifier}</span>
                      {item.paymentData.amount && (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{item.paymentData.amount}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {dateString}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(item);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
                    >
                      {appliedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied!</span>
                        </>
                      ) : (
                        <>
                          <span>Load</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Delete saved QR"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
