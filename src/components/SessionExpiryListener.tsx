'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { SESSION_EXPIRED_EVENT } from '@/repositories/base/apiControlSheet';

/**
 * Routes to /login when any API call reports a 401.
 *
 * This is a legitimate use of useEffect: subscribing to an external event
 * source and cleaning up on unmount. No setState is involved, so
 * react-hooks/set-state-in-effect does not apply.
 *
 * Using router.replace keeps the SPA transition (and the React tree) intact,
 * unlike the window.location.assign it replaces.
 */
export default function SessionExpiryListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleExpiry = () => {
      const params = new URLSearchParams({ reason: 'expired', redirectTo: pathname });
      router.replace(`/login?${params.toString()}`);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiry);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiry);
  }, [router, pathname]);

  return null;
}
