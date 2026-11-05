'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => Promise<boolean>;
  maxLength?: number;
}

export default function ChatInput({ onSend, maxLength = 500 }: ChatInputProps) {
  const t = useTranslations('chat');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const charCount = text.length;
  const isOverLimit = charCount >= maxLength;
  const isNearLimit = charCount > maxLength - 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending || isOverLimit) return;

    setSending(true);
    const content = text;
    setText('');
    const success = await onSend(content);
    setSending(false);
    if (!success) {
      setText(content);
    }
  };

  return (
    <div className="pt-3 border-t border-slate-800 space-y-1.5">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          maxLength={maxLength}
          className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending || isOverLimit}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t('sendBtn')}</span>
        </button>
      </form>
      {text.length > 0 && (
        <div className="flex items-center justify-between px-1">
          {isOverLimit ? (
            <p className="text-[11px] text-red-400 font-semibold">{t('chatTruncWarning')}</p>
          ) : (
            <span />
          )}
          <span className={`text-[11px] font-mono ml-auto ${isNearLimit ? 'text-red-400' : 'text-slate-500'}`}>
            {t('chatCharCount', { count: charCount, max: maxLength })}
          </span>
        </div>
      )}
    </div>
  );
}
