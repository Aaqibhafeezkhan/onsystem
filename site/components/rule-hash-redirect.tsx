'use client';

import { useEffect } from 'react';

import { ruleFromHash } from '@/lib/site';

/**
 * Sends an old `/rules#<id>` link on to `/rules/<id>`. A fragment never reaches the server, so
 * this runs in the browser; without JavaScript the link still lands on the rule in the list.
 */
export function RuleHashRedirect({ ids }: { ids: string[] }) {
  useEffect(() => {
    const target = ruleFromHash(window.location.hash, ids);
    if (target) window.location.replace(target);
  }, [ids]);
  return null;
}
