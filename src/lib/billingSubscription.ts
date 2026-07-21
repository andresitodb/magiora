export const PAID_ACCESS_STATUSES = ['active', 'trialing'] as const;

export function grantsPaidAccess(
  status: string | null | undefined,
  currentPeriodEnd?: string | null,
  now = Date.now()
): boolean {
  if (!status || !PAID_ACCESS_STATUSES.includes(status as (typeof PAID_ACCESS_STATUSES)[number])) {
    return false;
  }
  if (!currentPeriodEnd) return true;
  const end = Date.parse(currentPeriodEnd);
  return Number.isFinite(end) && end > now;
}

export function isOlderStripeEvent(
  storedCreatedAt: string | null | undefined,
  incomingCreatedSeconds: number
): boolean {
  if (!storedCreatedAt) return false;
  return Date.parse(storedCreatedAt) > incomingCreatedSeconds * 1000;
}

export function internalPlanForPrice(
  priceId: string,
  monthlyPriceId: string,
  annualPriceId: string
): 'member_monthly' | 'member_annual' | null {
  if (priceId === monthlyPriceId) return 'member_monthly';
  if (priceId === annualPriceId) return 'member_annual';
  return null;
}
