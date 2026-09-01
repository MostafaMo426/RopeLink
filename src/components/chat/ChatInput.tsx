'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => Promise<boolean>;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const t = useTranslations('chat');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

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
    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-3 border-t border-slate-800">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('placeholder')}
        className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
      />
      <button
        type="submit"
        disabled={!text.trim() || sending}
        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
      >
        <Send className="w-3.5 h-3.5" />
        <span>{t('sendBtn')}</span>
      </button>
    </form>
  );
}
