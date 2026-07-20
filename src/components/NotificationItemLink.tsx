'use client';

import Link from 'next/link';

export default function NotificationItemLink({
  id,
  href,
  isUnread,
  className,
  children,
}: {
  id: string;
  href: string;
  isUnread: boolean;
  className: string;
  children: React.ReactNode;
}) {
  function markRead() {
    if (!isUnread) return;
    void fetch('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    });
  }

  return (
    <Link href={href} onClick={markRead} className={className}>
      {children}
    </Link>
  );
}
