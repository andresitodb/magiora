'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function VerificationDocViewer({ storagePath }: { storagePath: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data, error: e } = await supabase.storage
          .from('verification-docs')
          .createSignedUrl(storagePath, 60 * 10); // 10 minutes
        if (cancelled) return;
        if (e) {
          setError(e.message);
        } else {
          setSignedUrl(data?.signedUrl ?? null);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  if (error) {
    return (
      <div className="aspect-[3/4] bg-stone-900/40 border border-stone-700 rounded flex items-center justify-center p-4">
        <p className="text-xs italic text-red-300 font-serif text-center">
          Couldn&apos;t load image
        </p>
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="aspect-[3/4] bg-stone-800 rounded flex items-center justify-center">
        <p className="text-xs italic text-stone-500 font-serif">Loading…</p>
      </div>
    );
  }

  return (
    <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="block group">
      <div className="aspect-[3/4] bg-stone-800 rounded overflow-hidden border border-stone-700 group-hover:border-amber-400 transition-colors">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signedUrl}
          alt="ID photo"
          className="w-full h-full object-contain"
        />
      </div>
      <p className="text-xs italic font-serif text-stone-500 mt-1 text-center group-hover:text-amber-400">
        Click to open full size ↗
      </p>
    </a>
  );
}
