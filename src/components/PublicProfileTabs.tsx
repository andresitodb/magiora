'use client';

import { useState } from 'react';
import type { Accent } from '@/lib/profile_themes';

export default function PublicProfileTabs({
  about,
  photos,
  experience,
  contact,
  accent,
}: {
  about: React.ReactNode;
  photos: React.ReactNode;
  experience: React.ReactNode;
  contact: React.ReactNode;
  accent: Accent;
}) {
  const tabs = [
    { id: 'about', label: 'About', content: about },
    { id: 'photos', label: 'Photos', content: photos },
    { id: 'experience', label: 'Experience', content: experience },
    { id: 'contact', label: 'Contact', content: contact },
  ];

  const [active, setActive] = useState(tabs[0].id);
  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div>
      <div
        className="border-b mb-8 hide-scrollbar"
        style={{
          borderColor: accent.border,
          overflowX: 'auto',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
        <nav className="flex gap-6 md:gap-10 -mb-px whitespace-nowrap">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className="pb-3 font-serif text-sm cursor-pointer transition-colors"
                style={{
                  color: isActive ? accent.accent : accent.textMuted,
                  fontWeight: isActive ? 500 : 400,
                  borderBottom: isActive ? `2px solid ${accent.accent}` : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>{activeTab?.content}</div>
    </div>
  );
}
