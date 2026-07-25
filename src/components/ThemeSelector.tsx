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
import {
  mergeProfilePreviewData,
  parsePreviewJson,
  type ProfilePreviewData,
  type PreviewCredit,
  type PreviewRecommendation,
} from '@/lib/profilePreview';

type Accent = (typeof ACCENTS)[number];

export default function ThemeSelector({
  defaultTemplate = DEFAULT_TEMPLATE,
  defaultAccent = DEFAULT_ACCENT,
  isMember,
  initialData,
}: {
  defaultTemplate?: TemplateId | string;
  defaultAccent?: AccentId | string;
  isMember: boolean;
  initialData: ProfilePreviewData;
}) {
  const normalizedDefault =
    defaultTemplate === 'polaroid' ? 'portrait' : (defaultTemplate as TemplateId);
  const [template, setTemplate] = useState<TemplateId>(
    isMember ? (normalizedDefault ?? DEFAULT_TEMPLATE) : DEFAULT_TEMPLATE
  );
  const [accent, setAccent] = useState<AccentId>(
    isMember ? ((defaultAccent as AccentId) ?? DEFAULT_ACCENT) : DEFAULT_ACCENT
  );
  const [previewData, setPreviewData] = useState(initialData);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const selectedAccent = ACCENTS.find((item) => item.id === accent) ?? ACCENTS[0];
  const preservedTemplate = TEMPLATES.find((item) => item.id === normalizedDefault);
  const preservedAccent = ACCENTS.find((item) => item.id === defaultAccent);
  const hasPreservedPresentation =
    !isMember &&
    (
      (normalizedDefault && normalizedDefault !== DEFAULT_TEMPLATE) ||
      (defaultAccent && defaultAccent !== DEFAULT_ACCENT)
    );

  useEffect(() => {
    const form = document.getElementById('profile-form');
    if (!(form instanceof HTMLFormElement)) return;

    let frame = 0;
    const readProfileFields = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const formData = new FormData(form);
        setPreviewData((stored) =>
          mergeProfilePreviewData(stored, {
            displayName: String(formData.get('display_name') ?? ''),
            roles: formData.getAll('role_titles').map(String).filter(Boolean),
            city: String(formData.get('location_city') ?? ''),
            state: String(formData.get('location_state') ?? ''),
            bio: String(formData.get('bio') ?? ''),
            languages: formData.getAll('languages').map(String).filter(Boolean),
            skills: formData.getAll('skills').map(String).filter(Boolean),
            demoReelUrl: String(formData.get('demo_reel_url') ?? ''),
            experience: parsePreviewJson<PreviewCredit[]>(
              formData.get('experience'),
              stored.experience
            ),
            recommendations: parsePreviewJson<PreviewRecommendation[]>(
              formData.get('recommendations'),
              stored.recommendations
            ),
            socialLinks: parsePreviewJson<Record<string, string>>(
              formData.get('social_links'),
              stored.socialLinks
            ),
          })
        );
      });
    };
    const handlePortrait = (event: Event) => {
      const detail = (event as CustomEvent<{ headshotUrl?: string }>).detail;
      const newHeadshotUrl = detail?.headshotUrl;
      if (newHeadshotUrl) {
        setPreviewData((current) => ({ ...current, headshotUrl: newHeadshotUrl }));
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
  }, []);

  return (
    <div className="space-y-6">
      <input type="hidden" name="profile_theme" value={template} />
      <input type="hidden" name="profile_accent" value={accent} />

      {hasPreservedPresentation && (
        <div
          className="rounded-md border border-stone-300 bg-stone-50 p-4"
          role="status"
          aria-label="Member profile presentation preserved"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-700">
            Preserved with Member
          </p>
          <p className="mt-1 font-serif text-sm leading-relaxed text-stone-700">
            {preservedTemplate?.name ?? 'Your selected profile theme'}
            {' · '}
            {preservedAccent?.name ?? 'Your selected color palette'} will be available again with Member.
          </p>
        </div>
      )}

      <MemberEdition
        title="Profile themes"
        benefit="Explore six complete portfolio directions and preview each one with your own work."
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
              <div className="mb-3 overflow-hidden rounded-sm border border-stone-200 shadow-sm">
                <TemplateMiniature
                  template={item.id}
                  accent={selectedAccent}
                  data={previewData}
                />
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-serif text-base font-medium">{item.name}</p>
                <span className="text-[10px] uppercase tracking-[0.15em] text-stone-500">
                  {template === item.id ? 'Selected' : 'Preview'}
                </span>
              </div>
              <p className="mt-1 font-serif text-xs italic leading-snug text-stone-500">
                {item.description}
              </p>
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end border-t border-stone-200 pt-4">
          <button
            type="button"
            onClick={() => setFullPreviewOpen(true)}
            className="k-button k-button-secondary"
            aria-label={`Open full preview of ${TEMPLATES.find((item) => item.id === template)?.name ?? 'selected profile template'}`}
          >
            Open full preview <span aria-hidden="true">↗</span>
          </button>
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
              style={{ backgroundColor: item.background }}
            >
              <div className="mb-2 flex justify-center gap-1">
                {[item.accent, item.accentSoft, item.surface].map((color) => (
                  <span key={color} className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                ))}
              </div>
              <p className="text-center font-serif text-xs" style={{ color: item.primaryText }}>{item.name}</p>
            </button>
          ))}
        </div>
      </MemberEdition>

      {fullPreviewOpen && (
        <FullPreviewDialog
          onClose={() => setFullPreviewOpen(false)}
          template={template}
          accent={selectedAccent}
          data={previewData}
        />
      )}
    </div>
  );
}

