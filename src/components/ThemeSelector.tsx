'use client';

import { useState } from 'react';
import {
  TEMPLATES,
  ACCENTS,
  DEFAULT_TEMPLATE,
  DEFAULT_ACCENT,
  type TemplateId,
  type AccentId,
} from '@/lib/profile_themes';

export default function ThemeSelector({
  defaultTemplate = DEFAULT_TEMPLATE,
  defaultAccent = DEFAULT_ACCENT,
  isMember,
}: {
  defaultTemplate?: TemplateId | string;
  defaultAccent?: AccentId | string;
  isMember: boolean;
}) {
  // Map legacy 'polaroid' → 'portrait'
  const normalizedDefault =
    defaultTemplate === 'polaroid' ? 'portrait' : (defaultTemplate as TemplateId);

  const [template, setTemplate] = useState<TemplateId>(
    normalizedDefault ?? DEFAULT_TEMPLATE
  );
  const [accent, setAccent] = useState<AccentId>(
    (defaultAccent as AccentId) ?? DEFAULT_ACCENT
  );

  return (
    <div className="space-y-6">
      <input type="hidden" name="profile_theme" value={template} />
      <input type="hidden" name="profile_accent" value={accent} />

      {!isMember && (
        <div className="bg-[#FAEEDA] border border-[#FAC775] rounded-md p-4 text-sm">
          <p className="font-serif italic text-[#993C1D] mb-1">🔒 Member feature</p>
          <p className="font-serif text-stone-700">
            Free profiles use the default Editorial template with Coral colors. Upgrade to choose your own.
          </p>
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-3">Template</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!isMember}
              onClick={() => setTemplate(t.id)}
              className={`text-left p-4 border-2 rounded-md transition-all ${
                template === t.id
                  ? 'border-[#712B13] bg-[#FAECE7]'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              } ${!isMember ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="aspect-[4/5] mb-3 bg-stone-50 rounded border border-stone-200 overflow-hidden">
                <TemplatePreview templateId={t.id} />
              </div>
              <p className="font-serif font-medium text-sm">{t.name}</p>
              <p className="font-serif italic text-xs text-stone-500 mt-1 leading-snug">
                {t.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Color palette</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={!isMember}
              onClick={() => setAccent(a.id)}
              className={`p-3 border-2 rounded-md transition-all ${
                accent === a.id ? 'border-[#712B13]' : 'border-stone-200 hover:border-stone-300'
              } ${!isMember ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ backgroundColor: a.bg }}
            >
              <div className="flex gap-1 justify-center mb-2">
                <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: a.accent }} />
                <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: a.accentSoft }} />
                <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: a.card }} />
              </div>
              <p className="font-serif text-xs text-center" style={{ color: a.text }}>
                {a.name}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ templateId }: { templateId: TemplateId }) {
  switch (templateId) {
    case 'editorial':
      return (
        <svg viewBox="0 0 100 125" className="w-full h-full">
          <rect x="8" y="8" width="38" height="48" fill="#e7e5e4" />
          <line x1="52" y1="14" x2="86" y2="14" stroke="#1c1917" strokeWidth="3" />
          <line x1="52" y1="24" x2="80" y2="24" stroke="#a8a29e" strokeWidth="1.5" />
          <line x1="52" y1="32" x2="86" y2="32" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="52" y1="38" x2="84" y2="38" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="8" y1="70" x2="92" y2="70" stroke="#d6d3d1" strokeWidth="1" />
          <line x1="8" y1="82" x2="80" y2="82" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="8" y1="90" x2="86" y2="90" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="8" y1="98" x2="74" y2="98" stroke="#d6d3d1" strokeWidth="1.5" />
        </svg>
      );
    case 'cinematic':
      return (
        <svg viewBox="0 0 100 125" className="w-full h-full">
          <rect x="0" y="0" width="100" height="70" fill="#1c1917" />
          <rect x="0" y="50" width="100" height="20" fill="#1c1917" opacity="0.5" />
          <line x1="8" y1="60" x2="60" y2="60" stroke="#ffffff" strokeWidth="3" />
          <line x1="8" y1="66" x2="42" y2="66" stroke="#a8a29e" strokeWidth="1.5" />
          <line x1="8" y1="82" x2="92" y2="82" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="8" y1="90" x2="86" y2="90" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="8" y1="98" x2="78" y2="98" stroke="#d6d3d1" strokeWidth="1.5" />
        </svg>
      );
    case 'portrait':
      return (
        <svg viewBox="0 0 100 125" className="w-full h-full">
          {/* photo card with thin border */}
          <rect x="25" y="10" width="50" height="64" fill="#ffffff" stroke="#d6d3d1" strokeWidth="1" />
          <rect x="29" y="14" width="42" height="50" fill="#e7e5e4" />
          {/* name */}
          <line x1="30" y1="84" x2="70" y2="84" stroke="#1c1917" strokeWidth="2.5" />
          {/* role with em-dashes */}
          <line x1="22" y1="92" x2="26" y2="92" stroke="#a8a29e" strokeWidth="1" />
          <line x1="32" y1="92" x2="68" y2="92" stroke="#a8a29e" strokeWidth="1" />
          <line x1="74" y1="92" x2="78" y2="92" stroke="#a8a29e" strokeWidth="1" />
          {/* location */}
          <line x1="38" y1="100" x2="62" y2="100" stroke="#d6d3d1" strokeWidth="1" />
          {/* divider */}
          <line x1="44" y1="110" x2="56" y2="110" stroke="#d6d3d1" strokeWidth="1" />
        </svg>
      );
    case 'minimalist':
      return (
        <svg viewBox="0 0 100 125" className="w-full h-full">
          <circle cx="50" cy="32" r="16" fill="#e7e5e4" />
          <line x1="30" y1="58" x2="70" y2="58" stroke="#1c1917" strokeWidth="2.5" />
          <line x1="35" y1="66" x2="65" y2="66" stroke="#a8a29e" strokeWidth="1" />
          <line x1="40" y1="80" x2="60" y2="80" stroke="#d6d3d1" strokeWidth="1" />
          <line x1="30" y1="92" x2="70" y2="92" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="35" y1="100" x2="65" y2="100" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="30" y1="108" x2="70" y2="108" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="40" y1="116" x2="60" y2="116" stroke="#d6d3d1" strokeWidth="1.5" />
        </svg>
      );
  }
}
