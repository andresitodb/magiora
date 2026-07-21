export const DIRECTORY_PAGE_SIZE = 20;
export const DIRECTORY_RANDOM_POOL_SIZE = 60;
export const HOME_UPCOMING_LIMIT = 3;

export function shouldRandomizeDirectory({
  hasFilters,
  hasExplicitSort,
  page,
}: {
  hasFilters: boolean;
  hasExplicitSort: boolean;
  page: number;
}) {
  return !hasFilters && !hasExplicitSort && page === 1;
}

export function seededSubset<T>(items: readonly T[], limit: number, seed: number): T[] {
  const shuffled = [...items];
  let state = seed | 0;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const swapIndex = Math.abs(state) % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, limit);
}

export function stringSeed(value: string): number {
  let seed = 2166136261;
  for (const character of value) {
    seed ^= character.codePointAt(0) ?? 0;
    seed = Math.imul(seed, 16777619);
  }
  return seed;
}

export function selectUpcomingEvents<T extends { event_date: string }>(
  events: readonly T[],
  nowIso: string
): T[] {
  const now = Date.parse(nowIso);
  return events
    .filter((event) => Date.parse(event.event_date) >= now)
    .sort((a, b) => Date.parse(a.event_date) - Date.parse(b.event_date))
    .slice(0, HOME_UPCOMING_LIMIT);
}

export function projectCountLabel(count: number, countsAvailable: boolean): string | null {
  if (!countsAvailable || count <= 0) return null;
  return `${count} ${count === 1 ? 'project' : 'projects'}`;
}

export function canBrowseCasting(userId: string | null | undefined): boolean {
  return Boolean(userId);
}
