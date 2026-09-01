'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Anchor, Menu, X, User } from 'lucide-react';
import LocaleSwitcher from '@/components/common/LocaleSwitcher';

interface NavbarProps {
  onOpenAuth?: (initialMode?: 'login' | 'signup') => void;
  user?: any;
}

export default function Navbar({ onOpenAuth, user }: NavbarProps) {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      id="tour-navbar"
      className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090E]/90 backdrop-blur-xl transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-amber-glow text-black font-black">
            <Anchor className="w-5 h-5 text-slate-950 transition-transform group-hover:rotate-12 duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              {tBrand('enName')}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider">
                KSA
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#value-props" className="hover:text-amber-400 transition-colors">
            {t('valueProps')}
          </a>
          <a href="#stats" className="hover:text-amber-400 transition-colors">
            {t('stats')}
          </a>
          <a href="#how-it-works" className="hover:text-amber-400 transition-colors">
            {t('howItWorks')}
          </a>
        </nav>

        {/* Action Buttons & Locale */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-amber-glow transition-all duration-200"
            >
              <User className="w-4 h-4" />
              <span>{t('dashboard')}</span>
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => onOpenAuth?.('login')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                {t('login')}
              </button>
              <button
                onClick={() => onOpenAuth?.('signup')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-glow transition-all duration-200 cursor-pointer"
              >
                {t('signup')}
              </button>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0B0F17]/95 backdrop-blur-2xl px-4 py-4 space-y-3">
          <a
            href="#value-props"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-amber-400"
          >
            {t('valueProps')}
          </a>
          <a
            href="#stats"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-amber-400"
          >
            {t('stats')}
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-amber-400"
          >
            {t('howItWorks')}
          </a>
          {user ? (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-2.5 rounded-lg text-xs font-bold text-center bg-amber-500 text-black shadow-amber-glow"
            >
              {t('dashboard')}
            </Link>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth?.('login');
                }}
                className="w-full py-2.5 rounded-lg text-xs font-semibold text-center bg-slate-800 text-slate-200"
              >
                {t('login')}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth?.('signup');
                }}
                className="w-full py-2.5 rounded-lg text-xs font-bold text-center bg-amber-500 text-black shadow-amber-glow"
              >
                {t('signup')}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
