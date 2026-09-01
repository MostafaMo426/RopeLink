'use client';

import { useTranslations } from 'next-intl';
import { ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLocale } from 'next-intl';

interface VerificationBannerProps {
  onOpenVerification: () => void;
}

export default function VerificationBanner({ onOpenVerification }: VerificationBannerProps) {
  const t = useTranslations('verification');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-glass-card">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm sm:text-base">
            {t('bannerTitle')}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('bannerDesc')}
          </p>
        </div>
      </div>

      <button
        onClick={onOpenVerification}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-amber-glow transition-all duration-200 shrink-0 cursor-pointer"
      >
        <span>{t('verifyNowBtn')}</span>
        {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
