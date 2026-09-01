'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { driver, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

interface GuidedTourProps {
  user: any;
  profile: Profile | null;
  forceStart?: boolean;
  onTourComplete?: () => void;
}

export default function GuidedTour({
  user,
  profile,
  forceStart = false,
  onTourComplete,
}: GuidedTourProps) {
  const t = useTranslations('tour');
  const driverRef = useRef<Driver | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    // Only proceed if profile is fully loaded
    if (!profile || !user) return;

    // If user has already seen tutorial and this is not a manual restart, exit immediately
    if (profile.has_seen_tutorial && !forceStart) return;

    // Prevent duplicate simultaneous executions
    if (isRunningRef.current && !forceStart) return;
    isRunningRef.current = true;

    const finalizeTour = async () => {
      isRunningRef.current = false;
      if (user?.id && isSupabaseConfigured()) {
        try {
          await supabase
            .from('profiles')
            .update({ has_seen_tutorial: true })
            .eq('id', user.id);
        } catch (e) {
          console.warn('Error saving tutorial status', e);
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('ropelink_has_seen_tutorial', 'true');
      }
      onTourComplete?.();
    };

    const steps: DriveStep[] = [
      {
        element: '#tour-navbar',
        popover: {
          title: t('welcomeTitle'),
          description: t('welcomeDesc'),
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-header',
        popover: {
          title: t('navTitle'),
          description: t('navDesc'),
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-ctas',
        popover: {
          title: t('ctaTitle'),
          description: t('ctaDesc'),
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#tour-requests',
        popover: {
          title: t('statsTitle'),
          description: t('statsDesc'),
          side: 'top',
          align: 'center',
        },
      },
    ];

    // Clean up any previously existing instance
    if (driverRef.current) {
      try {
        driverRef.current.destroy();
      } catch {}
    }

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      nextBtnText: t('nextBtn'),
      prevBtnText: t('prevBtn'),
      doneBtnText: t('doneBtn'),
      steps: steps,
      onDestroyStarted: () => {
        finalizeTour();
        driverObj.destroy();
      },
    });

    driverRef.current = driverObj;

    // Delay slightly to ensure complete DOM mount
    const timer = setTimeout(() => {
      try {
        driverObj.drive();
      } catch (err) {
        console.warn('Driver.js execution warning:', err);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch {}
      }
    };
  }, [user, profile, forceStart, t, onTourComplete]);

  return null;
}
