'use client';

import { useState } from 'react';
import MemberEdition from '@/components/MemberEdition';
import MemberBenefitNotice from '@/components/MemberBenefitNotice';

type VideoLink = { label: string; url: string };
const MAX_EXTRA = 4;

export default function VideoLinksManager({
  initialDemoReel,
  initialLinks,
  isMember,
}: {
  initialDemoReel: string | null;
  initialLinks: VideoLink[];
  isMember: boolean;
}) {
  const [demoReel, setDemoReel] = useState(initialDemoReel ?? '');
  const [links, setLinks] = useState<VideoLink[]>(initialLinks ?? []);

  function addLink() {
    if (links.length >= MAX_EXTRA) return;
    setLinks([...links, { label: '', url: '' }]);
  }

  function updateLink(index: number, field: 'label' | 'url', value: string) {
    setLinks(links.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Demo reel
          <span className="text-xs text-stone-500 ml-2 italic font-serif font-normal">
            your main piece — this one is featured
          </span>
        </label>
        <input
          type="url"
          name="demo_reel_url"
          value={demoReel}
          onChange={(e) => setDemoReel(e.target.value)}
          placeholder="https://vimeo.com/yourreel"
          className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
        />
      </div>

      <MemberEdition
        title="Additional clips"
        benefit="Add up to 4 additional portfolio videos."
        isMember={isMember}
      >
        <input
          type="hidden"
          name="video_links"
          value={JSON.stringify(links)}
        />

        {!isMember ? (
          links.length > 0 ? (
            <div className="space-y-2" aria-label="Portfolio videos preserved with Member">
              {links.map((link, index) => (
                <div
                  key={`${link.url}-${index}`}
                  className="rounded-md border border-stone-200 bg-stone-50 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-stone-800">
                      {link.label || `Portfolio video ${index + 1}`}
                    </p>
                    <span className="rounded-full border border-stone-300 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-700">
                      Preserved with Member
                    </span>
                  </div>
                  <p className="mt-1 break-all text-xs text-stone-500">{link.url}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2" aria-label="Preview of four additional portfolio clips">
              {Array.from({ length: MAX_EXTRA }, (_, index) => (
                <div
                  key={index}
                  className="flex min-h-16 items-center gap-3 rounded-md border border-dashed border-stone-300 bg-white px-3 py-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-sm text-stone-500" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-700">Portfolio clip</p>
                    <p className="text-xs text-stone-500">Clip title and portfolio video URL</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div>
        <div className="mb-4">
          <MemberBenefitNotice
            title="Member capacity"
            description={`You can add up to ${MAX_EXTRA} additional portfolio videos.`}
            usage={`${links.length} of ${MAX_EXTRA} additional portfolio videos used.`}
            compact
          />
        </div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">
            More work
            <span className="text-xs text-stone-500 ml-2 italic font-serif font-normal">
              {links.length} / {MAX_EXTRA}
            </span>
          </label>
          {links.length < MAX_EXTRA && (
            <button
              type="button"
              onClick={addLink}
              className="text-xs text-[#712B13] italic font-serif hover:underline cursor-pointer"
            >
              + Add another
            </button>
          )}
        </div>

        {links.length === 0 ? (
          <p className="text-xs text-stone-400 italic font-serif">
            Add up to 4 additional portfolio videos.
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div>
                  <label htmlFor={`portfolio-clip-title-${i}`} className="mb-1 block text-sm font-medium">
                    Clip title
                  </label>
                  <input
                    id={`portfolio-clip-title-${i}`}
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(i, 'label', e.target.value)}
                    placeholder="Scene, commercial, or music video title"
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`portfolio-video-url-${i}`} className="mb-1 block text-sm font-medium">
                    Portfolio video URL
                  </label>
                  <input
                    id={`portfolio-video-url-${i}`}
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(i, 'url', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="px-3 py-2 text-stone-500 hover:text-red-700 cursor-pointer"
                  aria-label={`Remove portfolio video ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
          </div>
        )}
      </MemberEdition>
    </div>
  );
}
