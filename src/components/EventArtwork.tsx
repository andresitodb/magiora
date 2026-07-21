'use client';

import { useState } from 'react';
import { shouldShowEventImage } from '@/lib/eventArtwork';

export default function EventArtwork({
  imageUrl,
  title,
  eventDate,
  className = '',
}: {
  imageUrl: string | null;
  title: string;
  eventDate: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const start = new Date(eventDate);
  const showImage = shouldShowEventImage(imageUrl, failed);

  return (
    <div className={`aspect-[16/10] overflow-hidden bg-[var(--magiora-soft)] ${className}`}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt={`${title} event artwork`}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center border-b border-[var(--magiora-border)] text-center font-serif text-[var(--magiora-brand)]">
          <span className="text-xs italic uppercase tracking-[0.16em]">
            {start.toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="mt-1 text-4xl leading-none">
            {start.toLocaleDateString('en-US', { day: 'numeric' })}
          </span>
          <span className="mt-2 max-w-[80%] text-xs italic text-stone-500">Event &amp; screening</span>
        </div>
      )}
    </div>
  );
}
