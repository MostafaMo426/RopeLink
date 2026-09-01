'use client';

import { useTranslations } from 'next-intl';
import { Building2, Mail, Lock } from 'lucide-react';
import { UserRole } from '@/types/database';

interface AuthFormFieldsProps {
  mode: 'login' | 'signup';
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  companyName: string;
  setCompanyName: (val: string) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
}

export default function AuthFormFields({
  mode,
  email,
  setEmail,
  password,
  setPassword,
  companyName,
  setCompanyName,
  role,
  setRole,
}: AuthFormFieldsProps) {
  const t = useTranslations('auth');

  return (
    <>
      {mode === 'signup' && (
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('companyLabel')}
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute start-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('companyPlaceholder')}
                className="w-full ps-9 pe-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('roleLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('contractor')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                  role === 'contractor'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {t('roleContractor')}
              </button>
              <button
                type="button"
                onClick={() => setRole('supplier')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                  role === 'supplier'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {t('roleSupplier')}
              </button>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          {t('emailLabel')}
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute start-3 top-3 text-slate-500" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full ps-9 pe-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          {t('passwordLabel')}
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute start-3 top-3 text-slate-500" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full ps-9 pe-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>
    </>
  );
}
