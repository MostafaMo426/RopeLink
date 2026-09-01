'use client';

import { useState } from 'react';
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
import AgreementsFeed from '@/components/agreements/AgreementsFeed';
import AgreementModal from '@/components/agreements/AgreementModal';
import ChatModal from '@/components/chat/ChatModal';
import QuickActionButtons from '@/components/dashboard/QuickActionButtons';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import VerificationBanner from '@/components/verification/VerificationBanner';
import VerificationModal from '@/components/verification/VerificationModal';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRequests } from '@/hooks/useRequests';
import { useRealtimeMarketplace } from '@/hooks/useRealtimeMarketplace';
import { useAgreements } from '@/hooks/useAgreements';
import { RequestType, MatchProposal } from '@/types/database';

export default function DashboardPage() {
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
    refreshMarketplace,
    sendMatchProposal,
    updateMatchStatus,
  } = useRealtimeMarketplace(user?.id);
  const {
    agreements,
    loading: agrLoading,
    refreshAgreements,
    createAgreement,
    signAgreement,
    advanceMilestone,
  } = useAgreements(user?.id);

  const [activeTab, setActiveTab] = useState<'marketplace' | 'my_requests' | 'proposals' | 'agreements'>('marketplace');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [activeChatMatch, setActiveChatMatch] = useState<MatchProposal | null>(null);
  const [activeDraftMatch, setActiveDraftMatch] = useState<MatchProposal | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType>('project');
  const [restartCounter, setRestartCounter] = useState(0);

  const isAdmin = profile?.role === 'admin';
  const showVerificationBanner = !isAdmin && profile?.verification_status !== 'verified';
  const incomingPendingCount = matches.filter(
    (m) => m.recipient_id === user?.id && m.status === 'pending'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E]">
      {user && profile && <GuidedTour user={user} profile={profile} restartCounter={restartCounter} />}
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        <DashboardHeader
          user={user}
          profile={profile}
          onRestartTour={() => setRestartCounter((c) => c + 1)}
          onSignOut={async () => { await signOut(); router.push('/'); }}
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
            onRefresh={refreshRequests}
          />
        ) : (
          <div className="space-y-8">
            <QuickActionButtons onOpenRequest={(t) => { setSelectedType(t); setRequestModalOpen(true); }} />

            <DashboardTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              myRequestsCount={myRequests.length}
              agreementsCount={agreements.length}
              incomingPendingCount={incomingPendingCount}
            />

            {activeTab === 'marketplace' ? (
              <MarketplaceFeed
                requests={marketRequests}
                loading={marketLoading}
                currentUserProfile={profile}
                userRequests={myRequests}
                onSendProposal={sendMatchProposal}
                onRefresh={refreshMarketplace}
              />
            ) : activeTab === 'my_requests' ? (
              <RequestsList requests={myRequests} loading={reqLoading} onRefresh={refreshRequests} />
            ) : activeTab === 'proposals' ? (
              <MatchProposalsList
                matches={matches}
                currentUserId={user?.id}
                onUpdateStatus={updateMatchStatus}
                onRefresh={refreshMarketplace}
                onOpenChat={(m) => setActiveChatMatch(m)}
                onOpenDraftAgreement={(m) => setActiveDraftMatch(m)}
              />
            ) : (
              <AgreementsFeed
                agreements={agreements}
                loading={agrLoading}
                currentUserId={user?.id}
                onSignAgreement={signAgreement}
                onAdvanceMilestone={advanceMilestone}
                onRefresh={refreshAgreements}
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

      <ChatModal
        isOpen={Boolean(activeChatMatch)}
        onClose={() => setActiveChatMatch(null)}
        match={activeChatMatch}
        currentUserId={user?.id}
        onOpenDraftAgreement={(m) => setActiveDraftMatch(m)}
      />

      <AgreementModal
        isOpen={Boolean(activeDraftMatch)}
        onClose={() => setActiveDraftMatch(null)}
        match={activeDraftMatch}
        currentUserId={user?.id}
        onCreate={createAgreement}
      />
    </div>
  );
}
