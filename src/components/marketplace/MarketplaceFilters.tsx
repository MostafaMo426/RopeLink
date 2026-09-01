'use client';

import { useLocale, useTranslations } from 'next-intl';
import { SAUDI_CITIES, SPECIALTIES } from '@/lib/constants';
import { MapPin, Wrench, ShieldCheck } from 'lucide-react';

interface MarketplaceFiltersProps {
  typeFilter: 'all' | 'projects' | 'crews';
  setTypeFilter: (val: 'all' | 'projects' | 'crews') => void;
  cityFilter: string;
  setCityFilter: (val: string) => void;
  specialtyFilter: string;
  setSpecialtyFilter: (val: string) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (val: boolean) => void;
}

export default function MarketplaceFilters({
  typeFilter,
  setTypeFilter,
  cityFilter,
  setCityFilter,
  specialtyFilter,
  setSpecialtyFilter,
  verifiedOnly,
  setVerifiedOnly,
}: MarketplaceFiltersProps) {
  const t = useTranslations('marketplace');
  const locale = useLocale();

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border-slate-800 space-y-4">
      {/* Type Toggle Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-amber-glow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('tabAll')}
          </button>
          <button
            onClick={() => setTypeFilter('projects')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              typeFilter === 'projects'
                ? 'bg-amber-500 text-slate-950 shadow-amber-glow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('tabProjects')}
          </button>
          <button
            onClick={() => setTypeFilter('crews')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              typeFilter === 'crews'
                ? 'bg-amber-500 text-slate-950 shadow-amber-glow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('tabCrews')}
          </button>
        </div>

        {/* Verified Only Toggle */}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
          />
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{t('verifiedOnlyLabel')}</span>
        </label>
      </div>

      {/* City & Specialty Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
        <div className="relative">
          <MapPin className="w-4 h-4 absolute start-3 top-2.5 text-slate-500 pointer-events-none" />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full ps-9 pe-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer appearance-none"
          >
            <option value="all">{t('allCities')}</option>
            {SAUDI_CITIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-slate-900 text-white">
                {locale === 'ar' ? c.labelAr : c.labelEn}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Wrench className="w-4 h-4 absolute start-3 top-2.5 text-slate-500 pointer-events-none" />
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="w-full ps-9 pe-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer appearance-none"
          >
            <option value="all">{t('allSpecialties')}</option>
            {SPECIALTIES.map((s) => (
              <option key={s.id} value={locale === 'ar' ? s.ar : s.en} className="bg-slate-900 text-white">
                {locale === 'ar' ? s.ar : s.en}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
