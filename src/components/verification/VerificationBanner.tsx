'use client';

import { useTranslations, useLocale } from 'next-intl';
import { ShieldAlert, AlertTriangle, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { VerificationStatus } from '@/types/database';

interface VerificationBannerProps {
  status?: VerificationStatus;
  onOpenVerification: () => void;
}

export default function VerificationBanner({
  status = 'unverified',
  onOpenVerification,
}: VerificationBannerProps) {
  const t = useTranslations('verification');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const isRejected = status === 'rejected';
  const isPending = status === 'pending_review';

  const bgGradient = isRejected
    ? 'from-red-500/15 via-slate-900 to-slate-900 border-red-500/30'
    : isPending
    ? 'from-cyan-500/15 via-slate-900 to-slate-900 border-cyan-500/30'
    : 'from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/30';

  const iconContainer = isRejected
    ? 'bg-red-500/20 text-red-400'
    : isPending
    ? 'bg-cyan-500/20 text-cyan-400'
    : 'bg-amber-500/20 text-amber-400';

  const btnGradient = isRejected
    ? 'from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]'
    : isPending
    ? 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-glow'
    : 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-glow';

  return (
    <div className={`rounded-2xl p-4 sm:p-5 bg-gradient-to-r ${bgGradient} border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-glass-card`}>
      <div className="flex items-start sm:items-center gap-3.5">
        <div className={`p-2.5 rounded-xl ${iconContainer} shrink-0`}>
          {isRejected ? (
            <AlertTriangle className="w-5 h-5" />
          ) : isPending ? (
            <Clock className="w-5 h-5" />
          ) : (
            <ShieldAlert className="w-5 h-5" />
          )}
        </div>
        <div>
          <h4 className="font-bold text-white text-sm sm:text-base">
            {isRejected
              ? t('bannerRejectedTitle')
              : isPending
              ? t('bannerPendingTitle')
              : t('bannerTitle')}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRejected
              ? t('bannerRejectedDesc')
              : isPending
              ? t('bannerPendingDesc')
              : t('bannerDesc')}
          </p>
        </div>
      </div>

      <button
        onClick={onOpenVerification}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 shrink-0 cursor-pointer ${btnGradient}`}
      >
        <span>
          {isRejected
            ? t('reverifyBtn')
            : isPending
            ? t('editVerificationBtn')
            : t('verifyNowBtn')}
        </span>
        {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
