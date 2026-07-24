'use client';

import { useEffect, useRef, useState } from 'react';
import MemberEdition from '@/components/MemberEdition';
import {
  TEMPLATES,
  ACCENTS,
  DEFAULT_TEMPLATE,
  DEFAULT_ACCENT,
  type TemplateId,
  type AccentId,
} from '@/lib/profile_themes';

type Accent = (typeof ACCENTS)[number];

export default function ThemeSelector({
  defaultTemplate = DEFAULT_TEMPLATE,
  defaultAccent = DEFAULT_ACCENT,
  isMember,
  displayName,
  headshotUrl,
  role,
  location,
}: {
  defaultTemplate?: TemplateId | string;
  defaultAccent?: AccentId | string;
  isMember: boolean;
  displayName: string;
  headshotUrl?: string | null;
  role: string;
  location: string;
}) {
  const normalizedDefault =
    defaultTemplate === 'polaroid' ? 'portrait' : (defaultTemplate as TemplateId);
  const [template, setTemplate] = useState<TemplateId>(
    isMember ? (normalizedDefault ?? DEFAULT_TEMPLATE) : DEFAULT_TEMPLATE
  );
  const [accent, setAccent] = useState<AccentId>(
    isMember ? ((defaultAccent as AccentId) ?? DEFAULT_ACCENT) : DEFAULT_ACCENT
  );
  const [previewIdentity, setPreviewIdentity] = useState({
    displayName,
    headshotUrl,
    role,
    location,
  });
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const selectedAccent = ACCENTS.find((item) => item.id === accent) ?? ACCENTS[0];

  useEffect(() => {
    const form = document.getElementById('profile-form');
    if (!(form instanceof HTMLFormElement)) return;

    let frame = 0;
    const readProfileFields = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const nameField = form.elements.namedItem('display_name');
        const cityField = form.elements.namedItem('location_city');
        const roleFields = form.querySelectorAll<HTMLInputElement>('input[name="role_titles"]');
        setPreviewIdentity((current) => ({
          ...current,
          displayName: nameField instanceof HTMLInputElement ? nameField.value : current.displayName,
          role: Array.from(roleFields).map((field) => field.value).filter(Boolean).join(' · ') || role,
          location: cityField instanceof HTMLInputElement ? cityField.value : current.location,
        }));
      });
    };
    const handlePortrait = (event: Event) => {
      const detail = (event as CustomEvent<{ headshotUrl?: string }>).detail;
      if (detail?.headshotUrl) {
        setPreviewIdentity((current) => ({ ...current, headshotUrl: detail.headshotUrl }));
      }
    };

    form.addEventListener('input', readProfileFields);
    form.addEventListener('change', readProfileFields);
    window.addEventListener('magiora:profile-preview', handlePortrait);
    return () => {
      window.cancelAnimationFrame(frame);
      form.removeEventListener('input', readProfileFields);
      form.removeEventListener('change', readProfileFields);
      window.removeEventListener('magiora:profile-preview', handlePortrait);
    };
  }, [location, role]);

  return (
    <div className="space-y-6">
      <input type="hidden" name="profile_theme" value={template} />
      <input type="hidden" name="profile_accent" value={accent} />

      <div aria-live="polite">
        <LiveProfilePreview
          template={template}
          accent={selectedAccent}
          displayName={previewIdentity.displayName}
          headshotUrl={previewIdentity.headshotUrl}
          role={previewIdentity.role}
          location={previewIdentity.location}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setFullPreviewOpen(true)}
          className="k-button k-button-secondary"
        >
          Open full preview <span aria-hidden="true">↗</span>
        </button>
      </div>

      <MemberEdition
        title="Profile themes"
        benefit="Preview four visual styles for the public profile that best represents your work."
        isMember={isMember}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEMPLATES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTemplate(item.id)}
              aria-pressed={template === item.id}
              className={`group cursor-pointer rounded-md border p-3 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13] ${
                template === item.id
                  ? 'border-[#712B13] bg-[#FAECE7]/50 shadow-[0_10px_25px_-22px_rgba(113,43,19,0.7)]'
                  : 'border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-400'
              }`}
            >
              <div className="mb-3 overflow-hidden rounded-sm border border-stone-200 bg-stone-50 shadow-sm">
                <TemplatePreview
                  templateId={item.id}
                  accent={selectedAccent}
                  displayName={previewIdentity.displayName}
                  headshotUrl={previewIdentity.headshotUrl}
                />
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-serif text-base font-medium">{item.name}</p>
                <span className="text-[10px] uppercase tracking-[0.15em] text-stone-500">
                  {template === item.id ? 'Previewing' : 'Preview'}
                </span>
              </div>
              <p className="mt-1 font-serif text-xs italic leading-snug text-stone-500">
                {item.description}
              </p>
            </button>
          ))}
        </div>
      </MemberEdition>

      <MemberEdition
        title="Color palettes"
        benefit="Explore six restrained palettes and see the mood of your profile change instantly."
        isMember={isMember}
      >
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {ACCENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAccent(item.id)}
              aria-pressed={accent === item.id}
              aria-label={`${item.name} color palette`}
              className={`cursor-pointer rounded-md border-2 p-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13] ${
                accent === item.id ? 'border-[#712B13]' : 'border-stone-200 hover:border-stone-400'
              }`}
              style={{ backgroundColor: item.bg }}
            >
              <div className="mb-2 flex justify-center gap-1">
                {[item.accent, item.accentSoft, item.card].map((color) => (
                  <span
                    key={color}
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-center font-serif text-xs" style={{ color: item.text }}>{item.name}</p>
            </button>
          ))}
        </div>
      </MemberEdition>

      {fullPreviewOpen && (
        <FullPreviewDialog
          onClose={() => setFullPreviewOpen(false)}
          template={template}
          accent={selectedAccent}
          displayName={previewIdentity.displayName}
          headshotUrl={previewIdentity.headshotUrl}
          role={previewIdentity.role}
          location={previewIdentity.location}
        />
      )}
    </div>
  );
}

