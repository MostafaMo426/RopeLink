import { SaudiCity, RequestType } from '@/types/database';

export const SAUDI_CITIES: { value: SaudiCity; labelAr: string; labelEn: string }[] = [
  { value: 'Riyadh', labelAr: 'الرياض', labelEn: 'Riyadh' },
  { value: 'Jeddah', labelAr: 'جدة', labelEn: 'Jeddah' },
  { value: 'Dammam', labelAr: 'الدمام', labelEn: 'Dammam' },
  { value: 'Jubail', labelAr: 'الجبيل الصناعية', labelEn: 'Jubail Industrial' },
  { value: 'Yanbu', labelAr: 'ينبع الصناعية', labelEn: 'Yanbu Industrial' },
  { value: 'NEOM', labelAr: 'نيوم', labelEn: 'NEOM' },
  { value: 'Khobar', labelAr: 'الخبر', labelEn: 'Khobar' },
  { value: 'Ras Al-Khair', labelAr: 'رأس الخير', labelEn: 'Ras Al-Khair' },
  { value: 'Tabuk', labelAr: 'تبوك', labelEn: 'Tabuk' },
  { value: 'Jazan', labelAr: 'جازان', labelEn: 'Jazan' },
  { value: 'Other', labelAr: 'مدينة أخرى', labelEn: 'Other City' },
];

export const SPECIALTIES = [
  { id: 'irata_l1', ar: 'فني حبال IRATA مستوى 1', en: 'IRATA Rope Access L1' },
  { id: 'irata_l2', ar: 'فني حبال IRATA مستوى 2', en: 'IRATA Rope Access L2' },
  { id: 'irata_l3', ar: 'مشرف حبال IRATA مستوى 3', en: 'IRATA Rope Access L3 Supervisor' },
  { id: 'ndt_inspection', ar: 'فحص غير إتلافي (NDT Level II)', en: 'NDT Level II Inspection' },
  { id: 'industrial_welding', ar: 'لحام صناعي على ارتفاعات', en: 'High-Altitude Industrial Welding' },
  { id: 'facade_maintenance', ar: 'صيانة وتنظيف واجهات الأبراج', en: 'Tower Facade Cleaning & Glazing' },
  { id: 'blade_repair', ar: 'صيانة توربينات وطاقة متجددة', en: 'Wind Turbine & Energy Maintenance' },
];

export const REQUEST_TYPE_META: Record<
  RequestType,
  { labelAr: string; labelEn: string; color: string; badge: string }
> = {
  project: {
    labelAr: 'عندي مشروع',
    labelEn: 'I Have a Project',
    color: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  need_manpower: {
    labelAr: 'أحتاج كوادر / فنيين',
    labelEn: 'I Need Manpower',
    color: 'from-cyan-500 to-blue-600',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  available_crew: {
    labelAr: 'لدي كادر متاح',
    labelEn: 'I Have Available Crew',
    color: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
};
