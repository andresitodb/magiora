'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProjectGalleryUploader({
  userId,
  initialGallery,
}: {
  userId: string;
  initialGallery: string[];
}) {
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList) {
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} is over 5MB — skipped.`);
          continue;
        }
        if (!file.type.startsWith('image/')) continue;
        const ext = file.name.split('.').pop() ?? 'jpg';
        const fileName = `${userId}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('project-media')
          .upload(fileName, file, { upsert: false });
        if (upErr) {
          setError(upErr.message);
          continue;
        }
        const { data } = supabase.storage.from('project-media').getPublicUrl(fileName);
        newUrls.push(data.publicUrl);
      }
      setGallery([...gallery, ...newUrls]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setGallery(gallery.filter((u) => u !== url));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setGallery(next);
  }

  return (
    <div>
      <input type="hidden" name="gallery" value={JSON.stringify(gallery)} />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files);
          }
        }}
        className="hidden"
      />

      {gallery.length === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full py-8 border-2 border-dashed border-stone-300 rounded-md hover:border-[#712B13] hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <p className="font-serif italic text-sm text-stone-500">
            {uploading ? 'Uploading…' : '+ Add gallery photos (up to 5MB each)'}
          </p>
        </button>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
            {gallery.map((url, i) => (
              <div key={url} className="relative group aspect-square bg-stone-100 rounded overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    className="bg-white text-stone-900 w-7 h-7 rounded text-xs hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                    aria-label="Move left"
                    title="Move left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === gallery.length - 1}
                    className="bg-white text-stone-900 w-7 h-7 rounded text-xs hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                    aria-label="Move right"
                    title="Move right"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="bg-red-600 text-white w-7 h-7 rounded text-xs hover:bg-red-700 cursor-pointer"
                    aria-label="Remove"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-[#712B13] text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                    First
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm italic font-serif text-[#712B13] hover:underline cursor-pointer disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : '+ Add more photos'}
          </button>
        </>
      )}

      {error && (
        <p className="text-xs text-red-700 mt-2">{error}</p>
      )}
    </div>
  );
}
