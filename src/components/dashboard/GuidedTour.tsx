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
  restartCounter: number;
}

export default function GuidedTour({
  user,
  profile,
  restartCounter,
}: GuidedTourProps) {
  const t = useTranslations('tour');
  const driverRef = useRef<Driver | null>(null);
  const initialRunDoneRef = useRef(false);
  const lastHandledRestartRef = useRef(0);

  useEffect(() => {
    if (!profile || !user) return;

    const shouldRunInitial = !profile.has_seen_tutorial && !initialRunDoneRef.current;
    const shouldRunRestart = restartCounter > 0 && restartCounter !== lastHandledRestartRef.current;

    if (!shouldRunInitial && !shouldRunRestart) {
      return;
    }

    if (shouldRunInitial) {
      initialRunDoneRef.current = true;
    }
    if (shouldRunRestart) {
      lastHandledRestartRef.current = restartCounter;
    }

    const markTutorialAsSeen = async () => {
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
    };

    const isAdmin = profile.role === 'admin';

    const steps: DriveStep[] = isAdmin
      ? [
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
            element: '#tour-admin-console',
            popover: {
              title: t('adminConsoleTitle'),
              description: t('adminConsoleDesc'),
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-admin-feed',
            popover: {
              title: t('adminFeedTitle'),
              description: t('adminFeedDesc'),
              side: 'top',
              align: 'center',
            },
          },
        ]
      : [
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

    // Clean up any previous driver instance
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
        markTutorialAsSeen();
        driverObj.destroy();
      },
    });

    driverRef.current = driverObj;

    const timer = setTimeout(() => {
      try {
        driverObj.drive();
      } catch (err) {
        console.warn('Driver.js execution warning:', err);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  }, [user, profile, restartCounter, t]);

  return null;
}
