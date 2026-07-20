'use client';

import { useState, useTransition, useEffect } from 'react';
import { checkSlugAvailability } from '@/app/dashboard/profile/actions';

export default function SlugEditor({
  currentSlug,
  isMember,
}: {
  currentSlug: string;
  isMember: boolean;
}) {
  const [slug, setSlug] = useState(currentSlug);
  const [debounced, setDebounced] = useState(currentSlug);
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged'
  >('unchanged');
  const [, startTransition] = useTransition();

  // HYDRATION FIX: defer the baseUrl until after mount so server and client agree.
  // Server render: shows the public brand domain. Client: replaces with actual origin.
  const [baseUrl, setBaseUrl] = useState('magiora.com/m/');
  useEffect(() => {
    setBaseUrl(`${window.location.host}/m/`);
  }, []);

  // Debounce typing
  useEffect(() => {
    const t = setTimeout(() => setDebounced(slug), 400);
    return () => clearTimeout(t);
  }, [slug]);

  useEffect(() => {
    if (!isMember) return;
    if (debounced === currentSlug) {
      setStatus('unchanged');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(debounced)) {
      setStatus('invalid');
      return;
    }
    setStatus('checking');
    startTransition(async () => {
      const res = await checkSlugAvailability(debounced);
      setStatus(res.available ? 'available' : 'taken');
    });
  }, [debounced, currentSlug, isMember]);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        Your link
        {!isMember && (
          <span className="text-xs text-[#993C1D] ml-2 italic font-serif font-normal">
            🔒 Custom link is a member feature
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
          disabled={!isMember}
          className="flex-1 px-3 py-2 bg-white text-sm focus:outline-none disabled:bg-stone-50 disabled:text-stone-500"
          minLength={3}
          maxLength={30}
        />
      </div>

      {isMember && (
        <div className="mt-1 text-xs italic font-serif min-h-[16px]">
          {status === 'unchanged' && <span className="text-stone-500">Current link.</span>}
          {status === 'checking' && <span className="text-stone-500">Checking availability…</span>}
          {status === 'available' && <span className="text-green-700">✓ Available</span>}
          {status === 'taken' && <span className="text-red-700">Already taken</span>}
          {status === 'invalid' && (
            <span className="text-amber-700">
              3–30 chars, lowercase letters, numbers, hyphens. Must start &amp; end with a letter or number.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
