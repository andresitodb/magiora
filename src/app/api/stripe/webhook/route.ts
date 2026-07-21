import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getBillingClients } from '@/lib/billingServer';
import { internalPlanForPrice } from '@/lib/billingSubscription';

type WebhookClaim = 'claimed' | 'completed' | 'busy';

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function eventObjectId(event: Stripe.Event): string | null {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    return typeof session.subscription === 'string'
      ? session.subscription
      : session.id;
  }
  return 'id' in event.data.object && typeof event.data.object.id === 'string'
    ? event.data.object.id
    : null;
}

async function resolveProfileId(
  subscription: Stripe.Subscription,
  supabaseAdmin: ReturnType<typeof getBillingClients>['supabaseAdmin']
): Promise<string | null> {
  if (subscription.metadata.profile_id) return subscription.metadata.profile_id;

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('profile_id')
    .or(
      `stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${String(subscription.customer)}`
    )
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Subscription owner lookup failed');
  return data?.profile_id ?? null;
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  event: Stripe.Event,
  clients: ReturnType<typeof getBillingClients>,
  checkoutProfileId?: string | null
) {
  const item = subscription.items.data[0];
  if (!item) throw new Error('Subscription has no items');
  const profileId =
    checkoutProfileId ??
    (await resolveProfileId(subscription, clients.supabaseAdmin));
  if (!profileId) throw new Error('Subscription owner is unknown');

  const internalPlan = internalPlanForPrice(
    item.price.id,
    clients.config.monthlyPriceId,
    clients.config.annualPriceId
  );
  if (!internalPlan) throw new Error('Subscription uses an unknown Stripe price');

  const { data, error } = await clients.supabaseAdmin.rpc(
    'sync_stripe_subscription',
    {
      p_profile_id: profileId,
      p_customer_id: String(subscription.customer),
      p_subscription_id: subscription.id,
      p_price_id: item.price.id,
      p_plan: internalPlan,
      p_status: subscription.status,
      p_period_start: new Date(item.current_period_start * 1000).toISOString(),
      p_period_end: new Date(item.current_period_end * 1000).toISOString(),
      p_cancel_at_period_end: subscription.cancel_at_period_end,
      p_cancel_at: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
      p_canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      p_event_created_at: new Date(event.created * 1000).toISOString(),
    }
  );
  if (error) throw new Error(`Subscription synchronization failed: ${error.message}`);
  if (data === false) {
    console.info('[billing] Stale Stripe event ignored', {
      eventId: event.id,
      eventType: event.type,
      subscriptionId: subscription.id,
    });
  }
}

export async function POST(request: NextRequest) {
  let clients: ReturnType<typeof getBillingClients>;
  try {
    clients = getBillingClients();
  } catch (error) {
    console.error('[billing] Webhook configuration invalid', {
      message: message(error),
    });
    return NextResponse.json({ error: 'webhook unavailable' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = clients.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      clients.config.stripeWebhookSecret
    );
  } catch (error) {
    console.warn('[billing] Webhook signature rejected', {
      message: message(error),
    });
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const objectId = eventObjectId(event);
  const { data: claim, error: claimError } = await clients.supabaseAdmin.rpc(
    'claim_stripe_webhook_event',
    {
      p_event_id: event.id,
      p_event_type: event.type,
      p_stripe_created_at: new Date(event.created * 1000).toISOString(),
      p_stripe_object_id: objectId,
    }
  );
  if (claimError) {
    console.error('[billing] Webhook event claim failed', {
      eventId: event.id,
      eventType: event.type,
      message: claimError.message,
    });
    return NextResponse.json({ error: 'event ledger unavailable' }, { status: 503 });
  }
  if ((claim as WebhookClaim) === 'completed') {
    console.info('[billing] Duplicate webhook acknowledged', {
      eventId: event.id,
      eventType: event.type,
    });
    return NextResponse.json({ received: true, duplicate: true });
  }
  if ((claim as WebhookClaim) === 'busy') {
    return NextResponse.json({ error: 'event already processing' }, { status: 409 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.subscription !== 'string') {
          throw new Error('Checkout did not contain a subscription');
        }
        const subscription = await clients.stripe.subscriptions.retrieve(
          session.subscription
        );
        await syncSubscription(
          subscription,
          event,
          clients,
          session.metadata?.profile_id
        );
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(
          event.data.object as Stripe.Subscription,
          event,
          clients
        );
        break;
      case 'invoice.paid':
      case 'invoice.payment_failed':
        console.info('[billing] Invoice event recorded; subscription events remain authoritative', {
          eventId: event.id,
          eventType: event.type,
        });
        break;
      default:
        console.info('[billing] Unsupported Stripe event recorded and ignored', {
          eventId: event.id,
          eventType: event.type,
        });
    }

    const { error: finishError } = await clients.supabaseAdmin.rpc(
      'finish_stripe_webhook_event',
      { p_event_id: event.id, p_success: true, p_error_summary: null }
    );
    if (finishError) throw new Error('Unable to complete webhook ledger entry');
  } catch (error) {
    const errorSummary = message(error).slice(0, 500);
    await clients.supabaseAdmin.rpc('finish_stripe_webhook_event', {
      p_event_id: event.id,
      p_success: false,
      p_error_summary: errorSummary,
    });
    console.error('[billing] Webhook processing failed', {
      eventId: event.id,
      eventType: event.type,
      objectId,
      message: errorSummary,
    });
    return NextResponse.json({ error: 'webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
