'use client';

import { useTranslations } from 'next-intl';
import { Globe, ListFilter, Handshake, FileCheck } from 'lucide-react';

interface DashboardTabsProps {
  activeTab: 'marketplace' | 'my_requests' | 'proposals' | 'agreements';
  setActiveTab: (tab: 'marketplace' | 'my_requests' | 'proposals' | 'agreements') => void;
  myRequestsCount: number;
  agreementsCount: number;
  incomingPendingCount: number;
}

export default function DashboardTabs({
  activeTab,
  setActiveTab,
  myRequestsCount,
  agreementsCount,
  incomingPendingCount,
}: DashboardTabsProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-2">
      <button
        onClick={() => setActiveTab('marketplace')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
          activeTab === 'marketplace'
            ? 'bg-amber-500 text-slate-950 shadow-amber-glow'
            : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
        }`}
      >
        <Globe className="w-4 h-4" />
        <span>{t('tabMarketplace')}</span>
      </button>

      <button
        onClick={() => setActiveTab('my_requests')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
          activeTab === 'my_requests'
            ? 'bg-amber-500 text-slate-950 shadow-amber-glow'
            : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
        }`}
      >
        <ListFilter className="w-4 h-4" />
        <span>{t('tabMyRequests')} ({myRequestsCount})</span>
      </button>

      <button
        onClick={() => setActiveTab('proposals')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
          activeTab === 'proposals'
            ? 'bg-amber-500 text-slate-950 shadow-amber-glow'
            : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
        }`}
      >
        <Handshake className="w-4 h-4" />
        <span>{t('tabProposals')}</span>
        {incomingPendingCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
            {incomingPendingCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setActiveTab('agreements')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
          activeTab === 'agreements'
            ? 'bg-amber-500 text-slate-950 shadow-amber-glow'
            : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
        }`}
      >
        <FileCheck className="w-4 h-4" />
        <span>{t('tabAgreements')} ({agreementsCount})</span>
      </button>
    </div>
  );
}
