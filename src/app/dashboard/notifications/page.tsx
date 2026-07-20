import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BackLink from '@/components/BackLink';
import EmptyState from '@/components/EmptyState';
import NotificationItemLink from '@/components/NotificationItemLink';

export const dynamic = 'force-dynamic';

const TYPE_ICON: Record<string, string> = {
  casting_call_match: '🎬',
  interview_invited: '📖',
  application_status_changed: '✉️',
  event_reminder: '📅',
  story_published: '⭐',
};

const DEFAULT_TITLES: Record<string, string> = {
  casting_call_match: 'New casting call match',
  interview_invited: 'You were invited for an interview',
  application_status_changed: 'Application update',
  event_reminder: 'Upcoming event',
  story_published: 'Your Spotlight interview was published',
};

type NotificationPayload = Record<string, unknown> | null;

type NotificationRow = {
  id: string;
  type: string;
  payload: NotificationPayload;
  read_at: string | null;
  created_at: string;
};

function hrefFor(type: string, payload: NotificationPayload): string {
  const id =
    payload?.related_id ??
    payload?.call_id ??
    payload?.interview_id ??
    payload?.event_id ??
    payload?.application_id ??
    payload?.story_id ??
    null;

  switch (type) {
    case 'casting_call_match':
      return id ? `/casting-calls/${id}` : '/dashboard/matches';
    case 'interview_invited':
      return id ? `/dashboard/stories/${id}/answer` : '/dashboard';
    case 'application_status_changed':
      return '/dashboard/applications';
    case 'event_reminder':
      return id ? `/events/${id}` : '/events';
    case 'story_published':
      return id ? `/stories/${id}` : '/stories';
    default:
      return '/dashboard';
  }
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, payload, read_at, created_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="max-w-3xl">
      <BackLink href="/dashboard" label="Dashboard" />

      <div className="mb-8">
        <p className="k-eyebrow mb-2">Activity</p>
        <h1 className="k-section-title">Notifications</h1>
      </div>

      {(!notifications || notifications.length === 0) ? (
        <EmptyState
          icon="inbox"
          title="No notifications yet"
          body="When someone invites you for an interview, a casting call matches your profile, or there's an update on one of your applications — you'll see it here."
        />
      ) : (
        <div className="space-y-2">
          {(notifications as NotificationRow[]).map((n) => {
            const isUnread = !n.read_at;
            const href = hrefFor(n.type, n.payload);
            const title =
              typeof n.payload?.title === 'string'
                ? n.payload.title
                : (DEFAULT_TITLES[n.type] ?? 'Notification');
            const body =
              typeof n.payload?.body === 'string' ? n.payload.body : null;
            return (
              <NotificationItemLink
                key={n.id}
                id={n.id}
                href={href}
                isUnread={isUnread}
                className={`k-card k-card-interactive flex gap-3 p-4 ${
                  isUnread ? 'bg-[#FAECE7]/40 border-[#FAC775]' : 'bg-white border-stone-200'
                } hover:border-[#712B13] transition-colors`}
              >
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg flex-shrink-0">
                  {TYPE_ICON[n.type] ?? '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-medium">{title}</p>
                  {body && (
                    <p className="text-sm text-stone-600 italic font-serif mt-1">{body}</p>
                  )}
                  <p className="text-xs text-stone-400 italic font-serif mt-2">
                    {new Date(n.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {isUnread && (
                  <span className="w-2 h-2 bg-[#712B13] rounded-full mt-2 flex-shrink-0" />
                )}
              </NotificationItemLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
