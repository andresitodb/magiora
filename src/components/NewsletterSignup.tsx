'use client';

import { useState, useTransition } from 'react';
import { signUpNewsletter } from '@/app/newsletter/actions';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'duplicate'>('idle');
  const [message, setMessage] = useState('');
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      const result = await signUpNewsletter(email.trim());
      setStatus(result.status);
      setMessage(result.message);
      if (result.status === 'success') setEmail('');
    });
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <p className="font-serif italic text-xs text-[#993C1D] uppercase tracking-widest mb-2">
        The Magiora dispatch
      </p>
      <p className="font-serif text-base text-stone-700 mb-4">
        A monthly note on the professionals, projects, and films we&apos;re tracking.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          required
          autoCapitalize="none"
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
        />
        <button
          type="submit"
          className="bg-[#712B13] text-white px-5 py-2 rounded-md font-medium text-sm hover:bg-[#4A1B0C] cursor-pointer whitespace-nowrap"
        >
          Subscribe
        </button>
      </form>

      {status === 'success' && (
        <p className="font-serif italic text-sm text-green-700 mt-3">{message}</p>
      )}
      {status === 'duplicate' && (
        <p className="font-serif italic text-sm text-stone-500 mt-3">{message}</p>
      )}
      {status === 'error' && (
        <p className="font-serif italic text-sm text-red-700 mt-3">{message}</p>
      )}
    </div>
  );
}
