'use client';

import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface GuidedTourProps {
  user: any;
  hasSeenTutorial: boolean;
  onTourComplete?: () => void;
}

export default function GuidedTour({
  user,
  hasSeenTutorial,
  onTourComplete,
}: GuidedTourProps) {
  const t = useTranslations('tour');
  const locale = useLocale();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasSeenTutorial || hasStartedRef.current) return;
    hasStartedRef.current = true;

    const markTutorialAsSeen = async () => {
      if (user?.id && isSupabaseConfigured()) {
        try {
          await supabase
            .from('profiles')
            .update({ has_seen_tutorial: true })
            .eq('id', user.id);
        } catch (e) {
          console.error('Error updating tutorial flag', e);
        }
      }
      localStorage.setItem('ropelink_has_seen_tutorial', 'true');
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
        element: '#tour-ctas',
        popover: {
          title: t('ctaTitle'),
          description: t('ctaDesc'),
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#tour-stats',
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

    const timer = setTimeout(() => {
      driverObj.drive();
    }, 600);

    return () => {
      clearTimeout(timer);
      driverObj.destroy();
    };
  }, [hasSeenTutorial, user, t, onTourComplete]);

  return null;
}
