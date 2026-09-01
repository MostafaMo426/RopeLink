'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { ManpowerRequest } from '@/types/database';

export function useRequests(userId?: string) {
  const [requests, setRequests] = useState<ManpowerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured() && userId) {
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setRequests(data || []);
      } else {
        const stored = JSON.parse(localStorage.getItem('ropelink_requests') || '[]');
        if (stored.length === 0) {
          // Demo fallback seed records for rich interactive display
          const demo: ManpowerRequest[] = [
            {
              id: 'demo-req-1',
              company_name: 'شركة سابك للمغذيات الزراعية',
              type: 'project',
              city: 'Jubail',
              start_date: '2026-09-15',
              technician_count: 8,
              specialty: 'مشرف حبال IRATA مستوى 3',
              status: 'in_progress',
              notes: 'مشروع صيانة وتفتيش دوري لأبراج التبريد في الجبيل 2.',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'demo-req-2',
              company_name: 'المقاولات العامة للبتروكيماويات',
              type: 'need_manpower',
              city: 'Yanbu',
              start_date: '2026-09-20',
              technician_count: 6,
              specialty: 'فحص غير إتلافي (NDT Level II)',
              status: 'reviewing',
              notes: 'فحص خزانات كروية وخطوط أنابيب على ارتفاع 45 متراً.',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'demo-req-3',
              company_name: 'شركة الصيانة الصناعية المتقدمة',
              type: 'available_crew',
              city: 'Ras Al-Khair',
              start_date: '2026-09-10',
              technician_count: 12,
              specialty: 'فني حبال IRATA مستوى 1',
              status: 'matched',
              notes: 'كادر كامل جاهز للتسكين الفوري ومزود بمعدات السلامة.',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];
          setRequests(demo);
        } else {
          setRequests(stored);
        }
      }
    } catch (e) {
      console.error('Error fetching requests', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refreshRequests: fetchRequests };
}
