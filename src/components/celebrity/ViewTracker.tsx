'use client';

import { useEffect, useRef } from 'react';
import { recordInteraction } from '@/actions/analytics';

interface ViewTrackerProps {
  celebrityId: string;
  locale: string;
  categorySlug?: string;
  zodiac?: string;
  birthYear?: number;
}

export default function ViewTracker({ 
  celebrityId, 
  locale,
  categorySlug,
  zodiac,
  birthYear 
}: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // Prevent double tracking in React StrictMode (development)
    if (tracked.current) return;
    tracked.current = true;

    // Fire and forget - don't await
    recordInteraction({
      celebrityId,
      type: 'view',
      locale,
      categorySlug,
      zodiac,
      birthYear,
    }).catch((err) => {
      // Silent fail - analytics should never break the page
      console.error('[ViewTracker] Failed to record view:', err);
    });
  }, [celebrityId, locale, categorySlug, zodiac, birthYear]);

  // This component renders nothing
  return null;
}