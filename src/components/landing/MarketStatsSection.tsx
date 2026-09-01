'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { HardHat, ShieldCheck, Clock, Building2 } from 'lucide-react';

export default function MarketStatsSection() {
  const t = useTranslations('marketStats');

  const stats = [
    {
      value: t('stat1Value'),
      label: t('stat1Label'),
      icon: HardHat,
      color: 'text-amber-400',
    },
    {
      value: t('stat2Value'),
      label: t('stat2Label'),
      icon: ShieldCheck,
      color: 'text-emerald-400',
    },
    {
      value: t('stat3Value'),
      label: t('stat3Label'),
      icon: Clock,
      color: 'text-cyan-400',
    },
    {
      value: t('stat4Value'),
      label: t('stat4Label'),
      icon: Building2,
      color: 'text-orange-400',
    },
  ];

  return (
    <section id="tour-stats" className="py-16 bg-[#07090E] border-y border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="glass-panel p-6 rounded-xl flex flex-col items-center text-center space-y-2 border-slate-800"
              >
                <Icon className={`w-6 h-6 ${stat.color} mb-1`} />
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  {stat.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
