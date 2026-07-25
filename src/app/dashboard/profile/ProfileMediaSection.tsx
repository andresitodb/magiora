'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import MemberEdition from '@/components/MemberEdition';
import MemberBenefitNotice from '@/components/MemberBenefitNotice';
import {
  canAddProfileGalleryFiles,
  FREE_PROFILE_GALLERY_LIMIT,
  getProfileGalleryPresentation,
  MEMBER_PROFILE_GALLERY_LIMIT,
} from '@/lib/profileGallery';

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
  isMember,
}: {
  userId: string;
  initialHeadshot: string | null;
  initialGallery: string[];
  isMember: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [headshot, setHeadshot] = useState(initialHeadshot);
  const [gallery, setGallery] = useState(initialGallery);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadLimit,
    includedCount,
    canUpload,
  } = getProfileGalleryPresentation(gallery.length, isMember);

  async function uploadHeadshot(file: File) {
    setError(null);
    const validationError = imageValidationError(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    // eslint-disable-next-line react-hooks/purity -- generated only inside the user-triggered upload handler
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
    else {
      setHeadshot(newUrl);
      window.dispatchEvent(
        new CustomEvent('magiora:profile-preview', { detail: { headshotUrl: newUrl } })
      );
    }
    setUploading(false);
    router.refresh();
  }

  async function uploadGalleryImages(files: FileList) {
    setError(null);
    if (!canAddProfileGalleryFiles(gallery.length, files.length, isMember)) {
      setError(
        isMember
          ? `Gallery limit is ${MEMBER_PROFILE_GALLERY_LIMIT} images`
          : `Three gallery images are included. Unlock Member to publish up to ${MEMBER_PROFILE_GALLERY_LIMIT}.`
      );
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
      // eslint-disable-next-line react-hooks/purity -- generated only inside the user-triggered upload handler
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

  async function saveGalleryOrder(next: string[]) {
    setError(null);
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ gallery: next })
      .eq('id', userId);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setGallery(next);
    router.refresh();
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    void saveGalleryOrder(next);
  }

  function makeImagePublic(index: number) {
    if (index < FREE_PROFILE_GALLERY_LIMIT) return;
    const next = [...gallery];
    const [selected] = next.splice(index, 1);
    next.splice(FREE_PROFILE_GALLERY_LIMIT - 1, 0, selected);
    void saveGalleryOrder(next);
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3">
          {error}
        </div>
      )}

      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-serif italic text-sm text-[#993C1D] mb-2">Photo</p>
            <h3 className="font-serif text-xl font-medium">Headshot</h3>
          </div>
          <p className="text-xs font-medium text-stone-500">Saved automatically</p>
        </div>
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
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-serif italic text-sm text-[#993C1D] mb-2">Gallery</p>
            <h3 className="font-serif text-xl font-medium mb-1">
              More photos
              <span className="text-sm text-stone-500 font-normal ml-2">
                {includedCount} / {uploadLimit}{!isMember && ' included'}
              </span>
            </h3>
          </div>
          <p className="mb-1 text-xs font-medium text-stone-500">Saved automatically</p>
        </div>
        <p className="text-xs text-stone-500 italic font-serif mb-4">
          Behind-the-scenes, stills, lifestyle, alternate headshots.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {gallery.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-[4/5] overflow-hidden rounded-md bg-stone-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Profile gallery image ${index + 1}`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5">
                <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                  isMember || index < FREE_PROFILE_GALLERY_LIMIT
                    ? 'bg-white/95 text-stone-800'
                    : 'bg-stone-900/90 text-white'
                }`}>
                  {isMember || index < FREE_PROFILE_GALLERY_LIMIT ? 'Published' : 'Preserved with Member'}
                </span>
                <button
                  type="button"
                  onClick={() => removeGalleryImage(url)}
                  className="rounded bg-black/75 px-2 py-1 text-xs text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                  aria-label={`Remove gallery image ${index + 1}`}
                >
                  Remove
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, -1)}
                    className="rounded bg-white/95 px-2 py-1 text-xs font-medium text-stone-800 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                    aria-label={`Move gallery image ${index + 1} earlier`}
                  >
                    ←
                  </button>
                )}
                {!isMember && index >= FREE_PROFILE_GALLERY_LIMIT && (
                  <button
                    type="button"
                    onClick={() => makeImagePublic(index)}
                    className="rounded bg-white/95 px-2 py-1 text-xs font-medium text-[#712B13] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  >
                    Make public
                  </button>
                )}
                {index < gallery.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, 1)}
                    className="rounded bg-white/95 px-2 py-1 text-xs font-medium text-stone-800 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                    aria-label={`Move gallery image ${index + 1} later`}
                  >
                    →
                  </button>
                )}
              </div>
            </div>
          ))}
          {canUpload && (
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

        {isMember ? (
          <div className="mt-4">
            <MemberBenefitNotice
              title="Member capacity"
              description={`You can publish up to ${MEMBER_PROFILE_GALLERY_LIMIT} gallery images.`}
              usage={`${gallery.length} of ${MEMBER_PROFILE_GALLERY_LIMIT} images used.`}
            />
          </div>
        ) : (
          <MemberEdition
            title="Expand your gallery"
            benefit="Your first 3 gallery images are public. Member lets you publish up to 10."
            isMember={false}
            className="mt-4"
          >
            <p className="text-sm text-stone-600">
              Your included images are published first. Any additional historical images remain saved and available to reorder.
            </p>
          </MemberEdition>
        )}
      </div>
    </div>
  );
}