function FullPreviewDialog({
  onClose,
  template,
  accent,
  data,
}: {
  onClose: () => void;
  template: TemplateId;
  accent: Accent;
  data: ProfilePreviewData;
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
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
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
            <h2 id="full-preview-title" className="font-serif text-lg font-medium">
              {TEMPLATES.find((item) => item.id === template)?.name}
            </h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="k-button k-button-secondary" aria-label="Close full profile preview">
            Close <span aria-hidden="true">×</span>
          </button>
        </header>
        <CompleteProfileSite template={template} accent={accent} data={data} />
      </div>
    </div>
  );
}

function TemplateMiniature({
  template,
  accent,
  data,
}: {
  template: TemplateId;
  accent: Accent;
  data: ProfilePreviewData;
}) {
  const name = data.displayName || 'Your name';
  const role = data.roles[0] || 'Your practice';
  const image = data.gallery[0] || data.headshotUrl;
  const project = data.projects[0]?.title || data.experience[0]?.production || data.experience[0]?.title || 'Selected work';
  const bio = data.bio || 'Your biography will shape this page.';
  const shared = { backgroundColor: accent.background, color: accent.primaryText };

  if (template === 'cinematic') {
    return (
      <div data-template-layout="cinematic-title-sequence" className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: accent.overlayBackground }}>
        <PreviewImage src={image} name={name} accent={accent} className="absolute inset-0 h-full w-full opacity-70" />
        <div className="absolute inset-0 flex flex-col justify-between p-3" style={{ color: accent.overlayText, background: `linear-gradient(transparent 20%, ${accent.overlayBackground} 100%)` }}>
          <span className="text-[5px] uppercase tracking-[0.22em]">Reel · Projects</span>
          <div><p className="text-[5px] uppercase tracking-[0.2em]">{role}</p><p className="mt-1 font-serif text-lg leading-none">{name}</p><p className="mt-1 text-[6px]">{project}</p></div>
        </div>
      </div>
    );
  }
  if (template === 'editorial') {
    return (
      <div data-template-layout="editorial-columns" className="aspect-[16/10] p-3" style={shared}>
        <div className="flex justify-between border-b pb-1 text-[5px] uppercase tracking-[0.2em]" style={{ borderColor: accent.border }}><span>Profile journal</span><span>Issue 01</span></div>
        <div className="mt-2 grid grid-cols-[0.8fr_1.2fr] gap-3">
          <PreviewImage src={data.headshotUrl} name={name} accent={accent} className="h-20 w-full" />
          <div><p className="font-serif text-base leading-none">{name}</p><p className="mt-1 text-[6px]" style={{ color: accent.accent }}>{role}</p><p className="mt-2 line-clamp-3 text-[6px] leading-relaxed" style={{ color: accent.secondaryText }}>{bio}</p></div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-1 text-[5px]" style={{ borderColor: accent.border }}><span>Credits · {data.experience.length}</span><span>{project}</span></div>
      </div>
    );
  }
  if (template === 'portrait') {
    return (
      <div data-template-layout="portrait-split" className="grid aspect-[16/10] grid-cols-[1.15fr_0.85fr]" style={shared}>
        <PreviewImage src={data.headshotUrl} name={name} accent={accent} className="h-full w-full" />
        <div className="flex flex-col justify-between p-3" style={{ backgroundColor: accent.surface }}><span className="text-[5px] uppercase tracking-[0.18em]" style={{ color: accent.accent }}>Portrait</span><div><p className="font-serif text-sm leading-none">{name}</p><p className="mt-1 text-[6px]" style={{ color: accent.secondaryText }}>{role}</p></div><span className="text-[5px]">{[data.city, data.state].filter(Boolean).join(', ')}</span></div>
      </div>
    );
  }
  if (template === 'minimalist') {
    return (
      <div data-template-layout="quiet-index" className="aspect-[16/10] p-4 text-center" style={shared}>
        <p className="text-[5px] uppercase tracking-[0.28em]">Index / 01</p><p className="mt-7 font-serif text-lg">{name}</p><p className="mt-1 text-[5px] uppercase tracking-[0.2em]" style={{ color: accent.accent }}>{role}</p>
        <div className="mt-6 grid grid-cols-3 gap-2 border-t pt-2 text-left text-[5px]" style={{ borderColor: accent.border }}><span>Work {data.projects.length}</span><span>Credits {data.experience.length}</span><span>Contact</span></div>
      </div>
    );
  }
  if (template === 'stage') {
    return (
      <div data-template-layout="stage-bill" className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: accent.overlayBackground, color: accent.overlayText }}>
        <PreviewImage src={data.headshotUrl} name={name} accent={accent} className="absolute right-0 h-full w-1/2 opacity-80" />
        <div className="relative flex h-full w-3/5 flex-col justify-between p-3"><span className="font-serif text-[7px] italic">Tonight / On stage</span><div><p className="font-serif text-xl leading-[0.85]">{name}</p><p className="mt-2 text-[6px] uppercase tracking-[0.18em]">{role}</p></div><span className="text-[5px]">{data.experience[0]?.production || data.experience[0]?.title || 'Performance credits'}</span></div>
      </div>
    );
  }
  return (
    <div data-template-layout="studio-case-studies" className="aspect-[16/10] p-3" style={shared}>
      <div className="flex justify-between text-[5px] uppercase tracking-[0.18em]"><span>{name} / Studio</span><span>Work · Services</span></div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[image, data.gallery[1], data.projects[0]?.poster_url].map((src, index) => (
          <div key={index}><PreviewImage src={src} name={name} accent={accent} className="h-14 w-full" /><p className="mt-1 truncate text-[5px]">{index === 0 ? project : data.skills[index] || 'Case study'}</p></div>
        ))}
      </div>
      <div className="mt-3 flex gap-1">{data.skills.slice(0, 4).map((skill) => <span key={skill} className="border px-1 py-0.5 text-[4px]" style={{ borderColor: accent.border }}>{skill}</span>)}</div>
    </div>
  );
}

