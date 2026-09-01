'use client';

import { useTranslations } from 'next-intl';
import { RequestType } from '@/types/database';
import { Briefcase, Users, UserCheck } from 'lucide-react';

interface QuickActionButtonsProps {
  onOpenRequest: (type: RequestType) => void;
}

export default function QuickActionButtons({ onOpenRequest }: QuickActionButtonsProps) {
  const tHero = useTranslations('hero');

  return (
    <div id="tour-ctas" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <button
        onClick={() => onOpenRequest('project')}
        className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-slate-900 border border-amber-500/40 hover:border-amber-400 shadow-glass-card hover:shadow-amber-glow transition-all duration-300 text-start cursor-pointer group"
      >
        <Briefcase className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
        <h3 className="font-bold text-white text-base">{tHero('ctaProject')}</h3>
        <p className="text-xs text-slate-400 mt-1">{tHero('ctaProjectSub')}</p>
      </button>

      <button
        onClick={() => onOpenRequest('need_manpower')}
        className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 shadow-glass-card hover:shadow-cyan-glow transition-all duration-300 text-start cursor-pointer group"
      >
        <Users className="w-6 h-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
        <h3 className="font-bold text-white text-base">{tHero('ctaManpower')}</h3>
        <p className="text-xs text-slate-400 mt-1">{tHero('ctaManpowerSub')}</p>
      </button>

      <button
        onClick={() => onOpenRequest('available_crew')}
        className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 shadow-glass-card hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.35)] transition-all duration-300 text-start cursor-pointer group"
      >
        <UserCheck className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
        <h3 className="font-bold text-white text-base">{tHero('ctaCrew')}</h3>
        <p className="text-xs text-slate-400 mt-1">{tHero('ctaCrewSub')}</p>
      </button>
    </div>
  );
}
