'use client';

import { useLocale, useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import { Building2, LogOut, Compass, MapPin, Mail } from 'lucide-react';
import { getCityLabel } from '@/lib/constants';
import TrustBadge from '@/components/verification/TrustBadge';

interface DashboardHeaderProps {
  user: User | null;
  profile: Profile | null;
  onRestartTour: () => void;
  onSignOut: () => void;
}

export default function DashboardHeader({
  user,
  profile,
  onRestartTour,
  onSignOut,
}: DashboardHeaderProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const isAdmin = profile?.role === 'admin';
  const roleLabel = isAdmin ? 'ADMIN' : profile?.role ? profile.role.toUpperCase() : 'USER';
  const companyName = profile?.company_name || user?.user_metadata?.company_name || t('defaultCompany');
  const city = profile?.city || 'Riyadh';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {roleLabel}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {companyName}
            </h1>
            {!isAdmin && (
              <TrustBadge status={profile?.verification_status || 'unverified'} variant="icon" />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {getCityLabel(city, locale)}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              {user?.email || 'authenticated'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        <button
          onClick={onRestartTour}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('restartTour')}</span>
        </button>

        <button
          onClick={onSignOut}
          className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold text-red-400 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
