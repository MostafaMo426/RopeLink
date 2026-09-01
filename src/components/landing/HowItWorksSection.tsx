'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { FileEdit, CheckCircle2, Truck } from 'lucide-react';

export default function HowItWorksSection() {
  const t = useTranslations('howItWorks');

  const steps = [
    {
      icon: FileEdit,
      title: t('step1Title'),
      desc: t('step1Desc'),
      stepNum: '01',
    },
    {
      icon: CheckCircle2,
      title: t('step2Title'),
      desc: t('step2Desc'),
      stepNum: '02',
    },
    {
      icon: Truck,
      title: t('step3Title'),
      desc: t('step3Desc'),
      stepNum: '03',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#090D15] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            {t('title')}
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                className="relative bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-start hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center justify-between w-full mb-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-3xl font-black text-slate-700">
                    {step.stepNum}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
