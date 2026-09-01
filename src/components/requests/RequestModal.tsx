'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { RequestType, CreateRequestInput, ManpowerRequest } from '@/types/database';
import { REQUEST_TYPE_META } from '@/lib/constants';
import RequestForm from './RequestForm';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: RequestType;
  user?: any;
  onCreated?: () => void;
}

export default function RequestModal({
  isOpen,
  onClose,
  type,
  user,
  onCreated,
}: RequestModalProps) {
  const t = useTranslations('requestModal');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const meta = REQUEST_TYPE_META[type];

  const handleSubmit = async (input: CreateRequestInput) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('requests').insert([
          {
            user_id: user?.id || null,
            company_name: input.company_name,
            contact_phone: input.contact_phone,
            type: input.type,
            city: input.city,
            start_date: input.start_date,
            technician_count: input.technician_count,
            specialty: input.specialty || 'Rope Access IRATA',
            notes: input.notes,
            status: 'pending',
          },
        ]);
        if (error) throw error;
      } else {
        let existing: ManpowerRequest[] = [];
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('ropelink_requests');
          if (raw && raw.trim()) {
            try {
              existing = JSON.parse(raw);
            } catch {
              existing = [];
            }
          }
        }
        const newReq: ManpowerRequest = {
          id: 'req-' + Date.now(),
          user_id: user?.id || null,
          company_name: input.company_name,
          contact_phone: input.contact_phone || null,
          type: input.type,
          city: input.city,
          start_date: input.start_date,
          technician_count: input.technician_count,
          specialty: input.specialty || 'Rope Access IRATA',
          status: 'pending',
          notes: input.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem('ropelink_requests', JSON.stringify([newReq, ...existing]));
      }

      toast.success(t('successToast'));
      onCreated?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || t('errorToast'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-[#0E1524] border-t sm:border border-amber-500/30 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mb-1.5 ${meta.badge}`}>
              {meta.labelAr}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {type === 'project'
                ? t('titleProject')
                : type === 'need_manpower'
                ? t('titleManpower')
                : t('titleCrew')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5">
          <RequestForm type={type} onSubmit={handleSubmit} loading={loading} />
        </div>
      </motion.div>
    </div>
  );
}
