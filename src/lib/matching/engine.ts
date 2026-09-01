import { ManpowerRequest, SaudiCity } from '@/types/database';

const REGION_MAP: Record<SaudiCity, string> = {
  Jubail: 'Eastern',
  Dammam: 'Eastern',
  Khobar: 'Eastern',
  'Ras Al-Khair': 'Eastern',
  Jeddah: 'Western',
  Yanbu: 'Western',
  NEOM: 'Northern',
  Tabuk: 'Northern',
  Riyadh: 'Central',
  Jazan: 'Southern',
  Other: 'Other',
};

export interface MatchScoreResult {
  score: number;
  breakdown: {
    specialtyScore: number;
    locationScore: number;
    timelineScore: number;
    headcountScore: number;
  };
  recommendationKey: 'high' | 'good' | 'partial';
}

export function calculateMatchScore(
  demand: ManpowerRequest,
  supply: ManpowerRequest
): MatchScoreResult {
  // 1. Specialty / Trade Matching (Weight: 40%)
  let specialtyScore = 50;
  if (demand.specialty === supply.specialty) {
    specialtyScore = 100;
  } else if (
    demand.specialty.toLowerCase().includes('irata') &&
    supply.specialty.toLowerCase().includes('irata')
  ) {
    if (supply.specialty.toLowerCase().includes('l3') || supply.specialty.toLowerCase().includes('supervisor')) {
      specialtyScore = 95;
    } else {
      specialtyScore = 80;
    }
  } else if (demand.specialty.toLowerCase().includes('ndt') && supply.specialty.toLowerCase().includes('ndt')) {
    specialtyScore = 90;
  }

  // 2. Geographic Proximity Scoring (Weight: 30%)
  let locationScore = 40;
  if (demand.city === supply.city) {
    locationScore = 100;
  } else if (REGION_MAP[demand.city] === REGION_MAP[supply.city]) {
    locationScore = 85;
  } else if (
    (demand.city === 'Riyadh' && supply.city === 'Dammam') ||
    (demand.city === 'Dammam' && supply.city === 'Riyadh')
  ) {
    locationScore = 65;
  }

  // 3. Mobilization Timeline Buffer (Weight: 20%)
  let timelineScore = 30;
  try {
    const demandDate = new Date(demand.start_date).getTime();
    const supplyDate = new Date(supply.start_date).getTime();
    const diffDays = Math.abs(demandDate - supplyDate) / (1000 * 60 * 60 * 24);

    if (diffDays <= 2) timelineScore = 100;
    else if (diffDays <= 7) timelineScore = 80;
    else if (diffDays <= 14) timelineScore = 55;
    else timelineScore = 30;
  } catch {
    timelineScore = 50;
  }

  // 4. Headcount Sufficiency (Weight: 10%)
  let headcountScore = 50;
  if (supply.technician_count >= demand.technician_count) {
    headcountScore = 100;
  } else {
    headcountScore = Math.max(30, Math.round((supply.technician_count / demand.technician_count) * 100));
  }

  // Final Weighted Aggregate (0 - 100)
  const totalScore = Math.round(
    specialtyScore * 0.4 +
    locationScore * 0.3 +
    timelineScore * 0.2 +
    headcountScore * 0.1
  );

  const recommendationKey =
    totalScore >= 85 ? 'high' : totalScore >= 70 ? 'good' : 'partial';

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      specialtyScore,
      locationScore,
      timelineScore,
      headcountScore,
    },
    recommendationKey,
  };
}

export function getMatchBadgeStyles(score: number): {
  badgeClass: string;
  dotClass: string;
} {
  if (score >= 85) {
    return {
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dotClass: 'bg-emerald-400',
    };
  }
  if (score >= 70) {
    return {
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dotClass: 'bg-amber-400',
    };
  }
  return {
    badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
    dotClass: 'bg-slate-400',
  };
}
