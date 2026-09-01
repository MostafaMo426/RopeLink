'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface GuidedTourProps {
  user: any;
  hasSeenTutorial: boolean;
  forceStart?: boolean;
  onTourComplete?: () => void;
}

export default function GuidedTour({
  user,
  hasSeenTutorial,
  forceStart = false,
  onTourComplete,
}: GuidedTourProps) {
  const t = useTranslations('tour');
  const driverInstanceRef = useRef<any>(null);

  useEffect(() => {
    // If returning user and not explicitly restarting, do not auto-launch
    if (hasSeenTutorial && !forceStart) return;

    const markTutorialAsSeen = async () => {
      if (user?.id && isSupabaseConfigured()) {
        try {
          await supabase
            .from('profiles')
            .update({ has_seen_tutorial: true })
            .eq('id', user.id);
        } catch (e) {
          console.warn('Error updating tutorial flag', e);
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
        markTutorialAsSeen();
        driverObj.destroy();
      },
    });

    driverInstanceRef.current = driverObj;

    // Small delay to ensure all DOM elements are mounted and painted
    const timer = setTimeout(() => {
      try {
        driverObj.drive();
      } catch (err) {
        console.warn('Driver.js drive start warning:', err);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (driverInstanceRef.current) {
        driverInstanceRef.current.destroy();
      }
    };
  }, [hasSeenTutorial, forceStart, user, t, onTourComplete]);

  return null;
}
