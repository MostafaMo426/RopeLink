'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { X, PenTool, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AgreementSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreementId: string;
  companyName: string;
  isProposer: boolean;
  // H1 FIX: onSign now returns { success, error? } instead of bare boolean,
  // allowing DB trigger rejection messages to surface in the UI.
  onSign: (agreementId: string, isProposer: boolean) => Promise<{ success: boolean; error?: string }>;
}

export default function AgreementSignatureModal({
  isOpen,
  onClose,
  agreementId,
  companyName,
  isProposer,
  onSign,
}: AgreementSignatureModalProps) {
  const t = useTranslations('agreements');
  const [signing, setSigning] = useState(false);
  // H1 FIX: localError holds a DB-level or network error message shown inline.
  const [localError, setLocalError] = useState<string | null>(null);

  // U7: Reset local error state whenever the modal opens (isOpen → true) or
  // the target agreement changes, so stale errors from a previous interaction
  // are never shown to the user on a fresh open.
  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
    }
  }, [isOpen, agreementId]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSigning(true);
    setLocalError(null);

    const result = await onSign(agreementId, isProposer);
    setSigning(false);

    if (result.success) {
      toast.success(t('toastSigned'));
      onClose();
    } else {
      // H1 FIX: Surface the rejection reason inline so the user understands
      // why the action failed (e.g. trigger guard, prerequisite not met).
      const msg = result.error ?? t('signErrorFallback');
      setLocalError(msg);
      toast.error(t('toastSignFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-[#0E1524] border border-amber-500/30 p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <PenTool className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">{t('signModalTitle')}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{t('signModalDesc')}</p>

        {/* Electronic Acceptance Record */}
        <div className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 text-center space-y-2">
          <Shield className="w-6 h-6 text-amber-400 mx-auto" />
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">
            {companyName}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            STAMP ID: {agreementId.slice(0, 8)}-AUTH-{Date.now().toString().slice(-4)}
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('stampReady')}</span>
          </div>
        </div>

        {/* H1 FIX: Inline error panel — shown only when the DB rejects the action. */}
        {localError && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
            <p className="text-[11px] leading-relaxed break-words">{localError}</p>
          </div>
        )}

        <button
          disabled={signing}
          onClick={handleConfirm}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-amber-glow transition-all cursor-pointer disabled:opacity-50"
        >
          {signing ? t('signingBtn') : t('confirmSignatureBtn')}
        </button>
      </motion.div>
    </div>
  );
}
