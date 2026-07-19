'use client';

import { useState } from 'react';

type VideoLink = { label: string; url: string };
const MAX_EXTRA = 4;

export default function VideoLinksManager({
  initialDemoReel,
  initialLinks,
}: {
  initialDemoReel: string | null;
  initialLinks: VideoLink[];
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

      <div>
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

        {/* Hidden field carrying the serialized links */}
        <input type="hidden" name="video_links" value={JSON.stringify(links)} />

        {links.length === 0 ? (
          <p className="text-xs text-stone-400 italic font-serif">
            Add up to {MAX_EXTRA} extra clips (scenes, music videos, commercials, behind-the-scenes...)
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(i, 'label', e.target.value)}
                  placeholder="Label (e.g. Music video — Bad Bunny)"
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(i, 'url', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="px-3 py-2 text-stone-500 hover:text-red-700 cursor-pointer"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
