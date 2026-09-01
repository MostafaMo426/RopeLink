'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { X, Users, Plus } from 'lucide-react';
import { CrewRosterMember } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { toast } from 'sonner';
import CrewRosterList from './CrewRosterList';

interface CrewRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreementId: string;
}

export default function CrewRosterModal({ isOpen, onClose, agreementId }: CrewRosterModalProps) {
  const t = useTranslations('mobilization');
  const [roster, setRoster] = useState<CrewRosterMember[]>([]);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('IRATA L1');
  const [irataNumber, setIrataNumber] = useState('');
  const [ajeerRef, setAjeerRef] = useState('');
  const [gatePassRef, setGatePassRef] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !agreementId) return;
    const fetchRoster = async () => {
      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from('crew_rosters')
          .select('*')
          .eq('agreement_id', agreementId);
        if (data) setRoster(data as CrewRosterMember[]);
      }
    };
    fetchRoster();
  }, [isOpen, agreementId]);

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !irataNumber.trim()) return;

    setLoading(true);
    const newMember = {
      agreement_id: agreementId,
      technician_name: name.trim(),
      irata_level: level,
      irata_number: irataNumber.trim(),
      ajeer_permit_reference: ajeerRef.trim() || null,
      gate_pass_reference: gatePassRef.trim() || null,
      medical_fitness_valid: true,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('crew_rosters')
        .insert(newMember)
        .select()
        .single();

      if (!error && data) {
        setRoster((prev) => [...prev, data as CrewRosterMember]);
        toast.success(t('techAddedSuccess'));
      }
    } else {
      setRoster((prev) => [...prev, { ...newMember, id: `r_${Date.now()}`, created_at: new Date().toISOString() }]);
      toast.success(t('techAddedSuccess'));
    }

    setName('');
    setIrataNumber('');
    setAjeerRef('');
    setGatePassRef('');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0E1524] border border-amber-500/30 p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">{t('rosterModalTitle')}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAddMember} className="space-y-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t('techNameLabel')}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: فهد سالم الشهري"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t('irataLevelLabel')}</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="IRATA L1">IRATA Level 1</option>
                <option value="IRATA L2">IRATA Level 2</option>
                <option value="IRATA L3">IRATA Level 3 Supervisor</option>
                <option value="NDT Level II">NDT Level II Inspector</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('irataNumberLabel')}</label>
              <input
                type="text"
                required
                value={irataNumber}
                onChange={(e) => setIrataNumber(e.target.value)}
                placeholder="1/12345/L1"
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-amber-400 mb-1">{t('ajeerRefLabel')}</label>
              <input
                type="text"
                value={ajeerRef}
                onChange={(e) => setAjeerRef(e.target.value)}
                placeholder="AJR-2026-XXXX"
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-amber-500/40 rounded-lg text-xs text-amber-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('gatePassRefLabel')}</label>
              <input
                type="text"
                value={gatePassRef}
                onChange={(e) => setGatePassRef(e.target.value)}
                placeholder="GP-9921"
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addTechBtn')}</span>
          </button>
        </form>

        <CrewRosterList roster={roster} />
      </motion.div>
    </div>
  );
}
