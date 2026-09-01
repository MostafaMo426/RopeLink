'use client';

import { useTranslations } from 'next-intl';
import { Anchor, ShieldCheck, HardHat, PhoneCall } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const tBrand = useTranslations('brand');

  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#06080D] py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black">
                <Anchor className="w-4 h-4 text-slate-950" />
              </div>
              <span className="font-extrabold text-lg text-white">
                {tBrand('enName')}
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {tBrand('tagline')}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> IRATA & SPRAT
              </span>
              <span className="flex items-center gap-1">
                <HardHat className="w-4 h-4 text-amber-400" /> Aramco & SABIC HSE
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              المناطق الصناعية
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>الجبيل الصناعية الأولى والثانية</li>
              <li>ينبع الصناعية ومدينة رأس الخير</li>
              <li>منطقة نيوم ومشاريع البحر الأحمر</li>
              <li>الرياض، جدة والدمام</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              الدعم والتنسيق الميداني
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-amber-400" /> +966 11 000 0000
              </li>
              <li>ops@ropelink.sa</li>
              <li>المملكة العربية السعودية</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{t('rights')}</p>
          <p>{t('madeInKSA')}</p>
        </div>
      </div>
    </footer>
  );
}
