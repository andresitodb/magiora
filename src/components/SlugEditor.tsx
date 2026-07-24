'use client';

import { useState, useTransition, useEffect, useSyncExternalStore } from 'react';
import { checkSlugAvailability } from '@/app/dashboard/profile/actions';

const subscribeToHost = () => () => {};
const getHost = () => window.location.host;
const getServerHost = () => 'magiora.com';

export default function SlugEditor({
  currentSlug,
  isMember,
}: {
  currentSlug: string;
  isMember: boolean;
}) {
  const [slug, setSlug] = useState(currentSlug);
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged'
  >('unchanged');
  const [, startTransition] = useTransition();

  const host = useSyncExternalStore(subscribeToHost, getHost, getServerHost);
  const baseUrl = `${host}/m/`;

  useEffect(() => {
    if (!isMember) return;
    const timer = setTimeout(() => {
      if (slug === currentSlug) {
        setStatus('unchanged');
        return;
      }
      if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
        setStatus('invalid');
        return;
      }
      setStatus('checking');
      startTransition(async () => {
        const res = await checkSlugAvailability(slug);
        setStatus(res.available ? 'available' : 'taken');
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [slug, currentSlug, isMember]);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        Your link
        {!isMember && (
          <span className="text-xs text-stone-500 ml-2 italic font-serif font-normal">
            Preview
          </span>
        )}
      </label>

      <div className="flex items-stretch border border-stone-300 rounded-md overflow-hidden bg-white">
        <span
          className="px-3 py-2 text-xs text-stone-500 italic font-serif bg-stone-50 border-r border-stone-200 flex items-center"
          suppressHydrationWarning
        >
          {baseUrl}
        </span>
        <input
          type="text"
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          className="min-w-0 flex-1 bg-white px-3 py-2 text-sm focus:outline-none"
          minLength={3}
          maxLength={30}
          aria-describedby={!isMember ? 'member-url-note' : undefined}
        />
      </div>

      <div className="mt-1 min-h-[16px] font-serif text-xs italic">
        {!isMember ? (
          <span id="member-url-note" className="text-stone-500">
            Try your preferred URL. Custom profile URLs are included with Member.
          </span>
        ) : (
          <>
          {status === 'unchanged' && <span className="text-stone-500">Current link.</span>}
          {status === 'checking' && <span className="text-stone-500">Checking availability…</span>}
          {status === 'available' && <span className="text-green-700">✓ Available</span>}
          {status === 'taken' && <span className="text-red-700">Already taken</span>}
          {status === 'invalid' && (
            <span className="text-amber-700">
              3–30 chars, lowercase letters, numbers, hyphens. Must start &amp; end with a letter or number.
            </span>
          )}
          </>
        )}
      </div>
    </div>
  );
}
