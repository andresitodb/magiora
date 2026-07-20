'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const MAX_GALLERY = 10;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function imageValidationError(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Use a JPG, PNG, or WebP image.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image is too large. Maximum size is 10MB.';
  }
  return null;
}

export default function ProfileMediaSection({
  userId,
  initialHeadshot,
  initialGallery,
}: {
  userId: string;
  initialHeadshot: string | null;
  initialGallery: string[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [headshot, setHeadshot] = useState(initialHeadshot);
  const [gallery, setGallery] = useState(initialGallery);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function uploadHeadshot(file: File) {
    setError(null);
    const validationError = imageValidationError(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${userId}/headshot-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('headshots')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }

    const { data: pub } = supabase.storage.from('headshots').getPublicUrl(path);
    const newUrl = pub.publicUrl;

    if (headshot) {
      const oldPath = headshot.split('/headshots/')[1];
      if (oldPath) await supabase.storage.from('headshots').remove([oldPath]);
    }

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ headshot_url: newUrl })
      .eq('id', userId);

    if (updErr) setError(updErr.message);
    else setHeadshot(newUrl);
    setUploading(false);
    router.refresh();
  }

  async function uploadGalleryImages(files: FileList) {
    setError(null);
    if (gallery.length + files.length > MAX_GALLERY) {
      setError(`Gallery limit is ${MAX_GALLERY} images`);
      return;
    }
    const invalidFile = Array.from(files).find(imageValidationError);
    if (invalidFile) {
      setError(imageValidationError(invalidFile));
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${userId}/gallery-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('gallery')
        .upload(path, file);
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      const { data: pub } = supabase.storage.from('gallery').getPublicUrl(path);
      newUrls.push(pub.publicUrl);
    }

    const merged = [...gallery, ...newUrls];
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ gallery: merged })
      .eq('id', userId);

    if (updErr) setError(updErr.message);
    else setGallery(merged);
    setUploading(false);
    router.refresh();
  }

  async function removeGalleryImage(url: string) {
    const next = gallery.filter((u) => u !== url);
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ gallery: next })
      .eq('id', userId);

    if (updErr) {
      setError(updErr.message);
      return;
    }
    setGallery(next);
    const path = url.split('/gallery/')[1];
    if (path) await supabase.storage.from('gallery').remove([path]);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3">
          {error}
        </div>
      )}

      <div>
        <p className="font-serif italic text-sm text-[#993C1D] mb-2">Photo</p>
        <h2 className="font-serif text-xl font-medium mb-4">Headshot</h2>
        <div className="flex gap-6 items-start">
          <div className="w-32 aspect-[4/5] bg-[#FAECE7] rounded-md overflow-hidden flex items-center justify-center">
            {headshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={headshot} alt="Headshot" className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif italic text-xs text-[#712B13]">
                No headshot
              </span>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={headshotInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadHeadshot(f);
              }}
            />
            <button
              type="button"
              onClick={() => headshotInputRef.current?.click()}
              disabled={uploading}
              className="bg-stone-800 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-stone-900 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading…' : headshot ? 'Replace headshot' : 'Upload headshot'}
            </button>
            <p className="text-xs text-stone-500 italic font-serif mt-2 max-w-xs">
              JPG, PNG or WebP up to 10MB. Square crop or 4:5 portrait works best.
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="font-serif italic text-sm text-[#993C1D] mb-2">Gallery</p>
        <h2 className="font-serif text-xl font-medium mb-1">
          More photos
          <span className="text-sm text-stone-500 font-normal ml-2">
            {gallery.length} / {MAX_GALLERY}
          </span>
        </h2>
        <p className="text-xs text-stone-500 italic font-serif mb-4">
          Behind-the-scenes, stills, lifestyle, alternate headshots.
        </p>

        <div className="grid grid-cols-4 gap-3">
          {gallery.map((url) => (
            <div
              key={url}
              className="relative aspect-[4/5] bg-stone-100 rounded-md overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Profile gallery image" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeGalleryImage(url)}
                className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                aria-label="Remove gallery image"
              >
                Remove
              </button>
            </div>
          ))}
          {gallery.length < MAX_GALLERY && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading}
              className="aspect-[4/5] border-2 border-dashed border-stone-300 rounded-md flex items-center justify-center text-stone-400 hover:border-[#712B13] hover:text-[#712B13] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Add gallery images"
            >
              <span className="text-3xl font-light">+</span>
            </button>
          )}
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) uploadGalleryImages(e.target.files);
          }}
        />
      </div>
    </div>
  );
}
