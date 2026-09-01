'use client';

import { useTranslations } from 'next-intl';
import { VerificationStatus } from '@/types/database';
import { ShieldCheck, Clock, AlertCircle, XCircle } from 'lucide-react';

interface TrustBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md';
}

export default function TrustBadge({ status, size = 'sm' }: TrustBadgeProps) {
  const t = useTranslations('verification');

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
