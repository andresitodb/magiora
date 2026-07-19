type NotificationRow = {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

const DEFAULT_TITLES: Record<string, string> = {
  casting_call_match: 'New casting call match',
  interview_invited: 'You were invited for an interview',
  application_status_changed: 'Application update',
  event_reminder: 'Upcoming event',
  story_published: 'Your story was published',
};

export function normalizeNotification(row: NotificationRow) {
  const payload = row.payload ?? {};
  const relatedIdKeys = [
    'related_id',
    'call_id',
    'interview_id',
    'event_id',
    'application_id',
    'story_id',
  ];
  const relatedId = relatedIdKeys
    .map((key) => payload[key])
    .find((value): value is string => typeof value === 'string');

  return {
    id: row.id,
    type: row.type,
    title:
      typeof payload.title === 'string'
        ? payload.title
        : (DEFAULT_TITLES[row.type] ?? 'Notification'),
    body: typeof payload.body === 'string' ? payload.body : null,
    related_id: relatedId ?? null,
    read_at: row.read_at,
    created_at: row.created_at,
  };
}
