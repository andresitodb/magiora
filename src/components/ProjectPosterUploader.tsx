'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProjectPosterUploader({
  userId,
  initialUrl,
}: {
  userId: string;
  initialUrl?: string | null;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large — max 5MB.');
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileName = `${userId}/posters/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('project-media')
        .upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('project-media').getPublicUrl(fileName);
      setUrl(data.publicUrl);
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name="poster_url" value={url ?? ''} />

      <div className="flex items-start gap-4">
        <div
          className="w-32 h-44 bg-[#FAECE7] rounded-md overflow-hidden border border-stone-200 flex-shrink-0"
        >
          {url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={url} alt="Poster" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#993C1D] italic font-serif text-xs text-center px-2">
              No poster
            </div>
          )}
        </div>

        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-stone-800 text-white text-sm py-2 px-4 rounded-md hover:bg-stone-900 disabled:opacity-50 cursor-pointer"
          >
            {uploading ? 'Uploading…' : url ? 'Replace poster' : 'Upload poster'}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => setUrl(null)}
              className="ml-2 text-stone-500 text-sm hover:text-red-700 italic font-serif cursor-pointer"
            >
              Remove
            </button>
          )}
          <p className="text-xs text-stone-500 italic font-serif mt-2">
            Vertical poster works best — 3:4 ratio. Max 5MB.
          </p>
          {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
