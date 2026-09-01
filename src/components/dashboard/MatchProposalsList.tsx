'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MatchProposal, MatchStatus } from '@/types/database';
import { Handshake, Check, X, ArrowDownLeft, ArrowUpRight, MessageSquare, MapPin } from 'lucide-react';
import { getCityLabel, getSpecialtyLabel } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface MatchProposalsListProps {
  matches: MatchProposal[];
  currentUserId?: string;
  onUpdateStatus: (matchId: string, status: MatchStatus) => Promise<boolean>;
}

export default function MatchProposalsList({
  matches,
  currentUserId,
  onUpdateStatus,
}: MatchProposalsListProps) {
  const t = useTranslations('marketplace');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const incoming = matches.filter((m) => m.recipient_id === currentUserId);
  const outgoing = matches.filter((m) => m.proposer_id === currentUserId);

  const handleAction = async (matchId: string, status: MatchStatus) => {
    setUpdatingId(matchId);
    const success = await onUpdateStatus(matchId, status);
    setUpdatingId(null);
    if (success) {
      toast.success(status === 'accepted' ? 'تم قبول عرض الإسناد بنجاح' : 'تم الاعتذار عن العرض');
    } else {
      toast.error('حدث خطأ أثناء تحديث حالة العرض');
    }
  };

  const currentList = activeTab === 'incoming' ? incoming : outgoing;

  return (
    <div className="space-y-5">
      {/* Sub-tabs: Incoming vs Outgoing */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'incoming'
              ? 'bg-amber-500 text-slate-950 shadow-amber-glow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>عروض إسناد واردة ({incoming.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'outgoing'
              ? 'bg-amber-500 text-slate-950 shadow-amber-glow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>عروضي المرسلة ({outgoing.length})</span>
        </button>
      </div>

      {currentList.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-400 rounded-2xl border-slate-800 space-y-1">
          <Handshake className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">
            {activeTab === 'incoming' ? 'لا توجد عروض إسناد واردة حالياً' : 'لم تقم بإرسال أي عروض بعد'}
          </p>
          <p className="text-xs text-slate-500">
            {activeTab === 'incoming'
              ? 'عندما يرسل لك مقاول آخر عرض مطابقة على طلباتك ستظهر هنا فورياً.'
              : 'تصفح سوق المقاولات والكوادر وأرسل عروض إسناد للمشاريع المتاحة.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((m) => {
            const isPending = m.status === 'pending';
            const otherCompany =
              activeTab === 'incoming'
                ? m.proposer?.company_name || 'منشأة معتمدة'
                : m.recipient?.company_name || 'منشأة معتمدة';

            return (
              <div
                key={m.id}
                className="glass-panel p-5 rounded-2xl border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Handshake className="w-4 h-4 text-amber-400" />
                      {otherCompany}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        m.status === 'accepted'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : m.status === 'declined'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {m.status === 'accepted'
                        ? 'تم قبول العرض'
                        : m.status === 'declined'
                        ? 'تم الاعتذار'
                        : 'بانتظار الرد'}
                    </span>
                  </div>

                  {m.request && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs text-slate-300">
                      <p className="font-semibold text-amber-400">
                        {getSpecialtyLabel(m.request.specialty, locale)}
                      </p>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {getCityLabel(m.request.city, locale)}
                        </span>
                        <span>{formatDate(m.request.start_date, locale)}</span>
                      </div>
                    </div>
                  )}

                  {m.message && (
                    <div className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                      <p className="leading-relaxed">{m.message}</p>
                    </div>
                  )}
                </div>

                {activeTab === 'incoming' && isPending && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      disabled={updatingId === m.id}
                      onClick={() => handleAction(m.id, 'accepted')}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>قبول الإسناد</span>
                    </button>
                    <button
                      disabled={updatingId === m.id}
                      onClick={() => handleAction(m.id, 'declined')}
                      className="py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>اعتذار</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
