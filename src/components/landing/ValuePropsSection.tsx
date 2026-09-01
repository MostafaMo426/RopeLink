'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Gauge, Zap, Award } from 'lucide-react';

export default function ValuePropsSection() {
  const t = useTranslations('valueProps');

  const cards = [
    {
      icon: Gauge,
      titleKey: 'card1Title',
      descKey: 'card1Desc',
      accent: 'amber',
      borderClass: 'hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-400',
    },
    {
      icon: Zap,
      titleKey: 'card2Title',
      descKey: 'card2Desc',
      accent: 'cyan',
      borderClass: 'hover:border-cyan-500/50',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
    },
    {
      icon: Award,
      titleKey: 'card3Title',
      descKey: 'card3Desc',
      accent: 'emerald',
      borderClass: 'hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
    },
  ];

  return (
    <section id="value-props" className="py-20 bg-[#0A0E18] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            {t('sectionTitle')}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            {t('sectionSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className={`glass-panel rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 ${card.borderClass}`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${card.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    {t(card.titleKey as any)}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {t(card.descKey as any)}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>{t('verifiedBadge')}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
