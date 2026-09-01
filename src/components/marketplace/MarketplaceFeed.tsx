'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ManpowerRequest, Profile } from '@/types/database';
import MarketplaceFilters from './MarketplaceFilters';
import MarketplaceCard from './MarketplaceCard';
import MatchProposalModal from './MatchProposalModal';
import { Globe, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface MarketplaceFeedProps {
  requests: ManpowerRequest[];
  loading?: boolean;
  currentUserProfile?: Profile | null;
  userRequests?: ManpowerRequest[];
  onSendProposal: (requestId: string, recipientId: string, message: string) => Promise<boolean>;
  onRefresh?: () => Promise<void> | void;
}

export default function MarketplaceFeed({
  requests,
  loading,
  currentUserProfile,
  userRequests = [],
  onSendProposal,
  onRefresh,
}: MarketplaceFeedProps) {
  const t = useTranslations('marketplace');
  const [typeFilter, setTypeFilter] = useState<'all' | 'projects' | 'crews'>('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedProposalReq, setSelectedProposalReq] = useState<ManpowerRequest | null>(null);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => {
      setRefreshing(false);
      toast.success(t('refreshedToast'));
    }, 400);
  };

  // Filter requests
  const filtered = requests.filter((req) => {
    if (typeFilter === 'projects' && req.type === 'available_crew') return false;
    if (typeFilter === 'crews' && req.type !== 'available_crew') return false;
    if (cityFilter !== 'all' && req.city !== cityFilter) return false;
    if (specialtyFilter !== 'all' && req.specialty !== specialtyFilter) return false;
    if (verifiedOnly && req.profiles?.verification_status !== 'verified') return false;
    return true;
  });

  return (
    <div id="tour-marketplace" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {t('marketplaceSectionTitle')}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{t('refreshBtn')}</span>
          </button>
          <span className="text-xs text-slate-400">
            {t('activeOpportunities')}: {filtered.length}
          </span>
        </div>
      </div>

      <MarketplaceFilters
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        specialtyFilter={specialtyFilter}
        setSpecialtyFilter={setSpecialtyFilter}
        verifiedOnly={verifiedOnly}
        setVerifiedOnly={setVerifiedOnly}
      />

      {loading ? (
        <div className="glass-panel p-10 text-center text-slate-400 rounded-2xl border-slate-800">
          <p className="text-sm">{t('loadingMarketplace')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-10 text-center text-slate-400 rounded-2xl border-slate-800 space-y-1">
          <p className="text-sm font-semibold text-white">{t('emptyMarketplaceTitle')}</p>
          <p className="text-xs text-slate-500">{t('emptyMarketplaceSubtitle')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((req) => (
            <MarketplaceCard
              key={req.id}
              request={req}
              currentUserProfile={currentUserProfile}
              userRequests={userRequests}
              onOpenProposal={(target) => setSelectedProposalReq(target)}
            />
          ))}
        </div>
      )}

      <MatchProposalModal
        isOpen={Boolean(selectedProposalReq)}
        onClose={() => setSelectedProposalReq(null)}
        targetRequest={selectedProposalReq}
        onSendProposal={onSendProposal}
      />
    </div>
  );
}