function CompleteProfileSite({
  template,
  accent,
  data,
}: {
  template: TemplateId;
  accent: Accent;
  data: ProfilePreviewData;
}) {
  const name = data.displayName || 'Your name';
  const role = data.roles[0] || 'Your professional practice';
  const location = [data.city, data.state].filter(Boolean).join(', ');
  const image = data.gallery[0] || data.headshotUrl;
  const bio = data.bio || 'Add a biography to introduce your practice and the work that matters to you.';
  const isDark = template === 'cinematic' || template === 'stage';
  const pageStyle = {
    backgroundColor: isDark ? accent.overlayBackground : accent.background,
    color: isDark ? accent.overlayText : accent.primaryText,
  };

  return (
    <article className="min-h-[calc(100vh-5rem)]" style={pageStyle} data-full-template={template}>
      <header className="flex items-center justify-between border-b px-5 py-4 text-xs uppercase tracking-[0.16em] sm:px-10" style={{ borderColor: accent.border }}>
        <span>{name}</span>
        <span>{template === 'stage' ? 'Appearances · Credits · Contact' : 'Work · About · Contact'}</span>
      </header>

      <TemplateHero template={template} accent={accent} data={data} name={name} role={role} location={location} image={image} bio={bio} />

      <div className="space-y-14 px-5 py-12 sm:px-10 lg:px-16">
        <section className={`${template === 'editorial' ? 'grid gap-8 md:grid-cols-[0.7fr_1.3fr]' : 'max-w-3xl'}`}>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: isDark ? accent.overlayText : accent.accent }}>Biography</p>
          <p className="mt-3 font-serif text-xl leading-relaxed md:mt-0 md:text-2xl">{bio}</p>
        </section>

        <section>
          <SectionHeading label={template === 'stage' ? 'Performance & appearances' : 'Selected work'} accent={accent} />
          {(data.projects.length > 0 || data.gallery.length > 0) ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(data.projects.length ? data.projects : data.gallery.map((url) => ({ title: 'Gallery', tagline: null, poster_url: url }))).slice(0, 6).map((project, index) => (
                <div key={`${project.title}-${index}`} className="overflow-hidden border" style={{ backgroundColor: accent.surface, borderColor: accent.border, color: accent.primaryText }}>
                  <PreviewImage src={project.poster_url || data.gallery[index]} name={project.title} accent={accent} className="aspect-[4/3] w-full" />
                  <div className="p-4"><h3 className="font-serif text-lg">{project.title}</h3>{project.tagline && <p className="mt-1 text-sm" style={{ color: accent.secondaryText }}>{project.tagline}</p>}</div>
                </div>
              ))}
            </div>
          ) : <EmptyPreview>Projects and gallery images will appear here.</EmptyPreview>}
        </section>

        <section className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading label="Credits & experience" accent={accent} />
            {data.experience.length ? data.experience.slice(0, 6).map((credit, index) => (
              <div key={index} className="grid grid-cols-[4rem_1fr] gap-4 border-b py-3" style={{ borderColor: accent.border }}>
                <span className="text-sm" style={{ color: isDark ? accent.overlayText : accent.secondaryText }}>{credit.year || '—'}</span>
                <div><p className="font-serif">{credit.production || credit.title || credit.project}</p>{credit.role && <p className="text-sm" style={{ color: isDark ? accent.overlayText : accent.secondaryText }}>{credit.role}</p>}</div>
              </div>
            )) : <EmptyPreview>Add credits to build your professional timeline.</EmptyPreview>}
          </div>
          <div>
            <SectionHeading label="Practice" accent={accent} />
            <TokenList values={[...data.skills, ...data.languages].slice(0, 12)} accent={accent} />
            {data.demoReelUrl ? <p className="mt-6 font-serif text-lg">▶ Demo reel available</p> : <EmptyPreview>Your demo reel will be featured here.</EmptyPreview>}
          </div>
        </section>

        <section>
          <SectionHeading label="Recommendations" accent={accent} />
          {data.recommendations.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {data.recommendations.slice(0, 4).map((recommendation, index) => (
                <blockquote key={index} className="border-l-2 pl-5">
                  <p className="font-serif text-lg italic">“{recommendation.quote}”</p>
                  <footer className="mt-3 text-sm" style={{ color: isDark ? accent.overlayText : accent.secondaryText }}>{recommendation.from_name}{recommendation.from_role ? ` · ${recommendation.from_role}` : ''}</footer>
                </blockquote>
              ))}
            </div>
          ) : <EmptyPreview>Collaborator recommendations will appear here.</EmptyPreview>}
        </section>

        <footer className="flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: accent.border }}>
          <div><p className="font-serif text-2xl">{name}</p><p className="text-sm">{location || role}</p></div>
          {Object.entries(data.socialLinks).filter(([, value]) => value).length ? (
            <div className="flex flex-wrap gap-3 text-sm">{Object.entries(data.socialLinks).filter(([, value]) => value).slice(0, 5).map(([network]) => <span key={network} className="capitalize">{network}</span>)}</div>
          ) : <span className="text-sm">Social links will appear here.</span>}
        </footer>
      </div>
    </article>
  );
}

