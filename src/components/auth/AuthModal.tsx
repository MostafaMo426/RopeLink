'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/types/database';
import AuthFormFields from './AuthFormFields';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: (user: any) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}: AuthModalProps) {
  const t = useTranslations('auth');
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<UserRole>('contractor');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        if (mode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                company_name: companyName,
                role: role,
              },
            },
          });
          if (error) throw error;
          toast.success(t('authSuccess'));
          onSuccess?.(data.user);
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          toast.success(t('authSuccess'));
          onSuccess?.(data.user);
        }
      } else {
        const mockUser = {
          id: 'demo-user-saudi-01',
          email,
          user_metadata: { company_name: companyName || 'شركة المقاولات السعودية', role },
        };
        sessionStorage.setItem('ropelink_user', JSON.stringify(mockUser));
        toast.success(t('authSuccess'));
        onSuccess?.(mockUser);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || t('authError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md rounded-2xl bg-[#0E1524] border border-amber-500/30 p-6 sm:p-8 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-2">
          {mode === 'login' ? t('loginTitle') : t('signupTitle')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <AuthFormFields
            mode={mode}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            companyName={companyName}
            setCompanyName={setCompanyName}
            role={role}
            setRole={setRole}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-glow transition-all duration-200 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? '...' : mode === 'login' ? t('loginBtn') : t('signupBtn')}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-xs text-amber-400 hover:underline cursor-pointer"
          >
            {mode === 'login' ? t('switchToSignup') : t('switchToLogin')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
