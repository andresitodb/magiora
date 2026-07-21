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
    <div className="max-w-xl mx-auto text-center">
      <p className="k-eyebrow mb-2">
        The Magiora dispatch
      </p>
      <h2 className="font-serif text-2xl md:text-3xl font-medium text-[var(--magiora-text)]">
        Stories worth following
      </h2>
      <p className="font-serif text-base text-stone-600 mt-2 mb-6">
        A monthly note on the professionals, projects, and films we&apos;re tracking.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
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
          aria-label="Email address"
          className="k-control flex-1"
        />
        <button
          type="submit"
          className="k-button k-button-primary whitespace-nowrap"
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
