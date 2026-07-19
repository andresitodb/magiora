'use server';

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Lazy init — don't crash module load when STRIPE_SECRET_KEY is missing
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Add it to .env.local to enable checkout.'
    );
  }
  _stripe = new Stripe(key);
  return _stripe;
}

export async function startCheckout(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requestedPlan = formData.get('plan');
  const plan = requestedPlan === 'annual' ? 'annual' : 'monthly';
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/pricing?plan=${plan}`)}`);
  }
  const priceId =
    plan === 'annual'
      ? process.env.STRIPE_PRICE_ID_ANNUAL
      : process.env.STRIPE_PRICE_ID_MONTHLY;

  if (!priceId) {
    redirect(`/pricing?error=${encodeURIComponent('Stripe is not yet configured — coming soon.')}`);
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    success_url: `${siteUrl}/dashboard?checkout=success`,
    cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
    metadata: { profile_id: user.id, plan },
    subscription_data: {
      metadata: { profile_id: user.id, plan },
    },
  });

  if (session.url) redirect(session.url);
  redirect(`/pricing?error=${encodeURIComponent('Stripe did not return a checkout URL.')}`);
}
