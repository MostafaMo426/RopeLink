'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { X, MessageSquare, Handshake } from 'lucide-react';
import { MatchProposal } from '@/types/database';
import { useMatchChat } from '@/hooks/useMatchChat';
import ChatMessageItem from './ChatMessageItem';
import ChatInput from './ChatInput';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchProposal | null;
  currentUserId?: string;
  onOpenDraftAgreement?: (match: MatchProposal) => void;
}

export default function ChatModal({
  isOpen,
  onClose,
  match,
  currentUserId,
  onOpenDraftAgreement,
}: ChatModalProps) {
  const t = useTranslations('chat');
  const tMkt = useTranslations('marketplace');
  const { messages, loading, sendMessage } = useMatchChat(match?.id, currentUserId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !match) return null;

  const isProposer = match.proposer_id === currentUserId;
  const partnerName = isProposer
    ? match.recipient?.company_name || t('partner')
    : match.proposer?.company_name || t('partner');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-2xl h-[550px] rounded-2xl bg-[#0E1524] border border-amber-500/30 p-5 sm:p-6 shadow-2xl flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{t('title')}:</span>
                <span className="text-amber-400">{partnerName}</span>
              </h3>
              <p className="text-[11px] text-slate-400">{t('subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDraftAgreement && match.status === 'accepted' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDraftAgreement(match);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>{tMkt('createAgreementBtn')}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pe-1">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              <p>{t('loading')}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-1 text-slate-400">
              <MessageSquare className="w-8 h-8 text-slate-600 mb-1" />
              <p className="text-xs font-semibold text-white">{t('empty')}</p>
            </div>
          ) : (
            messages.map((m) => (
              <ChatMessageItem
                key={m.id}
                message={m}
                isMe={m.sender_id === currentUserId}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} />
      </motion.div>
    </div>
  );
}