function FullPreviewDialog({
  onClose,
  ...preview
}: {
  onClose: () => void;
  template: TemplateId;
  accent: Accent;
  displayName: string;
  headshotUrl?: string | null;
  role: string;
  location: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-stone-950/80 p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="full-preview-title"
      ref={dialogRef}
    >
      <div className="mx-auto min-h-full max-w-6xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="k-eyebrow">Preview only</p>
            <h2 id="full-preview-title" className="font-serif text-lg font-medium">Full profile preview</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="k-button k-button-secondary"
            aria-label="Close full profile preview"
          >
            Close <span aria-hidden="true">×</span>
          </button>
        </header>
        <LiveProfilePreview {...preview} fullPage />
      </div>
    </div>
  );
}

function LiveProfilePreview({
  template,
  accent,
  displayName,
  headshotUrl,
  role,
  location,
  fullPage = false,
}: {
  template: TemplateId;
  accent: Accent;
  displayName: string;
  headshotUrl?: string | null;
  role: string;
  location: string;
  fullPage?: boolean;
}) {
  const cinematic = template === 'cinematic';
  return (
    <section
      className={`${fullPage ? 'border-0' : 'overflow-hidden rounded-md border border-stone-300 bg-white shadow-[0_24px_55px_-42px_rgba(28,25,23,0.8)]'}`}
      aria-label="Live profile preview"
    >
      {!fullPage && <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#712B13]">Live preview</p>
          <p className="mt-0.5 text-xs text-stone-500">Updates as you edit your profile</p>
        </div>
        <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-stone-500">
          {template}
        </span>
      </header>}
      <div
        className={`${fullPage ? 'min-h-[calc(100vh-5rem)] p-6 sm:p-12 lg:p-16' : 'min-h-[26rem] p-6 sm:p-9'} transition-colors`}
        style={{ backgroundColor: cinematic ? accent.overlayBackground : accent.background, color: cinematic ? accent.overlayText : accent.primaryText }}
      >
        <div className="mb-10 flex items-center justify-between text-[10px] uppercase tracking-[0.18em]">
          <span>Magiora portfolio</span>
          <span style={{ color: cinematic ? accent.overlayText : accent.accent }}>Selected work · About</span>
        </div>
        <PortfolioComposition
          template={template}
          accent={accent}
          displayName={displayName}
          headshotUrl={headshotUrl}
          role={role}
          location={location}
          fullPage={fullPage}
        />
        <div className="mt-10 grid grid-cols-3 gap-2 border-t pt-4" style={{ borderColor: accent.border }}>
          {['Selected work', 'Practice', 'Contact'].map((label, index) => (
            <div key={label}>
              <span className="text-[9px] uppercase tracking-[0.14em]" style={{ color: cinematic ? accent.overlayText : accent.secondaryText }}>{label}</span>
              <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: index === 0 ? accent.accent : accent.border }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PortfolioComposition({
  template,
  accent,
  displayName,
  headshotUrl,
  role,
  location,
  fullPage,
}: {
  template: TemplateId;
  accent: Accent;
  displayName: string;
  headshotUrl?: string | null;
  role: string;
  location: string;
  fullPage: boolean;
}) {
  const title = displayName || 'Professional name';
  const practice = role || 'Creative professional';
  const titleClass = `${fullPage ? 'text-5xl sm:text-7xl' : 'text-3xl sm:text-5xl'} font-serif font-medium leading-[0.95] tracking-[-0.03em]`;
  const bio = 'A focused practice shaped by collaboration, craft, and a considered body of moving-image work.';

  if (template === 'cinematic') {
    return (
      <div className="relative overflow-hidden rounded-sm" style={{ backgroundColor: accent.overlayBackground }}>
        <PreviewPortrait src={headshotUrl} name={title} className={`${fullPage ? 'h-[65vh]' : 'h-72'} w-full opacity-75`} />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10" style={{ color: accent.overlayText, background: `linear-gradient(transparent 25%, ${accent.overlayBackground} 100%)` }}>
          <p className="mb-3 text-[10px] uppercase tracking-[0.22em]">Cinematic showcase · {practice}</p>
          <h5 className={titleClass}>{title}</h5>
          <p className="mt-3 max-w-lg text-xs leading-relaxed">{bio}</p>
        </div>
      </div>
    );
  }

  if (template === 'portrait') {
    return (
      <div className="grid overflow-hidden border sm:grid-cols-[1.15fr_0.85fr]" style={{ borderColor: accent.border, backgroundColor: accent.surface }}>
        <PreviewPortrait src={headshotUrl} name={title} className={`${fullPage ? 'min-h-[65vh]' : 'h-72 sm:h-96'} w-full`} />
        <div className="flex flex-col justify-between p-6 sm:p-9">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: accent.accent }}>Full-bleed portrait</p>
            <h5 className={`${titleClass} mt-4`}>{title}</h5>
            <p className="mt-4 text-sm" style={{ color: accent.accent }}>{practice}</p>
            {location && <p className="mt-2 text-xs" style={{ color: accent.secondaryText }}>{location}</p>}
          </div>
          <p className="mt-8 border-t pt-4 text-xs leading-relaxed" style={{ color: accent.secondaryText, borderColor: accent.border }}>{bio}</p>
        </div>
      </div>
    );
  }

  if (template === 'minimalist') {
    return (
      <div className={`${fullPage ? 'py-20' : 'py-8'} mx-auto max-w-3xl text-center`}>
        <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: accent.secondaryText }}>Studio index / 01</p>
        <h5 className={`${titleClass} mt-8`}>{title}</h5>
        <p className="mt-4 text-xs uppercase tracking-[0.2em]" style={{ color: accent.accent }}>{practice}</p>
        <div className="mx-auto my-8 h-px w-16" style={{ backgroundColor: accent.border }} />
        <p className="mx-auto max-w-md text-xs leading-6" style={{ color: accent.secondaryText }}>{bio}</p>
        <div className="mt-10 grid grid-cols-3 gap-3 text-left text-[9px] uppercase tracking-[0.14em]">
          {['Selected work 04', 'Biography', 'Contact'].map((item) => <span key={item} className="border-t pt-2" style={{ borderColor: accent.border }}>{item}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 sm:grid-cols-[0.85fr_1.15fr]">
      <PreviewPortrait src={headshotUrl} name={title} className={`${fullPage ? 'h-[62vh]' : 'h-72'} w-full rounded-sm`} />
      <div className="sm:pt-8">
        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: accent.accent }}>Editorial portfolio · Issue 01</p>
        <h5 className={`${titleClass} mt-4`}>{title}</h5>
        <p className="mt-4 font-serif text-lg italic" style={{ color: accent.accent }}>{practice}</p>
        <p className="mt-8 max-w-lg border-t pt-5 text-xs leading-6" style={{ color: accent.secondaryText, borderColor: accent.border }}>{bio}</p>
        <button type="button" tabIndex={-1} className="mt-8 px-4 py-2 text-xs font-medium" style={{ backgroundColor: accent.buttonBackground, color: accent.buttonText }}>
          View selected work
        </button>
      </div>
    </div>
  );
}

function PreviewPortrait({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className: string;
}) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-stone-200 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-serif text-3xl text-stone-500" aria-hidden="true">
          {(name[0] ?? '?').toUpperCase()}
        </span>
      )}
    </div>
  );
}

