'use client';

import { useEffect, useRef, useState } from 'react';
import type { Accent } from '@/lib/profile_themes';

export default function ProfileGalleryLightbox({
  images,
  name,
  accent,
}: {
  images: string[];
  name: string;
  accent: Accent;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        const returnTo = activeIndex;
        setActiveIndex(null);
        window.setTimeout(() => {
          if (returnTo !== null) triggerRefs.current[returnTo]?.focus();
        }, 0);
        return;
      }
      if (event.key === 'ArrowLeft' && images.length > 1) {
        event.preventDefault();
        setActiveIndex((current) => current === null ? 0 : (current - 1 + images.length) % images.length);
        return;
      }
      if (event.key === 'ArrowRight' && images.length > 1) {
        event.preventDefault();
        setActiveIndex((current) => current === null ? 0 : (current + 1) % images.length);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeIndex, images.length]);

  function close() {
    const returnTo = activeIndex;
    setActiveIndex(null);
    window.setTimeout(() => {
      if (returnTo !== null) triggerRefs.current[returnTo]?.focus();
    }, 0);
  }

  return (
    <>
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            ref={(element) => { triggerRefs.current[index] = element; }}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group cursor-zoom-in overflow-hidden rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            aria-label={`Open ${name} gallery image ${index + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${name} gallery image ${index + 1}`}
              className="aspect-[4/5] w-full object-cover object-[50%_25%] transition-opacity duration-200 group-hover:opacity-90 group-focus-visible:opacity-90"
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} gallery viewer`}
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
          style={{ backgroundColor: `${accent.overlayBackground}F2`, color: accent.overlayText }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="absolute right-0 top-0 z-10 rounded-sm border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ borderColor: accent.overlayText }}
              aria-label="Close gallery viewer"
            >
              Close
            </button>
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}
                className="absolute left-0 z-10 rounded-sm border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2"
                style={{ borderColor: accent.overlayText }}
                aria-label="Previous gallery image"
              >
                Previous
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeIndex]}
              alt={`${name} gallery image ${activeIndex + 1} of ${images.length}`}
              className="max-h-[88vh] max-w-[88vw] object-contain"
            />
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
                className="absolute right-0 z-10 rounded-sm border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2"
                style={{ borderColor: accent.overlayText }}
                aria-label="Next gallery image"
              >
                Next
              </button>
            )}
            <p className="absolute bottom-0 text-xs tabular-nums">
              {activeIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
