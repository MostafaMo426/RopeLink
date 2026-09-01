'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Agreement, MilestoneStage } from '@/types/database';
import { FileText, RefreshCw } from 'lucide-react';
import AgreementCard from './AgreementCard';
import AgreementSignatureModal from './AgreementSignatureModal';
import CrewRosterModal from '@/components/mobilization/CrewRosterModal';

interface AgreementsFeedProps {
  agreements: Agreement[];
  loading?: boolean;
  currentUserId?: string;
  onSignAgreement: (agreementId: string, isProposer: boolean) => Promise<boolean>;
  onAdvanceMilestone: (agreementId: string, nextMilestone: MilestoneStage) => Promise<boolean>;
  onRefresh?: () => Promise<void> | void;
}

export default function AgreementsFeed({
  agreements,
  loading,
  currentUserId,
  onSignAgreement,
  onAdvanceMilestone,
  onRefresh,
}: AgreementsFeedProps) {
  const t = useTranslations('agreements');
  const [selectedSignAgr, setSelectedSignAgr] = useState<{ agreement: Agreement; isProposer: boolean } | null>(null);
  const [selectedRosterAgrId, setSelectedRosterAgrId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 400);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>{t('title')}</span>
          </h2>
          <p className="text-xs text-slate-400">{t('subtitle')}</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          <span>{t('refreshAgreementsBtn')}</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-10 text-center text-slate-400 rounded-2xl border-slate-800">
          <p className="text-sm">{t('loadingAgreements')}</p>
        </div>
      ) : agreements.length === 0 ? (
        <div className="glass-panel p-10 text-center text-slate-400 rounded-2xl border-slate-800 space-y-1">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">{t('emptyAgreementsTitle')}</p>
          <p className="text-xs text-slate-500">{t('emptyAgreementsSubtitle')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agreements.map((a) => (
            <AgreementCard
              key={a.id}
              agreement={a}
              currentUserId={currentUserId}
              onOpenSignModal={(agr, isProp) => setSelectedSignAgr({ agreement: agr, isProposer: isProp })}
              onOpenRosterModal={(id) => setSelectedRosterAgrId(id)}
              onAdvanceMilestone={onAdvanceMilestone}
            />
          ))}
        </div>
      )}

      {/* Signature Modal */}
      <AgreementSignatureModal
        isOpen={Boolean(selectedSignAgr)}
        onClose={() => setSelectedSignAgr(null)}
        agreementId={selectedSignAgr?.agreement.id || ''}
        companyName={selectedSignAgr?.isProposer ? selectedSignAgr.agreement.proposer?.company_name || '' : selectedSignAgr?.agreement.recipient?.company_name || ''}
        isProposer={selectedSignAgr?.isProposer || false}
        onSign={onSignAgreement}
      />

      {/* Crew Roster Modal with Ajeer Permit */}
      <CrewRosterModal
        isOpen={Boolean(selectedRosterAgrId)}
        onClose={() => setSelectedRosterAgrId(null)}
        agreementId={selectedRosterAgrId || ''}
      />
    </div>
  );
}
