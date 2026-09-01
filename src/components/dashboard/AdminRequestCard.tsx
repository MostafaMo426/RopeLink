'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ManpowerRequest, RequestStatus } from '@/types/database';
import { MapPin, Users, Calendar, Phone } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AdminRequestCardProps {
  request: ManpowerRequest;
  isUpdating: boolean;
  statusOptions: RequestStatus[];
  onStatusChange: (id: string, status: RequestStatus) => void;
}

export default function AdminRequestCard({
  request: req,
  isUpdating,
  statusOptions,
  onStatusChange,
}: AdminRequestCardProps) {
  const t = useTranslations('admin');
  const locale = useLocale();

  return (
    <div className="glass-panel p-5 rounded-2xl border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {req.specialty}
          </span>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">{t('statusUpdate')}:</span>
            <select
              value={req.status}
              disabled={isUpdating}
              onChange={(e) => onStatusChange(req.id, e.target.value as RequestStatus)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {statusOptions.map((opt) => (
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
  );
}