function TemplateHero({
  template,
  accent,
  data,
  name,
  role,
  location,
  image,
  bio,
}: {
  template: TemplateId;
  accent: Accent;
  data: ProfilePreviewData;
  name: string;
  role: string;
  location: string;
  image: string | null;
  bio: string;
}) {
  if (template === 'cinematic') return <div className="relative min-h-[70vh]"><PreviewImage src={image} name={name} accent={accent} className="absolute inset-0 h-full w-full opacity-70" /><div className="absolute inset-0 flex items-end p-6 sm:p-12" style={{ background: `linear-gradient(transparent 25%, ${accent.overlayBackground} 100%)` }}><div><p className="text-xs uppercase tracking-[0.24em]">{role}</p><h1 className="mt-3 font-serif text-5xl leading-none sm:text-8xl">{name}</h1>{data.demoReelUrl && <p className="mt-6 text-sm uppercase tracking-[0.18em]">▶ Play reel</p>}</div></div></div>;
  if (template === 'editorial') return <div className="grid gap-8 px-5 py-12 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-16"><PreviewImage src={data.headshotUrl} name={name} accent={accent} className="max-h-[65vh] min-h-96 w-full" /><div className="lg:pt-12"><p className="text-xs uppercase tracking-[0.22em]" style={{ color: accent.accent }}>Profile journal · {role}</p><h1 className="mt-5 font-serif text-5xl leading-[0.9] sm:text-7xl">{name}</h1><p className="mt-8 columns-1 font-serif text-lg leading-relaxed sm:columns-2" style={{ color: accent.secondaryText }}>{bio}</p></div></div>;
  if (template === 'portrait') return <div className="grid min-h-[70vh] md:grid-cols-[1.1fr_0.9fr]"><PreviewImage src={data.headshotUrl} name={name} accent={accent} className="min-h-[60vh] w-full" /><div className="flex flex-col justify-center p-8 sm:p-14" style={{ backgroundColor: accent.surface, color: accent.primaryText }}><p className="text-xs uppercase tracking-[0.22em]" style={{ color: accent.accent }}>Portrait / Practice</p><h1 className="mt-5 font-serif text-5xl leading-none sm:text-7xl">{name}</h1><p className="mt-5 text-lg">{role}</p><p className="mt-2 text-sm" style={{ color: accent.secondaryText }}>{location}</p></div></div>;
  if (template === 'minimalist') return <div className="mx-auto max-w-5xl px-5 py-24 text-center"><p className="text-xs uppercase tracking-[0.3em]">Studio index / 01</p><h1 className="mt-12 font-serif text-5xl sm:text-8xl">{name}</h1><p className="mt-6 text-xs uppercase tracking-[0.22em]" style={{ color: accent.accent }}>{role}</p><p className="mx-auto mt-12 max-w-xl text-base leading-relaxed" style={{ color: accent.secondaryText }}>{bio}</p></div>;
  if (template === 'stage') return <div className="grid min-h-[72vh] md:grid-cols-[0.8fr_1.2fr]"><div className="flex flex-col justify-between p-8 sm:p-14"><p className="font-serif text-lg italic">Stage / Live practice</p><div><h1 className="font-serif text-6xl leading-[0.85] sm:text-8xl">{name}</h1><p className="mt-6 text-xs uppercase tracking-[0.22em]">{role}</p></div><p className="text-sm">{data.experience[0]?.production || data.experience[0]?.title || 'Performance credits'}{location ? ` · ${location}` : ''}</p></div><PreviewImage src={data.headshotUrl} name={name} accent={accent} className="min-h-[60vh] w-full opacity-90" /></div>;
  return <div className="px-5 py-14 sm:px-10 lg:px-16"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.22em]" style={{ color: accent.accent }}>Independent creative studio</p><h1 className="mt-4 font-serif text-5xl sm:text-7xl">{name}</h1></div><p className="max-w-sm text-sm leading-relaxed" style={{ color: accent.secondaryText }}>{bio}</p></div><div className="mt-12 grid gap-4 sm:grid-cols-3">{[image, data.gallery[1], data.projects[0]?.poster_url].map((src, index) => <PreviewImage key={index} src={src} name={name} accent={accent} className={`${index === 1 ? 'sm:mt-10' : ''} aspect-[4/3] w-full`} />)}</div></div>;
}

function PreviewImage({ src, name, accent, className }: { src?: string | null; name: string; accent: Accent; className: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`} style={{ backgroundColor: accent.accentSoft, color: accent.secondaryText }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="px-3 text-center font-serif text-sm">{name}</span>
      )}
    </div>
  );
}

function SectionHeading({ label, accent }: { label: string; accent: Accent }) {
  return <h2 className="mb-5 border-b pb-3 text-xs uppercase tracking-[0.22em]" style={{ borderColor: accent.border, color: accent.accent }}>{label}</h2>;
}

function TokenList({ values, accent }: { values: string[]; accent: Accent }) {
  return values.length ? <div className="flex flex-wrap gap-2">{values.map((value) => <span key={value} className="border px-3 py-1.5 text-sm" style={{ borderColor: accent.border }}>{value}</span>)}</div> : <EmptyPreview>Languages and skills will appear here.</EmptyPreview>;
}

function EmptyPreview({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed border-current/25 p-5 font-serif text-sm italic opacity-70">{children}</p>;
}
