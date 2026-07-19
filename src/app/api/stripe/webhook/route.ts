import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  isStaleSubscriptionEvent,
  subscriptionProfileId,
} from '@/lib/stripeSubscription';

function getWebhookClients() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    throw new Error('Stripe webhook environment is not configured');
  }

  return {
    stripe: new Stripe(stripeSecretKey),
    webhookSecret,
    supabaseAdmin: createClient(supabaseUrl, serviceRoleKey),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(request: NextRequest) {
  let clients: ReturnType<typeof getWebhookClients>;
  try {
    clients = getWebhookClients();
  } catch (error) {
    console.error('Stripe webhook configuration error:', error);
    return NextResponse.json({ error: 'webhook not configured' }, { status: 503 });
  }

  const { stripe, webhookSecret, supabaseAdmin } = clients;
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    console.error('Webhook signature failed:', errorMessage(err));
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const profileId = subscriptionProfileId(
          session.metadata?.profile_id,
          sub.metadata.profile_id
        );
        if (!profileId) break;
        const subscriptionItem = sub.items.data[0];
        if (!subscriptionItem) break;

        const { error: subscriptionError } = await supabaseAdmin
          .from('subscriptions')
          .upsert(
            {
              profile_id: profileId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: sub.id,
              status: sub.status,
              plan:
                subscriptionItem.price.recurring?.interval === 'year'
                  ? 'member_annual'
                  : 'member_monthly',
              current_period_start: new Date(
                subscriptionItem.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                subscriptionItem.current_period_end * 1000
              ).toISOString(),
            },
            { onConflict: 'profile_id' }
          );
        if (subscriptionError) throw subscriptionError;

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ plan: 'member' })
          .eq('id', profileId);
        if (profileError) throw profileError;

        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const profileId = sub.metadata?.profile_id;
        if (!profileId) break;
        const subscriptionItem = sub.items.data[0];
        if (!subscriptionItem) break;

        const { data: storedSubscription, error: storedLookupError } =
          await supabaseAdmin
            .from('subscriptions')
            .select('stripe_subscription_id')
            .eq('profile_id', profileId)
            .maybeSingle();
        if (storedLookupError) throw storedLookupError;
        if (
          isStaleSubscriptionEvent(
            storedSubscription?.stripe_subscription_id,
            sub.id
          )
        ) {
          break;
        }

        const { error: subscriptionError } = await supabaseAdmin
          .from('subscriptions')
          .upsert(
            {
              profile_id: profileId,
              stripe_customer_id: sub.customer as string,
              stripe_subscription_id: sub.id,
              status: sub.status,
              plan:
                subscriptionItem.price.recurring?.interval === 'year'
                  ? 'member_annual'
                  : 'member_monthly',
              current_period_start: new Date(
                subscriptionItem.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                subscriptionItem.current_period_end * 1000
              ).toISOString(),
              cancel_at: sub.cancel_at
                ? new Date(sub.cancel_at * 1000).toISOString()
                : null,
              canceled_at: sub.canceled_at
                ? new Date(sub.canceled_at * 1000).toISOString()
                : null,
            },
            { onConflict: 'profile_id' }
          );
        if (subscriptionError) throw subscriptionError;

        if (sub.status === 'active' || sub.status === 'trialing') {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ plan: 'member' })
            .eq('id', profileId);
          if (profileError) throw profileError;
        } else {
          const { data: currentSubscription, error: lookupError } =
            await supabaseAdmin
              .from('subscriptions')
              .select('stripe_subscription_id')
              .eq('profile_id', profileId)
              .maybeSingle();
          if (lookupError) throw lookupError;

          if (currentSubscription?.stripe_subscription_id === sub.id) {
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .update({ plan: 'listed' })
              .eq('id', profileId);
            if (profileError) throw profileError;
          }
        }
        break;
      }
    }
  } catch (err: unknown) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
