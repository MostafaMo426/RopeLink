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
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRequests } from '@/hooks/useRequests';
import { RequestType } from '@/types/database';
import { Briefcase, Users, UserCheck } from 'lucide-react';

export default function DashboardPage() {
  const tHero = useTranslations('hero');
  const router = useRouter();
  const { user, profile, signOut } = useSupabaseAuth();
  const { requests, loading: reqLoading, refreshRequests, updateRequestStatus } = useRequests(
    user?.id,
    profile?.role
  );

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType>('project');
  const [tourKey, setTourKey] = useState(0);
  const [forceTour, setForceTour] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const openRequest = (type: RequestType) => {
    setSelectedType(type);
    setRequestModalOpen(true);
  };

  const handleRestartTour = () => {
    setForceTour(true);
    setTourKey((k) => k + 1);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E]">
      {user && profile && (
        <GuidedTour
          key={tourKey}
          user={user}
          profile={profile}
          forceStart={forceTour}
          onTourComplete={() => setForceTour(false)}
        />
      )}

      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        <DashboardHeader
          user={user}
          profile={profile}
          onRestartTour={handleRestartTour}
          onSignOut={handleSignOut}
        />

        {isAdmin ? (
          <AdminOperationsView
            requests={requests}
            loading={reqLoading}
            onUpdateStatus={updateRequestStatus}
          />
        ) : (
          <>
            {/* 3 Quick Action CTAs for Contractors & Suppliers */}
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

            <RequestsList requests={requests} loading={reqLoading} />
          </>
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
    </div>
  );
}
