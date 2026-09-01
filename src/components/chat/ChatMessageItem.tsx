'use client';

import { ChatMessage } from '@/types/database';
import { useLocale, useTranslations } from 'next-intl';

interface ChatMessageItemProps {
  message: ChatMessage;
  isMe: boolean;
}

export default function ChatMessageItem({ message: msg, isMe }: ChatMessageItemProps) {
  const locale = useLocale();
  const t = useTranslations('chat');
  const senderName = isMe ? t('you') : msg.sender?.company_name || t('partner');

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
      <span className="text-[10px] text-slate-500 font-semibold px-1">
        {senderName}
      </span>
      <div
        className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
          isMe
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-ee-none shadow-amber-glow'
            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-es-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
      </div>
      <span className="text-[9px] text-slate-600 px-1">
        {new Date(msg.created_at).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}
