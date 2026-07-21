export type BillingPlan = 'monthly' | 'annual';

export interface BillingConfig {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  monthlyPriceId: string;
  annualPriceId: string;
  siteUrl: string;
  supabaseUrl: string;
  serviceRoleKey: string;
  environment: string;
}

export type BillingConfigState =
  | { status: 'disabled'; issues: [] }
  | { status: 'broken'; issues: string[] }
  | { status: 'enabled'; config: BillingConfig; issues: [] };

type BillingEnvironment = Readonly<Record<string, string | undefined>>;

const STRIPE_VARIABLES = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID_MONTHLY',
  'STRIPE_PRICE_ID_ANNUAL',
] as const;

const REQUIRED_VARIABLES = [
  ...STRIPE_VARIABLES,
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export function inspectBillingConfig(
  env: BillingEnvironment = process.env
): BillingConfigState {
  const hasStripeConfiguration = STRIPE_VARIABLES.some((name) => env[name]);
  if (!hasStripeConfiguration) return { status: 'disabled', issues: [] };

  const issues = REQUIRED_VARIABLES.flatMap((name) =>
    env[name]?.trim() ? [] : [`${name} is missing`]
  );
  const secretKey = env.STRIPE_SECRET_KEY?.trim() ?? '';
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim() ?? '';
  const monthlyPriceId = env.STRIPE_PRICE_ID_MONTHLY?.trim() ?? '';
  const annualPriceId = env.STRIPE_PRICE_ID_ANNUAL?.trim() ?? '';
  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim() ?? '';
  const environment = env.VERCEL_ENV ?? env.NODE_ENV ?? 'development';

  if (secretKey && !/^sk_(test|live)_/.test(secretKey)) {
    issues.push('STRIPE_SECRET_KEY has an invalid format');
  }
  if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
    issues.push('STRIPE_WEBHOOK_SECRET has an invalid format');
  }
  if (monthlyPriceId && !monthlyPriceId.startsWith('price_')) {
    issues.push('STRIPE_PRICE_ID_MONTHLY has an invalid format');
  }
  if (annualPriceId && !annualPriceId.startsWith('price_')) {
    issues.push('STRIPE_PRICE_ID_ANNUAL has an invalid format');
  }
  if (monthlyPriceId && monthlyPriceId === annualPriceId) {
    issues.push('Monthly and annual Stripe price IDs must be different');
  }

  if (siteUrl) {
    try {
      const parsed = new URL(siteUrl);
      if (environment === 'production' && parsed.protocol !== 'https:') {
        issues.push('NEXT_PUBLIC_SITE_URL must use HTTPS in production');
      }
    } catch {
      issues.push('NEXT_PUBLIC_SITE_URL must be an absolute URL');
    }
  }
  if (environment !== 'production' && secretKey.startsWith('sk_live_')) {
    issues.push('Live Stripe keys are not allowed outside production');
  }
  if (environment === 'production' && secretKey.startsWith('sk_test_')) {
    issues.push('Stripe test keys are not allowed in production');
  }

  if (issues.length > 0) return { status: 'broken', issues };

  return {
    status: 'enabled',
    issues: [],
    config: {
      stripeSecretKey: secretKey,
      stripeWebhookSecret: webhookSecret,
      monthlyPriceId,
      annualPriceId,
      siteUrl,
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
      environment,
    },
  };
}

export function requireBillingConfig(): BillingConfig {
  const state = inspectBillingConfig();
  if (state.status === 'enabled') return state.config;
  if (state.status === 'disabled') {
    throw new Error('Billing is disabled');
  }
  throw new Error(`Billing configuration is invalid: ${state.issues.join('; ')}`);
}

export function priceIdForPlan(config: BillingConfig, plan: BillingPlan) {
  return plan === 'annual' ? config.annualPriceId : config.monthlyPriceId;
}
