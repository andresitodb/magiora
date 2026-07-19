export function subscriptionProfileId(
  checkoutProfileId: string | null | undefined,
  subscriptionProfileId: string | null | undefined
): string | null {
  return checkoutProfileId || subscriptionProfileId || null;
}

export function isStaleSubscriptionEvent(
  storedSubscriptionId: string | null | undefined,
  eventSubscriptionId: string
): boolean {
  return Boolean(
    storedSubscriptionId && storedSubscriptionId !== eventSubscriptionId
  );
}
