'use client';

import { useEffect, useRef, useState } from 'react';
import { SectionIcons } from '@/components/SectionIcons';
import type { Accent } from '@/lib/profile_themes';

export default function ProfileEmailContact({ email, accent }: { email: string; accent: Accent }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  async function copyEmail() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const input = document.createElement('textarea');
        input.value = email;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copiedWithFallback = document.execCommand('copy');
        input.remove();
        if (!copiedWithFallback) throw new Error('Copy unavailable');
      }
      setCopied(true);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-stretch gap-2">
      <a
        href={`mailto:${email}`}
        className="min-w-0 flex-1 rounded-sm border p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        style={{ borderColor: accent.border }}
      >
        <span className="block text-xs font-medium uppercase tracking-[0.14em]" style={{ color: accent.secondaryText }}>Email</span>
        <span className="mt-1 block break-all font-serif text-lg" style={{ color: accent.accent }}>{email}</span>
      </a>
      <button
        type="button"
        onClick={copyEmail}
        aria-label={`Copy email address ${email}`}
        title="Copy email address"
        className="inline-flex min-w-16 flex-col items-center justify-center gap-1 rounded-sm border px-3 text-xs font-medium transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        style={{ borderColor: accent.border, color: accent.accent }}
      >
        {copied ? <span aria-hidden="true">Copied</span> : SectionIcons.copy}
        <span className="sr-only" aria-live="polite">{copied ? 'Email address copied' : ''}</span>
      </button>
    </div>
  );
}
