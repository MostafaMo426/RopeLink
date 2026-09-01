'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Agreement, MilestoneStage } from '@/types/database';
import { FileText, MapPin, Users, Calendar, PenTool, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getCityLabel, getSpecialtyLabel } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import MobilizationTracker from '@/components/mobilization/MobilizationTracker';

interface AgreementCardProps {
  agreement: Agreement;
  currentUserId?: string;
  onOpenSignModal: (agreement: Agreement, isProposer: boolean) => void;
  onOpenRosterModal: (agreementId: string) => void;
  onAdvanceMilestone: (agreementId: string, nextMilestone: MilestoneStage) => Promise<boolean>;
}

export default function AgreementCard({
  agreement: a,
  currentUserId,
  onOpenSignModal,
  onOpenRosterModal,
  onAdvanceMilestone,
}: AgreementCardProps) {
  const t = useTranslations('agreements');
  const locale = useLocale();

  const isProposer = a.proposer_id === currentUserId;
  const isMySignatureDone = isProposer ? a.terms_accepted_proposer : a.terms_accepted_recipient;
  const otherCompany = isProposer
    ? a.recipient?.company_name || 'الشريك التجاري'
    : a.proposer?.company_name || 'الشريك التجاري';

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border-slate-800 hover:border-slate-700 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <span>عقد إسناد:</span>
              <span className="text-amber-400">{otherCompany}</span>
            </h3>
            <p className="text-xs text-slate-400 font-semibold">{getSpecialtyLabel(a.specialty, locale)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
              a.status === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : a.status === 'completed'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {a.status === 'active'
              ? t('bothSignedActive')
              : a.status === 'completed'
              ? t('completedContract')
              : t('waitingOtherSig')}
          </span>
        </div>
      </div>

      {/* Contract Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block">القيمة الإجمالية:</span>
          <span className="font-bold text-amber-400 text-sm">
            {Number(a.total_estimated_sar).toLocaleString()} {t('sarCurrency')}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">اليومية للفني:</span>
          <span className="font-semibold text-white">
            {Number(a.daily_rate_sar).toLocaleString()} {t('sarCurrency')}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">العدد والموقع:</span>
          <span className="font-semibold text-white">
            {a.technician_count} فنيين • {getCityLabel(a.city, locale)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">الفترة الميدانية:</span>
          <span className="font-semibold text-white">
            {formatDate(a.start_date, locale)}
          </span>
        </div>
      </div>

      {/* Signatures & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">توقيع المقاول:</span>
            {a.terms_accepted_proposer ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> معتمد
              </span>
            ) : (
              <span className="text-amber-400">بانتظار الاعتماد</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">توقيع المزود:</span>
            {a.terms_accepted_recipient ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> معتمد
              </span>
            ) : (
              <span className="text-amber-400">بانتظار الاعتماد</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isMySignatureDone && (
            <button
              onClick={() => onOpenSignModal(a, isProposer)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-amber-glow"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{t('signBtn')}</span>
            </button>
          )}

          <button
            onClick={() => onOpenRosterModal(a.id)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('manageRosterBtn')}</span>
          </button>
        </div>
      </div>

      {/* 7-Stage Mobilization Tracker */}
      <MobilizationTracker
        currentMilestone={a.current_milestone}
        agreementId={a.id}
        onAdvanceMilestone={onAdvanceMilestone}
      />
    </div>
  );
}
