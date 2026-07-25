import { grantsPaidAccess } from './billingSubscription.ts';

export type MemberEntitlementSource = 'profile_plan' | 'subscription' | 'none';

export type MemberEntitlement = {
  isMember: boolean;
  source: MemberEntitlementSource;
};

export function resolveMemberEntitlement({
  plan,
  subscriptionStatus,
  currentPeriodEnd,
}: {
  plan?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
}): MemberEntitlement {
  if (plan === 'member') return { isMember: true, source: 'profile_plan' };
  if (grantsPaidAccess(subscriptionStatus, currentPeriodEnd)) {
    return { isMember: true, source: 'subscription' };
  }
  return { isMember: false, source: 'none' };
}
