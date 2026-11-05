'use client';

import { isSupabaseConfigured } from '@/lib/supabase/client';
import { AlertTriangle } from 'lucide-react';

export default function ConfigurationGuard({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <div className="fixed top-0 inset-x-0 z-[9999] bg-amber-500 text-slate-950 text-center text-xs font-bold py-1.5 px-4">
          ⚠️ Demo mode: Supabase is not configured. All data is local only and will not persist.
        </div>
        <div className="pt-7">{children}</div>
      </>
    );
  }
  return <>{children}</>;
}
