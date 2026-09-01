'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ManpowerRequest, RequestStatus } from '@/types/database';
import { ShieldCheck, Building } from 'lucide-react';
import { toast } from 'sonner';
import AdminRequestCard from './AdminRequestCard';

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
  const [filter, setFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const uniqueCompanies = useMemo(() => {
    const names = requests.map((r) => r.company_name).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [requests]);

  const filtered = requests.filter((r) => {
    const matchStatus = filter === 'all' ? true : r.status === filter;
    const matchCompany = selectedCompany === 'all' ? true : r.company_name === selectedCompany;
    return matchStatus && matchCompany;
  });

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
      {/* Console Header & Filters */}
      <div
        id="tour-admin-console"
        className="glass-panel p-6 rounded-2xl border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950"
      >
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
              {filtered.length} / {requests.length} {t('filterAll')}
            </span>
          </div>
        </div>

        {/* Company Dropdown & Status Filter Bar */}
        <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
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

          <div className="flex items-center gap-2 text-xs">
            <Building className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">{t('allCompanies')}</option>
              {uniqueCompanies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Requests Feed */}
      <div id="tour-admin-feed">
        {loading ? (
          <div className="glass-panel p-10 text-center text-slate-400 rounded-2xl border-slate-800">
            <p className="text-sm">{t('consoleSubtitle')}...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-10 text-center text-slate-400 rounded-2xl border-slate-800">
            <p className="text-sm">No requests found matching your filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((req) => (
              <AdminRequestCard
                key={req.id}
                request={req}
                isUpdating={updatingId === req.id}
                statusOptions={STATUS_OPTIONS}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
