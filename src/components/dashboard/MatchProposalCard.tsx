'use client';

import { useLocale, useTranslations } from 'next-intl';
import { MatchProposal, MatchStatus } from '@/types/database';
import { Handshake, Check, X, MessageSquare, MapPin } from 'lucide-react';
import { getCityLabel, getSpecialtyLabel } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import TrustBadge from '@/components/verification/TrustBadge';

interface MatchProposalCardProps {
  proposal: MatchProposal;
  isIncoming: boolean;
  isUpdating: boolean;
  onAction: (id: string, status: MatchStatus) => void;
}

export default function MatchProposalCard({
  proposal: m,
  isIncoming,
  isUpdating,
  onAction,
}: MatchProposalCardProps) {
  const t = useTranslations('marketplace');
  const tDash = useTranslations('dashboard');
  const locale = useLocale();

  const isPending = m.status === 'pending';
  const otherCompany = isIncoming
    ? m.proposer?.company_name || tDash('defaultCompany')
    : m.recipient?.company_name || tDash('defaultCompany');
  const otherStatus = isIncoming
    ? m.proposer?.verification_status
    : m.recipient?.verification_status;

  return (
    <div className="glass-panel p-5 rounded-2xl border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Handshake className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">{otherCompany}</span>
            <TrustBadge status={otherStatus || 'unverified'} variant="icon" />
          </div>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              m.status === 'accepted'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : m.status === 'declined'
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {m.status === 'accepted'
              ? t('statusAccepted')
              : m.status === 'declined'
              ? t('statusDeclined')
              : t('statusPending')}
          </span>
        </div>

        {m.request && (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs text-slate-300">
            <p className="font-semibold text-amber-400">
              {getSpecialtyLabel(m.request.specialty, locale)}
            </p>
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {getCityLabel(m.request.city, locale)}
              </span>
              <span>{formatDate(m.request.start_date, locale)}</span>
            </div>
          </div>
        )}

        {m.message && (
          <div className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
            <p className="leading-relaxed">{m.message}</p>
          </div>
        )}
      </div>

      {isIncoming && isPending && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            disabled={isUpdating}
            onClick={() => onAction(m.id, 'accepted')}
            className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('acceptMatchBtn')}</span>
          </button>
          <button
            disabled={isUpdating}
            onClick={() => onAction(m.id, 'declined')}
            className="py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t('declineMatchBtn')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
