'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[RopeLink] Locale route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#07090E] p-8 text-center space-y-6">
      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
        <p className="text-sm text-slate-400 max-w-md">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
