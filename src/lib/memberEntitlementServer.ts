import { createClient } from '@/lib/supabase/server';
import {
  resolveMemberEntitlement,
  type MemberEntitlement,
} from '@/lib/memberEntitlement';

export async function getMemberEntitlement(profileId: string): Promise<MemberEntitlement> {
  try {
    const supabase = await createClient();
    const [{ data: profile }, { data: subscription }] = await Promise.all([
      supabase.from('profiles').select('plan').eq('id', profileId).maybeSingle(),
      supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('profile_id', profileId)
        .maybeSingle(),
    ]);
    return resolveMemberEntitlement({
      plan: profile?.plan,
      subscriptionStatus: subscription?.status,
      currentPeriodEnd: subscription?.current_period_end,
    });
  } catch {
    return { isMember: false, source: 'none' };
  }
}

export async function hasMemberEntitlement(profileId: string): Promise<boolean> {
  return (await getMemberEntitlement(profileId)).isMember;
}
