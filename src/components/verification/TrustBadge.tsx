'use client';

import { useTranslations } from 'next-intl';
import { VerificationStatus } from '@/types/database';
import { ShieldCheck, Clock, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';

interface TrustBadgeProps {
  status?: VerificationStatus;
  size?: 'sm' | 'md';
  variant?: 'badge' | 'icon';
}

export default function TrustBadge({
  status = 'unverified',
  size = 'sm',
  variant = 'badge',
}: TrustBadgeProps) {
  const t = useTranslations('verification');

  if (variant === 'icon') {
    if (status === 'verified') {
      return (
        <span
          title={t('badgeVerified')}
          className="inline-flex items-center justify-center p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </span>
      );
    }
    if (status === 'pending_review') {
      return (
        <span
          title={t('badgePending')}
          className="inline-flex items-center justify-center p-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0"
        >
          <Clock className="w-3.5 h-3.5" />
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span
          title={t('badgeRejected')}
          className="inline-flex items-center justify-center p-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 shrink-0"
        >
          <XCircle className="w-3.5 h-3.5" />
        </span>
      );
    }
    return (
      <span
        title={t('badgeUnverified')}
        className="inline-flex items-center justify-center p-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 shrink-0"
      >
        <AlertCircle className="w-3.5 h-3.5" />
      </span>
    );
  }

  if (status === 'verified') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        }`}
      >
        <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{t('badgeVerified')}</span>
      </span>
    );
  }

  if (status === 'pending_review') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/30 ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        }`}
      >
        <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{t('badgePending')}</span>
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-full border bg-red-500/15 text-red-400 border-red-500/30 ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        }`}
      >
        <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{t('badgeRejected')}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full border bg-slate-800 text-slate-400 border-slate-700 ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <AlertCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{t('badgeUnverified')}</span>
    </span>
  );
}
