'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Briefcase, Users, UserCheck, Shield, Clock, Sparkles } from 'lucide-react';
import { RequestType } from '@/types/database';

interface HeroSectionProps {
  onSelectCTA: (type: RequestType) => void;
}

export default function HeroSection({ onSelectCTA }: HeroSectionProps) {
  const t = useTranslations('hero');

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden safety-grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl space-y-6">
          {/* Saudi Vision 2030 Ready Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('badge')}</span>
          </motion.div>

          {/* Main Hero Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]"
          >
            {t('title')}
          </motion.h1>

          {/* Value Proposition Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl"
          >
            {t('subtitle')}
          </motion.p>

          {/* 3 Prominent Action CTA Buttons with micro-interactions */}
          <motion.div
            id="tour-ctas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4"
          >
            {/* CTA 1: I Have a Project */}
            <button
              onClick={() => onSelectCTA('project')}
              className="group relative flex flex-col items-start p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-slate-900 border border-amber-500/40 hover:border-amber-400 shadow-glass-card hover:shadow-amber-glow transition-all duration-300 cursor-pointer overflow-hidden text-start"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 mb-3 group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                {t('ctaProject')}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                تسجيل متطلبات ومشاريع
              </span>
            </button>

            {/* CTA 2: I Need Manpower */}
            <button
              onClick={() => onSelectCTA('need_manpower')}
              className="group relative flex flex-col items-start p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 shadow-glass-card hover:shadow-cyan-glow transition-all duration-300 cursor-pointer overflow-hidden text-start"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                {t('ctaManpower')}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                استقطاب فوري للكوادر
              </span>
            </button>

            {/* CTA 3: I Have Available Crew */}
            <button
              onClick={() => onSelectCTA('available_crew')}
              className="group relative flex flex-col items-start p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 shadow-glass-card hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.35)] transition-all duration-300 cursor-pointer overflow-hidden text-start"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 mb-3 group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                {t('ctaCrew')}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                تسكين الفنيين الفائضين
              </span>
            </button>
          </motion.div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs sm:text-sm text-slate-400 border-t border-slate-800/80">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              {t('activeTechs')}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              {t('mobilizationTime')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
