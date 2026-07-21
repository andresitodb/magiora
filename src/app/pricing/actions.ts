'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBillingClients, getTrustedSubscription } from '@/lib/billingServer';
import { grantsPaidAccess } from '@/lib/billingSubscription';
import { priceIdForPlan, type BillingPlan } from '@/lib/billingConfig';

const pricingError = (message: string) =>
  `/pricing?error=${encodeURIComponent(message)}`;

async function requireBillingUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Fpricing');
  if (!user.email || !user.email_confirmed_at) {
    redirect(pricingError('Confirm your email before managing billing.'));
  }
  return user;
}

async function createPortal(profileId: string) {
  let portalUrl: string | null = null;
  let missingCustomer = false;
  try {
    const { stripe, config } = getBillingClients();
    const subscription = await getTrustedSubscription(profileId);
    if (!subscription?.stripe_customer_id) {
      missingCustomer = true;
    } else {
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${config.siteUrl}/pricing`,
      });
      portalUrl = session.url;
    }
  } catch (error) {
    console.error('[billing] Portal session creation failed', {
      profileId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
  if (missingCustomer) {
    redirect(pricingError('No billing account was found for this membership.'));
  }
  if (!portalUrl) {
    redirect(pricingError('Billing management is temporarily unavailable.'));
  }
  redirect(portalUrl);
}

export async function openBillingPortal() {
  const user = await requireBillingUser();
  await createPortal(user.id);
}

export async function startCheckout(formData: FormData) {
  const submittedPlan = formData.get('plan');
  if (submittedPlan !== 'monthly' && submittedPlan !== 'annual') {
    redirect(pricingError('Choose a valid billing plan.'));
  }
  const plan: BillingPlan = submittedPlan;
  const user = await requireBillingUser();

  let checkoutUrl: string | null = null;
  let shouldOpenPortal = false;
  try {
    const { stripe, config } = getBillingClients();
    const existing = await getTrustedSubscription(user.id);
    shouldOpenPortal = grantsPaidAccess(
      existing?.status,
      existing?.current_period_end
    );

    if (!shouldOpenPortal) {
      const priceId = priceIdForPlan(config, plan);
      const session = await stripe.checkout.sessions.create(
        {
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          ...(existing?.stripe_customer_id
            ? { customer: existing.stripe_customer_id }
            : { customer_email: user.email }),
          client_reference_id: user.id,
          success_url: `${config.siteUrl}/dashboard?checkout=pending`,
          cancel_url: `${config.siteUrl}/pricing?checkout=cancelled`,
          metadata: {
            profile_id: user.id,
            plan,
            environment: config.environment,
          },
          subscription_data: {
            metadata: {
              profile_id: user.id,
              plan,
              environment: config.environment,
            },
          },
        },
        { idempotencyKey: `magiora-checkout-${user.id}-${plan}` }
      );
      checkoutUrl = session.url;
    }
  } catch (error) {
    console.error('[billing] Checkout session creation failed', {
      profileId: user.id,
      plan,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  if (shouldOpenPortal) await createPortal(user.id);
  if (!checkoutUrl) {
    redirect(pricingError('Checkout is temporarily unavailable.'));
  }
  redirect(checkoutUrl);
}
