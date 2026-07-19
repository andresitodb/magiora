'use client';

import { useTransition } from 'react';
import { setLocaleCookie } from './locale-action';

export default function LocaleSwitcher({ currentLocale }: { currentLocale: 'en' | 'es' }) {
  const [pending, startTransition] = useTransition();
  const next = currentLocale === 'en' ? 'es' : 'en';

  return (
    <button
      type="button"
      onClick={() => startTransition(() => setLocaleCookie(next))}
      disabled={pending}
      className="text-xs px-2 py-1 border border-[#712B13] text-[#712B13] rounded hover:bg-[#FAECE7] disabled:opacity-50 cursor-pointer transition-colors"
      title={`Switch to ${next === 'es' ? 'Español' : 'English'}`}
    >
      {currentLocale === 'en' ? 'ES' : 'EN'}
    </button>
  );
}
