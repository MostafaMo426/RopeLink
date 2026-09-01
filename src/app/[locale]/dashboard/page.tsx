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
import VerificationBanner from '@/components/verification/VerificationBanner';
import VerificationModal from '@/components/verification/VerificationModal';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRequests } from '@/hooks/useRequests';
import { useRealtimeMarketplace } from '@/hooks/useRealtimeMarketplace';
import { RequestType } from '@/types/database';
import { Briefcase, Users, UserCheck, Globe, ListFilter } from 'lucide-react';

export default function DashboardPage() {
  const tHero = useTranslations('hero');
  const tDash = useTranslations('dashboard');
  const router = useRouter();

  const { user, profile, signOut, refreshProfile } = useSupabaseAuth();
  const { requests: myRequests, loading: reqLoading, refreshRequests, updateRequestStatus } = useRequests(
    user?.id,
    profile?.role
  );
  const { requests: marketRequests, loading: marketLoading, sendMatchProposal } = useRealtimeMarketplace(
    user?.id
  );

  const [activeTab, setActiveTab] = useState<'marketplace' | 'my_requests'>('marketplace');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType>('project');
  const [restartCounter, setRestartCounter] = useState(0);

  const isAdmin = profile?.role === 'admin';
  const showVerificationBanner = !isAdmin && profile?.verification_status === 'unverified';

  const openRequest = (type: RequestType) => {
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
          <VerificationBanner onOpenVerification={() => setVerificationModalOpen(true)} />
        )}

        {isAdmin ? (
          <AdminOperationsView
            requests={myRequests}
            loading={reqLoading}
            onUpdateStatus={updateRequestStatus}
          />
        ) : (
          <div className="space-y-8">
            {/* Quick Action CTAs */}
            <div id="tour-ctas" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => openRequest('project')}
                className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-slate-900 border border-amber-500/40 hover:border-amber-400 shadow-glass-card hover:shadow-amber-glow transition-all duration-300 text-start cursor-pointer group"
              >
                <Briefcase className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-white text-base">{tHero('ctaProject')}</h3>
                <p className="text-xs text-slate-400 mt-1">{tHero('ctaProjectSub')}</p>
              </button>

              <button
                onClick={() => openRequest('need_manpower')}
                className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 shadow-glass-card hover:shadow-cyan-glow transition-all duration-300 text-start cursor-pointer group"
              >
                <Users className="w-6 h-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-white text-base">{tHero('ctaManpower')}</h3>
                <p className="text-xs text-slate-400 mt-1">{tHero('ctaManpowerSub')}</p>
              </button>

              <button
                onClick={() => openRequest('available_crew')}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 shadow-glass-card hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.35)] transition-all duration-300 text-start cursor-pointer group"
              >
                <UserCheck className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-white text-base">{tHero('ctaCrew')}</h3>
                <p className="text-xs text-slate-400 mt-1">{tHero('ctaCrewSub')}</p>
              </button>
            </div>

            {/* Dashboard Tabs: Marketplace Feed vs My Requests */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
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
            </div>

            {activeTab === 'marketplace' ? (
              <MarketplaceFeed
                requests={marketRequests}
                loading={marketLoading}
                currentUserProfile={profile}
                userRequests={myRequests}
                onSendProposal={sendMatchProposal}
              />
            ) : (
              <RequestsList requests={myRequests} loading={reqLoading} />
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
