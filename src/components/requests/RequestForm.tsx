'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SAUDI_CITIES, SPECIALTIES } from '@/lib/constants';
import { RequestType, SaudiCity, CreateRequestInput } from '@/types/database';
import { Building2, Phone, MapPin, Calendar, Users, Wrench } from 'lucide-react';

interface RequestFormProps {
  type: RequestType;
  onSubmit: (input: CreateRequestInput) => Promise<void>;
  loading?: boolean;
}

export default function RequestForm({ type, onSubmit, loading }: RequestFormProps) {
  const t = useTranslations('requestModal');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState<SaudiCity>('Jubail');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [count, setCount] = useState(4);
  const [specialty, setSpecialty] = useState(SPECIALTIES[0].ar);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      company_name: companyName,
      contact_phone: phone,
      type,
      city,
      start_date: startDate,
      technician_count: count,
      specialty,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          {t('companyNameLabel')} *
        </label>
        <div className="relative">
          <Building2 className="w-4 h-4 absolute start-3 top-3 text-slate-500" />
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t('companyNamePlaceholder')}
            className="w-full ps-9 pe-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t('phoneLabel')}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute start-3 top-3 text-slate-500" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full ps-9 pe-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t('cityLabel')} *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute start-3 top-3 text-slate-500 pointer-events-none" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value as SaudiCity)}
              className="w-full ps-9 pe-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none appearance-none"
            >
              {SAUDI_CITIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-slate-900 text-white">
                  {c.labelAr} - {c.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t('startDateLabel')} *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute start-3 top-3 text-slate-500" />
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full ps-9 pe-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t('countLabel')} *
          </label>
          <div className="relative">
            <Users className="w-4 h-4 absolute start-3 top-3 text-slate-500" />
            <input
              type="number"
              min={1}
              max={100}
              required
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full ps-9 pe-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          {t('specialtyLabel')}
        </label>
        <div className="relative">
          <Wrench className="w-4 h-4 absolute start-3 top-3 text-slate-500 pointer-events-none" />
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full ps-9 pe-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none appearance-none"
          >
            {SPECIALTIES.map((s) => (
              <option key={s.id} value={s.ar} className="bg-slate-900 text-white">
                {s.ar} ({s.en})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          {t('notesLabel')}
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('notesPlaceholder')}
          className="w-full p-3 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-glow transition-all duration-200 cursor-pointer disabled:opacity-50 mt-2"
      >
        {loading ? t('submitting') : t('submitBtn')}
      </button>
    </form>
  );
}
