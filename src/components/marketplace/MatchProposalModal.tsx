'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { X, Send, Handshake } from 'lucide-react';
import { ManpowerRequest } from '@/types/database';
import { toast } from 'sonner';

interface MatchProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRequest: ManpowerRequest | null;
  onSendProposal: (requestId: string, recipientId: string, message: string) => Promise<boolean>;
}

export default function MatchProposalModal({
  isOpen,
  onClose,
  targetRequest,
  onSendProposal,
}: MatchProposalModalProps) {
  const t = useTranslations('marketplace');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !targetRequest) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRequest.user_id) {
      toast.error('Recipient not found');
      return;
    }

    setLoading(true);
    const success = await onSendProposal(
      targetRequest.id,
      targetRequest.user_id,
      message.trim() || 'Mobilization match proposal'
    );
    setLoading(false);

    if (success) {
      toast.success(t('proposalSuccessToast'));
      setMessage('');
      onClose();
    } else {
      toast.error(t('proposalErrorToast'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-[#0E1524] border border-amber-500/30 p-6 sm:p-7 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t('proposalModalTitle')}</h3>
              <p className="text-xs text-slate-400">{targetRequest.company_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs text-slate-300">
          <p className="font-semibold text-white">{targetRequest.specialty}</p>
          <p className="text-slate-400">
            {targetRequest.technician_count} Techs • {targetRequest.city}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('proposalMessageLabel')}
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('proposalMessagePlaceholder')}
              className="w-full p-3 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-glow transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? t('submitting') : t('sendProposalConfirmBtn')}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
