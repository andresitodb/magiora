'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const KNOWN_MESSAGES: Record<string, { type: 'success' | 'error' | 'info'; text: string }> = {
  saved: { type: 'success', text: 'Profile saved successfully.' },
  password: { type: 'success', text: 'Password updated successfully.' },
  applied: { type: 'success', text: 'Application sent.' },
  rsvp: { type: 'success', text: 'RSVP confirmed.' },
  subscribed: { type: 'success', text: 'Subscribed to the newsletter.' },
};

export default function Toast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toastKey = searchParams.get('toast');
    const errorMsg = searchParams.get('error');

    let parsed: { type: 'success' | 'error' | 'info'; text: string } | null = null;
    if (errorMsg) {
      parsed = { type: 'error', text: decodeURIComponent(errorMsg) };
    } else if (toastKey) {
      parsed =
        KNOWN_MESSAGES[toastKey] ??
        { type: 'info', text: decodeURIComponent(toastKey) };
    }

    if (parsed) {
      setMessage(parsed);
      // Slight delay before mounting (smooth fade-in)
      requestAnimationFrame(() => setVisible(true));

      // Auto-dismiss after 3.5s
      const dismissTimer = setTimeout(() => setVisible(false), 3500);
      // Remove from DOM after fade-out
      const cleanupTimer = setTimeout(() => setMessage(null), 4000);
      // Clean URL immediately so refresh doesn't re-trigger
      const params = new URLSearchParams(searchParams.toString());
      params.delete('toast');
      params.delete('error');
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });

      return () => {
        clearTimeout(dismissTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [searchParams, pathname, router]);

  if (!message) return null;

  const styles = {
    success: {
      bg: '#dcfce7',
      border: '#86efac',
      text: '#166534',
      icon: '✓',
    },
    error: {
      bg: '#fee2e2',
      border: '#fca5a5',
      text: '#991b1b',
      icon: '✕',
    },
    info: {
      bg: '#FAECE7',
      border: '#FAC775',
      text: '#712B13',
      icon: 'i',
    },
  }[message.type];

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div
        role="status"
        className="flex items-start gap-3 px-4 py-3 rounded-md shadow-lg border min-w-[280px] max-w-md"
        style={{
          backgroundColor: styles.bg,
          borderColor: styles.border,
          color: styles.text,
        }}
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
          style={{ backgroundColor: styles.text, color: styles.bg }}
        >
          {styles.icon}
        </span>
        <p className="font-serif text-sm flex-1">{message.text}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-current opacity-50 hover:opacity-100 cursor-pointer flex-shrink-0"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
