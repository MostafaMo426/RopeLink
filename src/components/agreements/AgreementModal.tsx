'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { X, FileText, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { MatchProposal } from '@/types/database';
import { getSpecialtyLabel, getCityLabel } from '@/lib/constants';
import { toast } from 'sonner';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchProposal | null;
  currentUserId?: string;
  onCreate: (params: any) => Promise<any>;
}

export default function AgreementModal({
  isOpen,
  onClose,
  match,
  currentUserId,
  onCreate,
}: AgreementModalProps) {
  const t = useTranslations('agreements');
  const locale = useLocale();

  const [dailyRate, setDailyRate] = useState(850);
  const [daysCount, setDaysCount] = useState(10);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !match || !match.request) return null;

  const techCount = match.request.technician_count || 2;
  const totalEstimated = dailyRate * techCount * daysCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) return;

    setLoading(true);
    const startDate = match.request!.start_date;
    const endDateObj = new Date(startDate);
    endDateObj.setDate(endDateObj.getDate() + daysCount);
    const endDate = endDateObj.toISOString().split('T')[0];

    const res = await onCreate({
      match_id: match.id,
      proposer_id: match.proposer_id,
      recipient_id: match.recipient_id,
      specialty: match.request!.specialty,
      city: match.request!.city,
      technician_count: techCount,
      daily_rate_sar: dailyRate,
      total_estimated_sar: totalEstimated,
      start_date: startDate,
      end_date: endDate,
    });

    setLoading(false);
    if (res) {
      toast.success(t('toastCreated'));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0E1524] border border-amber-500/30 p-6 sm:p-7 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t('draftTitle')}</h3>
              <p className="text-[11px] text-slate-400">{t('draftSubtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">التخصص:</span>
              <span className="font-bold text-amber-400">{getSpecialtyLabel(match.request.specialty, locale)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">المدينة:</span>
              <span className="font-bold text-white">{getCityLabel(match.request.city, locale)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t('dailyRateLabel')}</label>
              <input
                type="number"
                min={100}
                required
                value={dailyRate}
                onChange={(e) => setDailyRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t('daysCountLabel')}</label>
              <input
                type="number"
                min={1}
                max={365}
                required
                value={daysCount}
                onChange={(e) => setDaysCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">{t('totalValueLabel')}</span>
              <span className="text-lg font-black text-amber-400">
                {totalEstimated.toLocaleString()} {t('sarCurrency')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              ({techCount} فنيين × {daysCount} أيام)
            </span>
          </div>

          {/* Legal Clauses */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
            <h4 className="font-bold text-slate-200">{t('termsTitle')}</h4>
            <p>{t('termsClause1')}</p>
            <p>{t('termsClause2')}</p>
            <p>{t('termsClause3')}</p>
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <span>{t('acceptTermsLabel')}</span>
          </label>

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-amber-glow transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'جاري الصياغة...' : t('createAgreementBtn')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
