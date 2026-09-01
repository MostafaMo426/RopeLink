'use client';

import { useLocale } from 'next-intl';
import { ManpowerRequest } from '@/types/database';
import { MapPin, Users, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface RequestsListProps {
  requests: ManpowerRequest[];
  loading?: boolean;
}

export default function RequestsList({ requests, loading }: RequestsListProps) {
  const locale = useLocale();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">الطلبات والإسنادات المسجلة</h2>
        <span className="text-xs text-slate-400">إجمالي: {requests.length}</span>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border-slate-800">
          <p className="text-sm">جاري تحميل البيانات من Supabase...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 space-y-2 border-slate-800">
          <p className="text-sm">لم يتم تسجيل أي طلبات بعد في قاعدة البيانات.</p>
          <p className="text-xs text-slate-500">اختر أحد الإجراءات أعلاه لإنشاء أول طلب إسناد في منصة RopeLink.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="glass-panel p-5 rounded-2xl border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {req.specialty}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {req.status}
                  </span>
                </div>

                <h4 className="font-bold text-white text-sm sm:text-base">
                  {req.company_name}
                </h4>

                {req.notes && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {req.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {req.city}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  {req.technician_count} فنيين
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
