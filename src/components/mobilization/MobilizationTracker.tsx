'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MilestoneStage } from '@/types/database';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';

interface MobilizationTrackerProps {
  currentMilestone: MilestoneStage;
  agreementId: string;
  onAdvanceMilestone?: (agreementId: string, nextMilestone: MilestoneStage) => Promise<boolean>;
}

const STAGES: { key: MilestoneStage; stageNum: number; isLegalGateway?: boolean }[] = [
  { key: 'agreement_signed', stageNum: 1 },
  { key: 'roster_dispatched', stageNum: 2 },
  { key: 'ajeer_permit_issued', stageNum: 3, isLegalGateway: true },
  { key: 'gate_pass_issued', stageNum: 4 },
  { key: 'hse_induction_done', stageNum: 5 },
  { key: 'active_execution', stageNum: 6 },
  { key: 'completed', stageNum: 7 },
];

export default function MobilizationTracker({
  currentMilestone,
  agreementId,
  onAdvanceMilestone,
}: MobilizationTrackerProps) {
  const t = useTranslations('mobilization');
  const [advancing, setAdvancing] = useState(false);

  const currentIndex = STAGES.findIndex((s) => s.key === currentMilestone);
  const nextStage = currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1].key : null;

  const handleAdvance = async () => {
    if (!nextStage || !onAdvanceMilestone || advancing) return;
    setAdvancing(true);
    await onAdvanceMilestone(agreementId, nextStage);
    setAdvancing(false);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('title')}</span>
        </h4>
        {nextStage && onAdvanceMilestone && (
          <button
            onClick={handleAdvance}
            disabled={advancing}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{t('advanceStageBtn')}</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </button>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STAGES.map((s, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const isAjeer = s.isLegalGateway;

          return (
            <div
              key={s.key}
              className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-2 ${
                isCurrent
                  ? isAjeer
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-amber-glow'
                    : 'bg-amber-500/10 border-amber-500 text-white'
                  : isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-800/80">
                  {s.stageNum}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>

              <div>
                <p className="font-bold text-[11px] leading-tight">
                  {t(`stage${s.stageNum}` as any)}
                </p>
                {isAjeer && (
                  <span className="text-[9px] font-black text-amber-400 block mt-0.5 uppercase">
                    {t('mandatoryLegalBadge')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
