'use client';

import { useTranslations } from 'next-intl';
import { CrewRosterMember } from '@/types/database';

interface CrewRosterListProps {
  roster: CrewRosterMember[];
}

export default function CrewRosterList({ roster }: CrewRosterListProps) {
  const t = useTranslations('mobilization');

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-slate-300">
        {t('techsRosterList')} ({roster.length})
      </h4>
      {roster.length === 0 ? (
        <p className="text-xs text-slate-500 py-3 text-center">{t('emptyRoster')}</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pe-1">
          {roster.map((r) => (
            <div
              key={r.id}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-white block">{r.technician_name}</span>
                <span className="text-[11px] text-amber-400">
                  {r.irata_level} • {r.irata_number}
                </span>
              </div>
              <div className="text-end text-[10px] space-y-0.5">
                {r.ajeer_permit_reference && (
                  <span className="block text-emerald-400 font-mono">
                    أجير: {r.ajeer_permit_reference}
                  </span>
                )}
                {r.gate_pass_reference && (
                  <span className="block text-cyan-400 font-mono">
                    تصريح: {r.gate_pass_reference}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
