'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  related_id: string | null;
  read_at: string | null;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  casting_call_match: '🎬',
  interview_invited: '📖',
  application_status_changed: '✉️',
  event_reminder: '📅',
  story_published: '⭐',
};

const TYPE_HREF: Record<string, (relatedId: string | null) => string> = {
  casting_call_match: (id) => (id ? `/casting-calls/${id}` : '/dashboard/matches'),
  interview_invited: (id) => (id ? `/dashboard/stories/${id}/answer` : '/dashboard'),
  application_status_changed: () => '/dashboard/applications',
  event_reminder: (id) => (id ? `/events/${id}` : '/events'),
  story_published: (id) => (id ? `/stories/${id}` : '/stories'),
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsBell({ unreadCount: initialUnread }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notifId: string) {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ id: notifId }),
      headers: { 'Content-Type': 'application/json' },
    });
    setNotifications((ns) =>
      ns.map((n) => (n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ all: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    setNotifications((ns) =>
      ns.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen && notifications.length === 0) {
            void loadNotifications();
          }
        }}
        aria-label="Notifications"
        className="p-2 rounded-md hover:bg-stone-100 text-stone-700 cursor-pointer relative"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 2C6.5 2 4.5 4 4.5 6.5V9.5L3 12H15L13.5 9.5V6.5C13.5 4 11.5 2 9 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M7 14C7 15 7.9 16 9 16C10.1 16 11 15 11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#712B13] rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute z-20 right-0 mt-1 w-80 border border-stone-200 rounded-md bg-white shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <p className="font-serif font-medium text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs italic font-serif text-stone-500 hover:text-[#712B13]"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-sm text-stone-400 italic font-serif text-center">
                Loading...
              </p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="px-4 py-8 text-sm text-stone-400 italic font-serif text-center">
                Nothing new.
              </p>
            )}
            {!loading &&
              notifications.map((n) => {
                const isUnread = !n.read_at;
                const href = TYPE_HREF[n.type]?.(n.related_id) ?? '/dashboard';
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => {
                      if (isUnread) markAsRead(n.id);
                      setOpen(false);
                    }}
                    className={`flex gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0 hover:bg-[#FAECE7] cursor-pointer ${
                      isUnread ? 'bg-[#FAECE7]/30' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-base flex-shrink-0">
                      {TYPE_ICON[n.type] ?? '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-medium leading-tight">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-stone-500 mt-0.5 italic font-serif line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-xs text-stone-400 mt-1 font-serif italic">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 bg-[#712B13] rounded-full mt-2 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
          </div>

          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-xs italic font-serif text-center text-[#712B13] hover:bg-stone-50 border-t border-stone-100"
          >
            View all →
          </Link>
        </div>
      )}
    </div>
  );
}
