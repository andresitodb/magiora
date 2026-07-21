alter table public.subscriptions
  add column if not exists stripe_price_id text,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists latest_stripe_event_created_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists subscriptions_stripe_customer_id_uidx
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists subscriptions_stripe_subscription_id_uidx
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  stripe_created_at timestamptz not null,
  stripe_object_id text,
  processing_status text not null default 'processing'
    check (processing_status in ('processing', 'processed', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  first_received_at timestamptz not null default now(),
  last_attempted_at timestamptz not null default now(),
  processed_at timestamptz,
  error_summary text
);

alter table public.stripe_webhook_events enable row level security;

create index if not exists stripe_webhook_events_object_created_idx
  on public.stripe_webhook_events (stripe_object_id, stripe_created_at desc);

create index if not exists stripe_webhook_events_status_idx
  on public.stripe_webhook_events (processing_status, last_attempted_at);

revoke all on table public.stripe_webhook_events from anon, authenticated;

create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_stripe_created_at timestamptz,
  p_stripe_object_id text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  current_attempt timestamptz;
begin
  insert into public.stripe_webhook_events (
    event_id, event_type, stripe_created_at, stripe_object_id
  ) values (
    p_event_id, p_event_type, p_stripe_created_at, p_stripe_object_id
  ) on conflict (event_id) do nothing;

  if found then return 'claimed'; end if;

  select processing_status, last_attempted_at
    into current_status, current_attempt
    from public.stripe_webhook_events
    where event_id = p_event_id
    for update;

  if current_status = 'processed' then return 'completed'; end if;
  if current_status = 'processing' and current_attempt > now() - interval '5 minutes' then
    return 'busy';
  end if;

  update public.stripe_webhook_events
    set processing_status = 'processing',
        attempt_count = attempt_count + 1,
        last_attempted_at = now(),
        error_summary = null
    where event_id = p_event_id;
  return 'claimed';
end;
$$;

revoke all on function public.claim_stripe_webhook_event(text, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook_event(text, text, timestamptz, text)
  to service_role;

create or replace function public.finish_stripe_webhook_event(
  p_event_id text,
  p_success boolean,
  p_error_summary text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.stripe_webhook_events
  set processing_status = case when p_success then 'processed' else 'failed' end,
      processed_at = case when p_success then now() else null end,
      error_summary = case when p_success then null else left(p_error_summary, 500) end,
      last_attempted_at = now()
  where event_id = p_event_id;
$$;

revoke all on function public.finish_stripe_webhook_event(text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.finish_stripe_webhook_event(text, boolean, text)
  to service_role;

create or replace function public.sync_stripe_subscription(
  p_profile_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_price_id text,
  p_plan text,
  p_status text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_cancel_at timestamptz,
  p_canceled_at timestamptz,
  p_event_created_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed boolean := false;
  affected_rows integer := 0;
begin
  insert into public.subscriptions (
    profile_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    plan,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    cancel_at,
    canceled_at,
    latest_stripe_event_created_at,
    updated_at
  ) values (
    p_profile_id,
    p_customer_id,
    p_subscription_id,
    p_price_id,
    p_plan,
    p_status,
    p_period_start,
    p_period_end,
    p_cancel_at_period_end,
    p_cancel_at,
    p_canceled_at,
    p_event_created_at,
    now()
  )
  on conflict (profile_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_price_id = excluded.stripe_price_id,
    plan = excluded.plan,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    cancel_at = excluded.cancel_at,
    canceled_at = excluded.canceled_at,
    latest_stripe_event_created_at = excluded.latest_stripe_event_created_at,
    updated_at = now()
  where public.subscriptions.latest_stripe_event_created_at is null
     or public.subscriptions.latest_stripe_event_created_at <= excluded.latest_stripe_event_created_at;

  get diagnostics affected_rows = row_count;
  changed := affected_rows > 0;

  if changed then
    update public.profiles
      set plan = case
        when p_status in ('active', 'trialing') then 'member'
        else 'listed'
      end
      where id = p_profile_id;
  end if;

  return changed;
end;
$$;

revoke all on function public.sync_stripe_subscription(
  uuid, text, text, text, text, text, timestamptz, timestamptz,
  boolean, timestamptz, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.sync_stripe_subscription(
  uuid, text, text, text, text, text, timestamptz, timestamptz,
  boolean, timestamptz, timestamptz, timestamptz
) to service_role;
