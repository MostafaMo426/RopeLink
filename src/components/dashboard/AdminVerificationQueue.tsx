'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile, VerificationStatus } from '@/types/database';
import { ShieldCheck, Check, X, FileText, Building2, Paperclip, ExternalLink } from 'lucide-react';
import { getCityLabel } from '@/lib/constants';
import { toast } from 'sonner';

export default function AdminVerificationQueue() {
  const t = useTranslations('verification');
  const locale = useLocale();
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('verification_status', 'pending_review')
          .order('created_at', { ascending: false });
        setPendingProfiles(data || []);
      }
    } catch (e) {
      console.warn('Error fetching verification queue', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleUpdateStatus = async (profileId: string, status: VerificationStatus) => {
    setActionLoadingId(profileId);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('profiles')
          .update({ verification_status: status })
          .eq('id', profileId);
        if (error) throw error;
      }
      toast.success(
        status === 'verified' ? t('approveSuccessToast') : t('rejectSuccessToast')
      );
      setPendingProfiles((prev) => prev.filter((p) => p.id !== profileId));
    } catch (e: any) {
      toast.error(e.message || 'Error updating status');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div id="tour-verification-queue" className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white text-base sm:text-lg">
            {t('adminQueueTitle')}
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
          {pendingProfiles.length} {t('pendingBadge')}
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-4">{t('loadingQueue')}</p>
      ) : pendingProfiles.length === 0 ? (
        <p className="text-xs text-slate-500 py-2">{t('emptyQueue')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {pendingProfiles.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3.5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-white text-sm">{p.company_name}</h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {getCityLabel(p.city, locale)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono">CR: {p.cr_number || 'N/A'}</span>
                </div>

                {/* Attached Document Link */}
                <div className="pt-1">
                  {p.cr_document_url ? (
                    <a
                      href={p.cr_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('viewAttachedDoc')}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      {t('noAttachedDoc')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  disabled={actionLoadingId === p.id}
                  onClick={() => handleUpdateStatus(p.id, 'verified')}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('approveBtn')}</span>
                </button>
                <button
                  disabled={actionLoadingId === p.id}
                  onClick={() => handleUpdateStatus(p.id, 'rejected')}
                  className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('rejectBtn')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
