'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/landing/HeroSection';
import ValuePropsSection from '@/components/landing/ValuePropsSection';
import MarketStatsSection from '@/components/landing/MarketStatsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import RopeTechnicianScroll from '@/components/landing/RopeTechnicianScroll';
import AuthModal from '@/components/auth/AuthModal';
import RequestModal from '@/components/requests/RequestModal';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { RequestType } from '@/types/database';

export default function LandingPage() {
  const { user, setUser } = useSupabaseAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType>('project');
  const [pendingActionType, setPendingActionType] = useState<RequestType | null>(null);

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleSelectCTA = (type: RequestType) => {
    setSelectedRequestType(type);
    if (!user) {
      // Auth Wall: Unauthenticated users are prompted to login/signup first
      setPendingActionType(type);
      handleOpenAuth('signup');
    } else {
      setRequestModalOpen(true);
    }
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    setAuthModalOpen(false);
    if (pendingActionType) {
      setSelectedRequestType(pendingActionType);
      setRequestModalOpen(true);
      setPendingActionType(null);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#07090E] overflow-x-hidden">
      {/* Scroll-Linked Rope Technician Rappelling Animation */}
      <RopeTechnicianScroll />

      {/* Navigation */}
      <Navbar onOpenAuth={handleOpenAuth} user={user} />

      {/* Main Sections */}
      <main className="flex-1">
        <HeroSection onSelectCTA={handleSelectCTA} />
        <ValuePropsSection />
        <MarketStatsSection />
        <HowItWorksSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Wall Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
      />

      {/* Responsive Request Modal / Bottom-Sheet */}
      <RequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        type={selectedRequestType}
        user={user}
      />
    </div>
  );
}
