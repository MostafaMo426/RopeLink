'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GuidedTour from '@/components/dashboard/GuidedTour';
import RequestModal from '@/components/requests/RequestModal';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RequestsList from '@/components/dashboard/RequestsList';
import AdminOperationsView from '@/components/dashboard/AdminOperationsView';
import MarketplaceFeed from '@/components/marketplace/MarketplaceFeed';
import MatchProposalsList from '@/components/dashboard/MatchProposalsList';
import QuickActionButtons from '@/components/dashboard/QuickActionButtons';
import VerificationBanner from '@/components/verification/VerificationBanner';
import VerificationModal from '@/components/verification/VerificationModal';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRequests } from '@/hooks/useRequests';
import { useRealtimeMarketplace } from '@/hooks/useRealtimeMarketplace';
import { RequestType } from '@/types/database';
import { Globe, ListFilter, Handshake } from 'lucide-react';

export default function DashboardPage() {
  const tDash = useTranslations('dashboard');
  const router = useRouter();

  const { user, profile, signOut, refreshProfile } = useSupabaseAuth();
  const { requests: myRequests, loading: reqLoading, refreshRequests, updateRequestStatus } = useRequests(
    user?.id,
    profile?.role
  );
  const {
    requests: marketRequests,
    matches,
    loading: marketLoading,
    sendMatchProposal,
    updateMatchStatus,
  } = useRealtimeMarketplace(user?.id);

  const [activeTab, setActiveTab] = useState<'marketplace' | 'my_requests' | 'proposals'>('marketplace');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType>('project');
  const [restartCounter, setRestartCounter] = useState(0);

  const isAdmin = profile?.role === 'admin';
  const showVerificationBanner = !isAdmin && profile?.verification_status !== 'verified';
  const incomingPendingCount = matches.filter(
    (m) => m.recipient_id === user?.id && m.status === 'pending'
  ).length;

  const handleOpenRequest = (type: RequestType) => {
    setSelectedType(type);
    setRequestModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E]">
      {user && profile && (
        <GuidedTour user={user} profile={profile} restartCounter={restartCounter} />
      )}

      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        <DashboardHeader
          user={user}
          profile={profile}
          onRestartTour={() => setRestartCounter((c) => c + 1)}
          onSignOut={handleSignOut}
        />

        {showVerificationBanner && (
          <VerificationBanner
            status={profile?.verification_status}
            onOpenVerification={() => setVerificationModalOpen(true)}
          />
        )}

        {isAdmin ? (
          <AdminOperationsView
            requests={myRequests}
            loading={reqLoading}
            onUpdateStatus={updateRequestStatus}
          />
        ) : (
          <div className="space-y-8">
            <QuickActionButtons onOpenRequest={handleOpenRequest} />

            {/* Dashboard Tabs */}
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
                <span>{tDash('tabMarketplace')}</span>
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
                <span>{tDash('tabMyRequests')} ({myRequests.length})</span>
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
                <span>{tDash('tabProposals')}</span>
                {incomingPendingCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                    {incomingPendingCount}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'marketplace' ? (
              <MarketplaceFeed
                requests={marketRequests}
                loading={marketLoading}
                currentUserProfile={profile}
                userRequests={myRequests}
                onSendProposal={sendMatchProposal}
              />
            ) : activeTab === 'my_requests' ? (
              <RequestsList requests={myRequests} loading={reqLoading} />
            ) : (
              <MatchProposalsList
                matches={matches}
                currentUserId={user?.id}
                onUpdateStatus={updateMatchStatus}
              />
            )}
          </div>
        )}
      </main>

      <Footer />

      <RequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        type={selectedType}
        user={user}
        profile={profile}
        onCreated={refreshRequests}
      />

      <VerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        profile={profile}
        onSubmitted={refreshProfile}
      />
    </div>
  );
}
