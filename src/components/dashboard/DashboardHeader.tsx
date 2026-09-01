'use client';

import { useTranslations } from 'next-intl';
import { Building2, Mail, ShieldCheck, HelpCircle } from 'lucide-react';
import { Profile } from '@/types/database';
import { User } from '@supabase/supabase-js';

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
  const t = useTranslations('nav');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {profile?.company_name || user?.email?.split('@')[0] || 'منشأة معتمدة'}
          </h1>
          {profile?.role && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
              {profile.role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            {user?.email || 'جاري التحميل...'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {profile?.city || 'المملكة العربية السعودية'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRestartTour}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>إعادة الجولة التعريفية</span>
        </button>
        <button
          onClick={onSignOut}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
        >
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