function TemplatePreview({
  templateId,
  accent,
  displayName,
  headshotUrl,
}: {
  templateId: TemplateId;
  accent: Accent;
  displayName: string;
  headshotUrl?: string | null;
}) {
  const cinematic = templateId === 'cinematic';
  const centered = templateId === 'portrait' || templateId === 'minimalist';
  return (
    <div
      data-template-preview={templateId}
      className="aspect-[16/10] p-3"
      style={{ backgroundColor: cinematic ? accent.text : accent.bg, color: cinematic ? accent.bg : accent.text }}
    >
      <div className="mb-3 flex items-center justify-between text-[5px] uppercase tracking-[0.18em]">
        <span>Portfolio</span>
        <span style={{ color: cinematic ? accent.textMuted : accent.accent }}>Work&nbsp;&nbsp; About&nbsp;&nbsp; Contact</span>
      </div>
      <div className={`${centered ? 'text-center' : 'grid grid-cols-[0.8fr_1.2fr] items-center gap-3'}`}>
        <PreviewPortrait
          src={headshotUrl}
          name={displayName}
          className={`${centered ? 'mx-auto mb-2 h-14 w-12' : 'h-20 w-full'} ${
            templateId === 'minimalist' ? '!h-11 !w-11 rounded-full' : 'rounded-[2px]'
          }`}
        />
        <div>
          <p className="font-serif text-[11px] font-medium leading-none">{displayName || 'Professional name'}</p>
          <p className="mt-1 text-[5px] uppercase tracking-[0.12em]" style={{ color: accent.accent }}>Selected creative work</p>
          <div className={`${centered ? 'mx-auto' : ''} mt-2 h-px w-8`} style={{ backgroundColor: accent.accent }} />
          <div className={`${centered ? 'mx-auto' : ''} mt-2 space-y-1`}>
            <div className="h-0.5 w-full opacity-30" style={{ backgroundColor: accent.textMuted }} />
            <div className={`${centered ? 'mx-auto' : ''} h-0.5 w-3/4 opacity-30`} style={{ backgroundColor: accent.textMuted }} />
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 border-t pt-2" style={{ borderColor: accent.border }}>
        {[accent.accent, accent.accentSoft, accent.card].map((color) => (
          <div key={color} className="h-5 rounded-[1px]" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}
