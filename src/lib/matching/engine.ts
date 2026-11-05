import { ManpowerRequest, SaudiCity } from '@/types/database';
import { toCanonicalSpecialtyId } from '@/lib/constants';

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

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

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

export function isEligibleMatch(
  demand: ManpowerRequest,
  supply: ManpowerRequest
): EligibilityResult {
  const isDemandA = demand.type === 'need_manpower' || demand.type === 'project';
  const isSupplyA = demand.type === 'available_crew';
  const isDemandB = supply.type === 'need_manpower' || supply.type === 'project';
  const isSupplyB = supply.type === 'available_crew';

  if ((isDemandA && !isSupplyB) || (isSupplyA && !isDemandB)) {
    return { eligible: false, reason: 'Request types must be complementary' };
  }

  if (
    !demand.technician_count ||
    demand.technician_count <= 0 ||
    !supply.technician_count ||
    supply.technician_count <= 0
  ) {
    return { eligible: false, reason: 'Technician count must be positive' };
  }

  const dDate = new Date(demand.start_date).getTime();
  const sDate = new Date(supply.start_date).getTime();
  if (isNaN(dDate) || isNaN(sDate)) {
    return { eligible: false, reason: 'Invalid timeline dates' };
  }

  return { eligible: true };
}

export function calculateMatchScore(
  demand: ManpowerRequest,
  supply: ManpowerRequest
): MatchScoreResult {
  const eligibility = isEligibleMatch(demand, supply);
  if (!eligibility.eligible) {
    return {
      score: 0,
      breakdown: {
        specialtyScore: 0,
        locationScore: 0,
        timelineScore: 0,
        headcountScore: 0,
      },
      recommendationKey: 'partial',
    };
  }

  // 1. Specialty / Trade Matching (Weight: 40%) - Canonical ID Normalization
  const cDemand = toCanonicalSpecialtyId(demand.specialty);
  const cSupply = toCanonicalSpecialtyId(supply.specialty);
  let specialtyScore = 50;

  if (cDemand === cSupply && cDemand !== '') {
    specialtyScore = 100;
  } else if (cDemand.startsWith('irata_') && cSupply.startsWith('irata_')) {
    if (cSupply === 'irata_l3') specialtyScore = 95;
    else if (cSupply === 'irata_l2' && cDemand === 'irata_l1') specialtyScore = 85;
    else if (cSupply === 'irata_l1' && cDemand === 'irata_l2') specialtyScore = 70;
    else specialtyScore = 60;
  } else if (cDemand === 'ndt_inspection' && cSupply === 'ndt_inspection') {
    specialtyScore = 100;
  } else if (
    demand.specialty?.toLowerCase().includes('irata') &&
    supply.specialty?.toLowerCase().includes('irata')
  ) {
    specialtyScore = supply.specialty.toLowerCase().includes('l3') ? 95 : 80;
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
    headcountScore = Math.max(
      30,
      Math.round((supply.technician_count / demand.technician_count) * 100)
    );
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
