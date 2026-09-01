'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ManpowerRequest, RequestStatus } from '@/types/database';
import { MapPin, Users, Calendar, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface AdminOperationsViewProps {
  requests: ManpowerRequest[];
  loading?: boolean;
  onUpdateStatus: (id: string, status: RequestStatus) => Promise<boolean>;
}

const STATUS_OPTIONS: RequestStatus[] = [
  'pending',
  'reviewing',
  'matched',
  'in_progress',
  'completed',
  'cancelled',
];

export default function AdminOperationsView({
  requests,
  loading,
  onUpdateStatus,
}: AdminOperationsViewProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [filter, setFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = requests.filter((r) => (filter === 'all' ? true : r.status === filter));

  const handleStatusChange = async (id: string, newStatus: RequestStatus) => {
    setUpdatingId(id);
    const success = await onUpdateStatus(id, newStatus);
    setUpdatingId(null);
    if (success) {
      toast.success(t('statusUpdatedToast'));
    } else {
      toast.error(t('statusUpdateError'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Console Header */}
      <div className="glass-panel p-6 rounded-2xl border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-white">{t('consoleTitle')}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">{t('consoleSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              {requests.length} {t('filterAll')}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 text-xs">
          {['all', 'pending', 'reviewing', 'matched', 'in_progress', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filter === st
                  ? 'bg-amber-500 text-black shadow-amber-glow'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {st === 'all'
                ? t('filterAll')
                : st === 'pending'
                ? t('filterPending')
                : st === 'reviewing'
                ? t('filterReviewing')
                : st === 'matched'
                ? t('filterMatched')
                : st === 'in_progress'
                ? t('filterInProgress')
                : t('filterCompleted')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Feed */}
      {loading ? (
        <div className="glass-panel p-10 text-center text-slate-400 rounded-2xl border-slate-800">
          <p className="text-sm">{t('consoleSubtitle')}...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-10 text-center text-slate-400 rounded-2xl border-slate-800">
          <p className="text-sm">No requests found in this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="glass-panel p-5 rounded-2xl border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {req.specialty}
                  </span>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400">{t('statusUpdate')}:</span>
                    <select
                      value={req.status}
                      disabled={updatingId === req.id}
                      onChange={(e) => handleStatusChange(req.id, e.target.value as RequestStatus)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} className="bg-slate-900 text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h3 className="font-bold text-white text-base">{req.company_name}</h3>
                {req.notes && <p className="text-xs text-slate-400 line-clamp-2">{req.notes}</p>}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {req.city}
                </span>
                {req.contact_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    {req.contact_phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  {req.technician_count} Techs
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  {formatDate(req.start_date, locale)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
