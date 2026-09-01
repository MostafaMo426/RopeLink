'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GuidedTour from '@/components/dashboard/GuidedTour';
import RequestModal from '@/components/requests/RequestModal';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRequests } from '@/hooks/useRequests';
import { RequestType } from '@/types/database';
import {
  Briefcase,
  Users,
  UserCheck,
  Building2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useLocale } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('nav');
  const tHero = useTranslations('hero');
  const locale = useLocale();
  const { user, profile, signOut } = useSupabaseAuth();
  const { requests, loading, refreshRequests } = useRequests(user?.id);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType>('project');
  const [tourKey, setTourKey] = useState(0);

  const openRequest = (type: RequestType) => {
    setSelectedType(type);
    setRequestModalOpen(true);
  };

  const hasSeen = profile?.has_seen_tutorial ?? false;

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E]">
      {/* Interactive Guided Tour on First Login */}
      <GuidedTour
        key={tourKey}
        user={user}
        hasSeenTutorial={hasSeen}
        onTourComplete={() => {}}
      />

      <Navbar user={user || { name: 'Demo Contractor' }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Header with Enterprise Info & Tour trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {profile?.company_name || 'شركة المقاولات النموذجية'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              لوحة التحكم والإسناد الفني الميداني | {profile?.city || 'الجبيل'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTourKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>إعادة الجولة التعريفية</span>
            </button>
            <button
              onClick={signOut}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              {t('logout')}
            </button>
          </div>
        </div>

        {/* 3 Quick Action CTAs */}
        <div id="tour-ctas" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => openRequest('project')}
            className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-slate-900 border border-amber-500/40 hover:border-amber-400 shadow-glass-card hover:shadow-amber-glow transition-all duration-300 text-start cursor-pointer group"
          >
            <Briefcase className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">{tHero('ctaProject')}</h3>
            <p className="text-xs text-slate-400 mt-1">تسجيل نطاق عمل لمشروع جديد</p>
          </button>

          <button
            onClick={() => openRequest('need_manpower')}
            className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 shadow-glass-card hover:shadow-cyan-glow transition-all duration-300 text-start cursor-pointer group"
          >
            <Users className="w-6 h-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">{tHero('ctaManpower')}</h3>
            <p className="text-xs text-slate-400 mt-1">طلب فنيين معتمدين وتسكين سريع</p>
          </button>

          <button
            onClick={() => openRequest('available_crew')}
            className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 shadow-glass-card hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.35)] transition-all duration-300 text-start cursor-pointer group"
          >
            <UserCheck className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">{tHero('ctaCrew')}</h3>
            <p className="text-xs text-slate-400 mt-1">عرض كادر متاح وتفادي التعطيل</p>
          </button>
        </div>

        {/* Requests Activity List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">الطلبات والإسنادات النشطة</h2>
            <span className="text-xs text-slate-400">إجمالي: {requests.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="glass-panel p-5 rounded-2xl border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {req.specialty}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {req.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm sm:text-base">
                    {req.company_name}
                  </h4>

                  {req.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {req.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {req.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    {req.technician_count} فنيين
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    {formatDate(req.start_date, locale)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* Request Modal / Bottom-Sheet */}
      <RequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        type={selectedType}
        user={user}
        onCreated={refreshRequests}
      />
    </div>
  );
}
