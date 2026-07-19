'use client';

import { useState, useEffect } from 'react';

export default function ProjectGalleryCarousel({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIndex(null);
      if (e.key === 'ArrowRight') {
        setOpenIndex((i) => (i !== null ? Math.min(images.length - 1, i + 1) : i));
      }
      if (e.key === 'ArrowLeft') {
        setOpenIndex((i) => (i !== null ? Math.max(0, i - 1) : i));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="aspect-square bg-[#FAECE7] rounded-md overflow-hidden cursor-pointer group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${title} — gallery ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex(null);
            }}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl cursor-pointer leading-none"
          >
            ×
          </button>

          {openIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex((i) => Math.max(0, (i ?? 0) - 1));
              }}
              aria-label="Previous"
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl cursor-pointer"
            >
              ‹
            </button>
          )}

          {openIndex < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex((i) => Math.min(images.length - 1, (i ?? 0) + 1));
              }}
              aria-label="Next"
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl cursor-pointer"
            >
              ›
            </button>
          )}

          <div className="max-w-[90vw] max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[openIndex]}
              alt={`${title} — gallery ${openIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain"
            />
            <p className="text-center text-white/60 text-xs italic font-serif mt-2">
              {openIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
