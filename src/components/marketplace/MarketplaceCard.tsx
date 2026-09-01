'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ManpowerRequest, Profile } from '@/types/database';
import { MapPin, Users, Calendar, Sparkles, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getCityLabel } from '@/lib/constants';
import TrustBadge from '@/components/verification/TrustBadge';
import { calculateMatchScore, getMatchBadgeStyles } from '@/lib/matching/engine';

interface MarketplaceCardProps {
  request: ManpowerRequest;
  currentUserProfile?: Profile | null;
  userRequests?: ManpowerRequest[];
  onOpenProposal: (request: ManpowerRequest) => void;
}

export default function MarketplaceCard({
  request: req,
  currentUserProfile,
  userRequests = [],
  onOpenProposal,
}: MarketplaceCardProps) {
  const t = useTranslations('marketplace');
  const tDash = useTranslations('dashboard');
  const tMatch = useTranslations('matching');
  const locale = useLocale();

  const isOwnRequest = req.user_id === currentUserProfile?.id;
  const isCrew = req.type === 'available_crew';

  // Calculate highest match score if user has opposing active requests
  let bestMatch: { score: number; key: string } | null = null;
  if (userRequests.length > 0 && !isOwnRequest) {
    const opposing = userRequests.filter((ur) =>
      isCrew ? ur.type !== 'available_crew' : ur.type === 'available_crew'
    );
    if (opposing.length > 0) {
      let max = 0;
      opposing.forEach((opp) => {
        const res = calculateMatchScore(isCrew ? opp : req, isCrew ? req : opp);
        if (res.score > max) max = res.score;
      });
      bestMatch = {
        score: max,
        key: max >= 85 ? 'high' : max >= 70 ? 'good' : 'partial',
      };
    }
  }

  const badgeStyles = bestMatch ? getMatchBadgeStyles(bestMatch.score) : null;

  return (
    <div className="glass-panel p-5 rounded-2xl border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 hover:shadow-glass-card">
      <div className="space-y-3">
        {/* Type & Trust Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              isCrew
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {isCrew ? t('typeCrew') : t('typeProject')}
          </span>

          <TrustBadge status={req.profiles?.verification_status || 'unverified'} />
        </div>

        {/* Title & Specialty */}
        <div>
          <h3 className="font-bold text-white text-base mb-1">{req.company_name}</h3>
          <p className="text-xs text-amber-400 font-semibold">{req.specialty}</p>
        </div>

        {req.notes && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{req.notes}</p>
        )}
      </div>

      {/* Match Score Indicator (if computed) */}
      {bestMatch && badgeStyles && (
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-xl border ${badgeStyles.badgeClass}`}
        >
          <span className="flex items-center gap-1.5 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{tMatch('compatibility')}: {bestMatch.score}%</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            {tMatch(bestMatch.key as any)}
          </span>
        </div>
      )}

      {/* Details Footer & Action */}
      <div className="pt-3 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            {getCityLabel(req.city, locale)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            {req.technician_count} {tDash('techsCount')}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            {formatDate(req.start_date, locale)}
          </span>
        </div>

        {!isOwnRequest && (
          <button
            onClick={() => onOpenProposal(req)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
          >
            <Send className="w-3.5 h-3.5 text-amber-400 group-hover:text-slate-950 transition-colors" />
            <span>{t('sendProposalBtn')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
