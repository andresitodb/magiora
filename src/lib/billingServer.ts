import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/service';
import { requireBillingConfig } from '@/lib/billingConfig';
import { grantsPaidAccess } from '@/lib/billingSubscription';

let stripeClient: Stripe | null = null;

export function getBillingClients() {
  const config = requireBillingConfig();
  stripeClient ??= new Stripe(config.stripeSecretKey);
  return {
    config,
    stripe: stripeClient,
    supabaseAdmin: createServiceClient(),
  };
}

export async function getTrustedSubscription(profileId: string) {
  const supabaseAdmin = createServiceClient();
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select(
      'profile_id, stripe_customer_id, stripe_subscription_id, status, current_period_end'
    )
    .eq('profile_id', profileId)
    .maybeSingle();
  if (error) throw new Error('Unable to read subscription state');
  return data;
}

export async function hasPaidMembership(profileId: string): Promise<boolean> {
  try {
    const subscription = await getTrustedSubscription(profileId);
    return grantsPaidAccess(
      subscription?.status,
      subscription?.current_period_end
    );
  } catch {
    return false;
  }
}
