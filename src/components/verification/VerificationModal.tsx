'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { X, ShieldCheck, FileText, UploadCloud, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { toast } from 'sonner';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSubmitted?: () => void;
}

export default function VerificationModal({
  isOpen,
  onClose,
  profile,
  onSubmitted,
}: VerificationModalProps) {
  const t = useTranslations('verification');
  const [crNumber, setCrNumber] = useState(profile?.cr_number || '');
  const [docName, setDocName] = useState('');
  const [docDataUrl, setDocDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }
      setDocName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setDocDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('profiles')
          .update({
            cr_number: crNumber.trim(),
            cr_document_url: docDataUrl || (docName ? `document_${docName}` : null),
            verification_status: 'pending_review',
          })
          .eq('id', profile.id);

        if (error) throw error;
      }

      toast.success(t('submitSuccessToast'));
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || t('submitErrorToast'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0E1524] border border-amber-500/30 p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('modalTitle')}</h3>
              <p className="text-xs text-slate-400">{t('modalSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('crNumberLabel')} *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute start-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                maxLength={10}
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                placeholder={t('crNumberPlaceholder')}
                className="w-full ps-9 pe-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{t('crHelpText')}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('uploadLabel')} (PDF / JPEG / PNG)
            </label>
            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 hover:border-amber-500/50 transition-colors text-center cursor-pointer">
              {docName ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-xs font-bold text-white truncate max-w-xs">{docName}</span>
                </div>
              ) : (
                <UploadCloud className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              )}
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('uploadFormatHelp')}
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="doc-upload"
              />
              <label
                htmlFor="doc-upload"
                className="mt-3 inline-block px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700 cursor-pointer"
              >
                {t('browseFiles')}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !crNumber.trim()}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-glow transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? t('submitting') : t('submitVerificationBtn')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
