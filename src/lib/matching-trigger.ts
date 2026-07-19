// Trigger matching for a casting call.
// Called from admin approve action AND can be called manually.

import 'server-only';
import { computeMatchesForCall, notifyMatchedProfiles } from '@/lib/matching';

export async function triggerMatchingForCall(callId: string) {
  try {
    const matches = await computeMatchesForCall(callId);
    const result = await notifyMatchedProfiles(callId, matches);
    console.log(`[matching] call=${callId} matches=${matches.length} notified=${result.notified} emailed=${result.emailed}`);
    return { ok: true, ...result };
  } catch (err: unknown) {
    console.error('[matching] failed:', err);
    return { ok: false, error: String(err) };
  }
}
