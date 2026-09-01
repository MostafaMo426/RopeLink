'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MatchProposal, MatchStatus } from '@/types/database';
import { Handshake, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import MatchProposalCard from './MatchProposalCard';

interface MatchProposalsListProps {
  matches: MatchProposal[];
  currentUserId?: string;
  onUpdateStatus: (matchId: string, status: MatchStatus) => Promise<boolean>;
  onRefresh?: () => Promise<void> | void;
  onOpenChat?: (proposal: MatchProposal) => void;
  onOpenDraftAgreement?: (proposal: MatchProposal) => void;
}

export default function MatchProposalsList({
  matches,
  currentUserId,
  onUpdateStatus,
  onRefresh,
  onOpenChat,
  onOpenDraftAgreement,
}: MatchProposalsListProps) {
  const t = useTranslations('marketplace');
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const incoming = matches.filter((m) => m.recipient_id === currentUserId);
  const outgoing = matches.filter((m) => m.proposer_id === currentUserId);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => {
      setRefreshing(false);
      toast.success(t('proposalsRefreshedToast'));
    }, 400);
  };

  const handleAction = async (matchId: string, status: MatchStatus) => {
    setUpdatingId(matchId);
    const success = await onUpdateStatus(matchId, status);
    setUpdatingId(null);
    if (success) {
      toast.success(status === 'accepted' ? t('acceptSuccessToast') : t('declineSuccessToast'));
    } else {
      toast.error(t('actionErrorToast'));
    }
  };

  const currentList = activeTab === 'incoming' ? incoming : outgoing;

  return (
    <div className="space-y-5">
      {/* Sub-tabs: Incoming vs Outgoing & Refresh Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'incoming'
                ? 'bg-amber-500 text-slate-950 shadow-amber-glow'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{t('incomingProposals')} ({incoming.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'outgoing'
                ? 'bg-amber-500 text-slate-950 shadow-amber-glow'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t('outgoingProposals')} ({outgoing.length})</span>
          </button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          <span>{t('refreshBtn')}</span>
        </button>
      </div>

      {currentList.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-400 rounded-2xl border-slate-800 space-y-1">
          <Handshake className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">
            {activeTab === 'incoming' ? t('emptyIncomingTitle') : t('emptyOutgoingTitle')}
          </p>
          <p className="text-xs text-slate-500">
            {activeTab === 'incoming' ? t('emptyIncomingSubtitle') : t('emptyOutgoingSubtitle')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((m) => (
            <MatchProposalCard
              key={m.id}
              proposal={m}
              isIncoming={activeTab === 'incoming'}
              isUpdating={updatingId === m.id}
              onAction={handleAction}
              onOpenChat={onOpenChat}
              onOpenDraftAgreement={onOpenDraftAgreement}
            />
          ))}
        </div>
      )}
    </div>
  );
}
